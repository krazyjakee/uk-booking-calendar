"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraphQL } from "@/hooks/use-graphql";
import { Plus, Trash2, Loader2, Copy } from "lucide-react";

interface AllowedDomain {
  id: string;
  domain: string;
  is_active: boolean;
}

interface DomainsContentProps {
  userId: string;
  role: string;
}

export function DomainsContent({ userId, role }: DomainsContentProps) {
  const { query } = useGraphQL();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tradesmanId = role === "tradesman" ? userId : userId;

  const loadDomains = useCallback(async () => {
    try {
      const data = await query<{ allowedDomains: AllowedDomain[] }>(
        `query ($tradesman_id: String!) {
          allowedDomains(tradesman_id: $tradesman_id) {
            id domain is_active
          }
        }`,
        { tradesman_id: tradesmanId },
      );
      setDomains(data.allowedDomains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load domains.");
    } finally {
      setLoading(false);
    }
  }, [query, tradesmanId]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  async function handleAdd() {
    if (!newDomain.trim()) return;
    setAdding(true);
    setError(null);

    try {
      await query(
        `mutation ($input: CreateAllowedDomainInput!) {
          createAllowedDomain(input: $input) { id }
        }`,
        {
          input: {
            tradesman_id: tradesmanId,
            domain: newDomain.trim(),
          },
        },
      );
      setNewDomain("");
      await loadDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add domain.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await query(
        `mutation ($id: String!, $is_active: Boolean!) {
          updateAllowedDomain(id: $id, is_active: $is_active) { id }
        }`,
        { id, is_active: isActive },
      );
      await loadDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update domain.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this domain?")) return;
    try {
      await query(
        `mutation ($id: String!) { deleteAllowedDomain(id: $id) }`,
        { id },
      );
      await loadDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete domain.");
    }
  }

  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/widget.js" data-tradesman-id="${tradesmanId}" async></script>`;

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Domains</CardTitle>
          <CardDescription>
            Add the domains where your chat widget will be embedded. The widget
            will only work on these domains.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={adding || !newDomain.trim()}>
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add
            </Button>
          </div>

          {domains.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No domains configured. Add a domain to enable the widget.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-mono text-sm">
                      {domain.domain}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={domain.is_active}
                          onCheckedChange={(checked) =>
                            handleToggle(domain.id, checked)
                          }
                        />
                        <Badge variant={domain.is_active ? "default" : "secondary"}>
                          {domain.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
          <CardDescription>
            Copy this code and paste it into your website to embed the chat
            widget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <pre className="rounded-md bg-muted p-4 text-sm font-mono overflow-x-auto">
                {embedCode}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyEmbed}
              >
                <Copy className="mr-2 h-3 w-3" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Optional attributes:</strong>
              </p>
              <p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">data-position</code>{" "}
                — <code className="text-xs">bottom-right</code> (default) or{" "}
                <code className="text-xs">bottom-left</code>
              </p>
              <p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">data-accent-colour</code>{" "}
                — hex colour for the chat button (e.g.{" "}
                <code className="text-xs">#3B5998</code>)
              </p>
              <p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">data-greeting</code>{" "}
                — custom greeting message
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
