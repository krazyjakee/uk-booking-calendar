"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bot,
  Eye,
  HelpCircle,
  Globe,
  MessageSquare,
  Settings,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Chat Settings",
    href: "/dashboard/chatbot/settings",
    icon: Settings,
  },
  {
    label: "FAQ",
    href: "/dashboard/chatbot/faq",
    icon: HelpCircle,
  },
  {
    label: "Allowed Domains",
    href: "/dashboard/chatbot/domains",
    icon: Globe,
  },
  {
    label: "Messages",
    href: "/dashboard/chatbot/messages",
    icon: MessageSquare,
  },
  {
    label: "Widget Demo",
    href: "/dashboard/chatbot/demo",
    icon: Eye,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-1 border-r bg-background p-4 md:w-64 md:min-h-screen">
      <div className="mb-4 flex items-center gap-2 px-2">
        <Bot className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">UK Booking Calendar</span>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
