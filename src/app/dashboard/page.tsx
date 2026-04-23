import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "TEACHER" || session.user.role === "ADMIN") {
    redirect("/dashboard/teacher");
  } else {
    redirect("/dashboard/student");
  }
}
