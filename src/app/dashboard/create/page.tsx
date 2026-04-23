import { Suspense } from "react";
import QuizCreator from "./QuizCreator";

export const metadata = {
  title: "Create Quiz | Aetheria Quiz",
  description: "Build and publish a new quiz for your students or community.",
};

export default function CreateQuizPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-8 text-center text-white">Loading creator...</div>}>
      <QuizCreator />
    </Suspense>
  );
}
