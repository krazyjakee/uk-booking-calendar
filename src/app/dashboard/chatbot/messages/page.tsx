import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MessagesContent } from "./messages-content";

export const metadata = {
  title: "Messages — UK Booking Calendar",
};

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Messages</h1>
      <MessagesContent userId={user.sub} role={user.role} />
    </div>
  );
}
