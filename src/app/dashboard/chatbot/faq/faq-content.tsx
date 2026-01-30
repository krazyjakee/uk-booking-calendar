"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraphQL } from "@/hooks/use-graphql";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

interface FaqContentProps {
  userId: string;
  role: string;
}

export function FaqContent({ userId, role }: FaqContentProps) {
  const { query } = useGraphQL();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const tradesmanId = role === "tradesman" ? userId : userId;

  const loadEntries = useCallback(async () => {
    try {
      const data = await query<{ faqEntries: FaqEntry[] }>(
        `query ($tradesman_id: String!) {
          faqEntries(tradesman_id: $tradesman_id) {
            id question answer category sort_order is_active
          }
        }`,
        { tradesman_id: tradesmanId },
      );
      setEntries(data.faqEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQ entries.");
    } finally {
      setLoading(false);
    }
  }, [query, tradesmanId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function openCreate() {
    setEditing(null);
    setQuestion("");
    setAnswer("");
    setCategory("");
    setSortOrder(entries.length);
    setDialogOpen(true);
  }

  function openEdit(entry: FaqEntry) {
    setEditing(entry);
    setQuestion(entry.question);
    setAnswer(entry.answer);
    setCategory(entry.category ?? "");
    setSortOrder(entry.sort_order);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      if (editing) {
        await query(
          `mutation ($id: String!, $input: UpdateFaqEntryInput!) {
            updateFaqEntry(id: $id, input: $input) { id }
          }`,
          {
            id: editing.id,
            input: {
              question,
              answer,
              category: category || null,
              sort_order: sortOrder,
            },
          },
        );
      } else {
        await query(
          `mutation ($input: CreateFaqEntryInput!) {
            createFaqEntry(input: $input) { id }
          }`,
          {
            input: {
              tradesman_id: tradesmanId,
              question,
              answer,
              category: category || null,
              sort_order: sortOrder,
            },
          },
        );
      }

      setDialogOpen(false);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ entry?")) return;

    try {
      await query(
        `mutation ($id: String!) { deleteFaqEntry(id: $id) }`,
        { id },
      );
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
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
    <Card>
      <CardHeader className="flex flex-row items-centre justify-between">
        <div>
          <CardTitle>FAQ Entries</CardTitle>
          <CardDescription>
            Questions and answers the chat bot can use to help customers.
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit FAQ" : "New FAQ Entry"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update this FAQ entry." : "Add a new question and answer."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="faq-question">Question</Label>
                <Textarea
                  id="faq-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-answer">Answer</Label>
                <Textarea
                  id="faq-answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faq-category">Category (optional)</Label>
                  <Input
                    id="faq-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Pricing, Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-sort">Sort Order</Label>
                  <Input
                    id="faq-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !question.trim() || !answer.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-centre">
            No FAQ entries yet. Add your first question and answer.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Order</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.question}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {entry.answer}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {entry.category && (
                      <Badge variant="outline">{entry.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{entry.sort_order}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={entry.is_active ? "default" : "secondary"}>
                      {entry.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
