import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DemoContent } from "./demo-content";

export const metadata = {
  title: "Widget Demo — UK Booking Calendar",
};

export default async function DemoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Widget Demo</h1>
      <DemoContent userId={user.sub} role={user.role} />
    </div>
  );
}
