import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Register — UK Booking Calendar",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  // Authenticated non-admins shouldn't be here
  if (user && user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <RegisterForm
      isAdmin={user?.role === "admin"}
      isAuthenticated={!!user}
    />
  );
}
