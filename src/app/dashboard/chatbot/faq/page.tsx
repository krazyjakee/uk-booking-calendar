import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FaqContent } from "./faq-content";

export const metadata = {
  title: "FAQ Management — UK Booking Calendar",
};

export default async function FaqPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">FAQ / Knowledge Base</h1>
      <FaqContent userId={user.sub} role={user.role} />
    </div>
  );
}
