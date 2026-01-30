"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraphQL } from "@/hooks/use-graphql";
import { Loader2 } from "lucide-react";

interface ChatbotSettings {
  id: string;
  tradesman_id: string;
  has_api_key: boolean;
  greeting_message: string;
  system_prompt_override: string | null;
  model_name: string;
  is_active: boolean;
}

interface SettingsFormProps {
  userId: string;
  role: string;
}

export function SettingsForm({ userId, role }: SettingsFormProps) {
  const { query } = useGraphQL();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("Hello! How can I help you today?");
  const [systemPromptOverride, setSystemPromptOverride] = useState("");
  const [modelName, setModelName] = useState("gemini-2.0-flash");
  const [isActive, setIsActive] = useState(true);

  // For admin, we'd need a tradesman selector. For now, use own userId if tradesman.
  const tradesmanId = role === "tradesman" ? userId : userId;

  const loadSettings = useCallback(async () => {
    try {
      const data = await query<{ chatbotSettings: ChatbotSettings | null }>(
        `query ($tradesman_id: String!) {
          chatbotSettings(tradesman_id: $tradesman_id) {
            id tradesman_id has_api_key greeting_message
            system_prompt_override model_name is_active
          }
        }`,
        { tradesman_id: tradesmanId },
      );

      if (data.chatbotSettings) {
        setSettings(data.chatbotSettings);
        setGreetingMessage(data.chatbotSettings.greeting_message);
        setSystemPromptOverride(data.chatbotSettings.system_prompt_override ?? "");
        setModelName(data.chatbotSettings.model_name);
        setIsActive(data.chatbotSettings.is_active);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [query, tradesmanId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const input: Record<string, unknown> = {
        greeting_message: greetingMessage,
        system_prompt_override: systemPromptOverride || null,
        model_name: modelName,
        is_active: isActive,
      };
      if (apiKey) {
        input.gemini_api_key = apiKey;
      }

      const data = await query<{ updateChatbotSettings: ChatbotSettings }>(
        `mutation ($tradesman_id: String!, $input: UpdateChatbotSettingsInput!) {
          updateChatbotSettings(tradesman_id: $tradesman_id, input: $input) {
            id tradesman_id has_api_key greeting_message
            system_prompt_override model_name is_active
          }
        }`,
        { tradesman_id: tradesmanId, input },
      );

      setSettings(data.updateChatbotSettings);
      setApiKey("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          Configure your AI chat bot settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600">Settings saved.</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-key">Gemini API Key</Label>
          <div className="flex items-center gap-2">
            <Input
              id="api-key"
              type="password"
              placeholder={settings?.has_api_key ? "Key saved — enter new key to replace" : "Enter your Gemini API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {settings?.has_api_key && (
              <Badge variant="secondary">Saved</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            If left blank, the platform&apos;s default key will be used.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting">Greeting Message</Label>
          <Textarea
            id="greeting"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="system-prompt">System Prompt Override</Label>
          <Textarea
            id="system-prompt"
            placeholder="Additional instructions for the AI bot (optional)"
            value={systemPromptOverride}
            onChange={(e) => setSystemPromptOverride(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {systemPromptOverride.length}/1000 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <select
            id="model"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
            <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash (Preview)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="active">Chat bot active</Label>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}
