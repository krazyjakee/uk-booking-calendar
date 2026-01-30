import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardContent } from "./dashboard-content";

export const metadata = {
  title: "Dashboard — UK Booking Calendar",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardContent
      name={user.name}
      email={user.email}
      role={user.role}
    />
  );
}
