import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardRoot() {
  const session = await auth();

  // 1. Security: If not logged in, go to login
  if (!session) {
    redirect("/api/auth/signin");
  }

  // 2. Traffic Control: Redirect based on Role
  const role = session.user.role;

  switch (role) {
    case "CASHIER":
      redirect("/dashboard/cashier");
    case "KITCHEN":
      redirect("/dashboard/kitchen");
    case "BARISTA":
      redirect("/dashboard/barista");
    case "ADMIN":
      // Admins might want to see the cashier view by default, or a special admin panel
      redirect("/dashboard/cashier"); 
    default:
      // Fallback for weird errors
      return <div>Error: Role not recognized</div>;
  }
}