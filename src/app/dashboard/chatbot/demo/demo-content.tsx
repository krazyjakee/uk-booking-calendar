"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Tablet, Smartphone, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoContentProps {
  userId: string;
  role: string;
}

type DeviceSize = "desktop" | "tablet" | "mobile";

const devices: { id: DeviceSize; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px" },
];

export function DemoContent({ userId, role }: DemoContentProps) {
  const [device, setDevice] = useState<DeviceSize>("desktop");
  const tradesmanId = role === "tradesman" ? userId : userId;
  const previewUrl = `/chatbot-preview/${tradesmanId}`;

  const activeDevice = devices.find((d) => d.id === device)!;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your chat widget appears to customers on their website.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Device toggles */}
              <div className="flex items-center gap-1 rounded-md border bg-muted p-1">
                {devices.map((d) => (
                  <Button
                    key={d.id}
                    variant={device === d.id ? "default" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5 px-2.5"
                    onClick={() => setDevice(d.id)}
                  >
                    <d.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{d.label}</span>
                  </Button>
                ))}
              </div>

              {/* Open in new tab */}
              <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New tab</span>
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info banner */}
          <div className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This is a live preview using your current settings. The chat
              widget is fully functional — you can send messages and test the
              booking flow. Changes made in{" "}
              <a
                href="/dashboard/chatbot/settings"
                className="font-medium underline underline-offset-2"
              >
                Chat Settings
              </a>{" "}
              or{" "}
              <a
                href="/dashboard/chatbot/faq"
                className="font-medium underline underline-offset-2"
              >
                FAQ
              </a>{" "}
              will appear after refreshing this page.
            </p>
          </div>

          {/* Device frame */}
          <div className="flex justify-center">
            <div
              className={cn(
                "relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300",
                device !== "desktop" && "mx-auto",
              )}
              style={{
                width: activeDevice.width,
                maxWidth: "100%",
                height: device === "mobile" ? "667px" : "600px",
              }}
            >
              {/* Device chrome */}
              <div className="flex items-center gap-2 border-b bg-gray-100 px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 rounded-sm bg-white px-3 py-0.5 text-center">
                  <span className="text-xs text-gray-400 font-mono">
                    example.com
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {activeDevice.label}
                </Badge>
              </div>

              {/* iframe */}
              <iframe
                src={previewUrl}
                title="Chat widget preview"
                className="h-full w-full border-0"
                style={{ height: device === "mobile" ? "637px" : "570px" }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
