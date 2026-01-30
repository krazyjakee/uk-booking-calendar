import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Chat Settings — UK Booking Calendar",
};

export default async function ChatbotSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Chat Bot Settings</h1>
      <SettingsForm userId={user.sub} role={user.role} />
    </div>
  );
}
