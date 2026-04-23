import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const formData = await req.formData();
    const mode = formData.get("mode") as string; // 'topic' or 'document'
    const difficulty = formData.get("difficulty") as string || "INTERMEDIATE";
    const questionCount = parseInt(formData.get("questionCount") as string || "5");

    let promptText = `Generate ${questionCount} quiz questions of ${difficulty} difficulty. Include a mix of multiple choice (MCQ) and SUBJECTIVE questions. 
Respond ONLY with a raw JSON array. Do not include markdown formatting like \`\`\`json. The structure for each question MUST be:
{
  "text": "Question text here",
  "points": 1,
  "type": "MCQ" | "SUBJECTIVE",
  "answers": [ // For MCQ only. Exactly 4 answers. Subjective questions should have an empty array.
    { "text": "Answer 1", "isCorrect": true },
    { "text": "Answer 2", "isCorrect": false },
    ...
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let result;

    if (mode === "topic") {
      const department = formData.get("department") as string;
      const subject = formData.get("subject") as string;
      const customTopic = formData.get("customTopic") as string;

      promptText += `\nTopic context: Department: ${department}, Subject: ${subject}, Topic: ${customTopic}`;
      result = await model.generateContent(promptText);

    } else if (mode === "document") {
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const tempFilePath = join(tmpdir(), `${Date.now()}-${file.name}`);
      
      writeFileSync(tempFilePath, buffer);

      try {
        const uploadResponse = await fileManager.uploadFile(tempFilePath, {
          mimeType: file.type || "application/pdf",
          displayName: file.name,
        });

        result = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResponse.file.mimeType,
              fileUri: uploadResponse.file.uri
            }
          },
          { text: promptText }
        ]);

        // Cleanup
        await fileManager.deleteFile(uploadResponse.file.name);
      } finally {
        unlinkSync(tempFilePath);
      }
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const textResponse = result.response.text();
    // Safely parse JSON from the response (sometimes Gemini includes markdown codeblocks despite instructions)
    let jsonStr = textResponse.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }

    const generatedQuestions = JSON.parse(jsonStr.trim());

    return NextResponse.json({ questions: generatedQuestions }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  }
}
