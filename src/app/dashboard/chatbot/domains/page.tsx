import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DomainsContent } from "./domains-content";

export const metadata = {
  title: "Allowed Domains — UK Booking Calendar",
};

export default async function DomainsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Allowed Domains</h1>
      <DomainsContent userId={user.sub} role={user.role} />
    </div>
  );
}
