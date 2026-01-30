import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="flex flex-col items-center gap-6 text-center px-8">
        <h1 className="text-4xl font-bold tracking-tight">
          UK Booking Calendar
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Appointment booking and AI chat bot platform for UK tradesmen.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
