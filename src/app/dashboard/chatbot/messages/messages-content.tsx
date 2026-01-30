"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraphQL } from "@/hooks/use-graphql";
import {
  MailOpen,
  Mail,
  Trash2,
  Loader2,
  MoreHorizontal,
  CheckCheck,
  Phone,
} from "lucide-react";

interface ChatMessage {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface MessagesContentProps {
  userId: string;
  role: string;
}

const PAGE_SIZE = 20;

export function MessagesContent({ userId, role }: MessagesContentProps) {
  const { query } = useGraphQL();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const tradesmanId = role === "tradesman" ? userId : userId;

  const loadMessages = useCallback(async () => {
    try {
      const [messagesData, countData] = await Promise.all([
        query<{ chatMessages: ChatMessage[] }>(
          `query ($tradesman_id: String!, $page: Int!, $page_size: Int!) {
            chatMessages(tradesman_id: $tradesman_id, page: $page, page_size: $page_size) {
              id customer_name customer_email customer_phone
              message is_read created_at
            }
          }`,
          { tradesman_id: tradesmanId, page, page_size: PAGE_SIZE },
        ),
        query<{ chatMessagesCount: number }>(
          `query ($tradesman_id: String!) {
            chatMessagesCount(tradesman_id: $tradesman_id)
          }`,
          { tradesman_id: tradesmanId },
        ),
      ]);
      setMessages(messagesData.chatMessages);
      setTotalCount(countData.chatMessagesCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load messages.",
      );
    } finally {
      setLoading(false);
    }
  }, [query, tradesmanId, page]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function handleToggleRead(id: string, isRead: boolean) {
    try {
      await query(
        `mutation ($id: String!, $is_read: Boolean!) {
          markChatMessageRead(id: $id, is_read: $is_read) { id }
        }`,
        { id, is_read: isRead },
      );
      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update message.",
      );
    }
  }

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      await query(
        `mutation ($tradesman_id: String!) {
          markAllChatMessagesRead(tradesman_id: $tradesman_id)
        }`,
        { tradesman_id: tradesmanId },
      );
      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all messages as read.",
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    try {
      await query(`mutation ($id: String!) { deleteChatMessage(id: $id) }`, {
        id,
      });
      if (selectedMessage?.id === id) setSelectedMessage(null);
      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete message.",
      );
    }
  }

  function openMessage(msg: ChatMessage) {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      handleToggleRead(msg.id, true);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const unreadCount = messages.filter((m) => !m.is_read).length;

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-centre justify-between">
          <div>
            <CardTitle>
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Messages left by customers via the chat widget.
            </CardDescription>
          </div>
          {messages.length > 0 && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Mark all read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-centre">
              No messages yet. Messages from the chat widget will appear here.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Message
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow
                      key={msg.id}
                      className={`cursor-pointer ${!msg.is_read ? "bg-muted/50" : ""}`}
                      onClick={() => openMessage(msg)}
                    >
                      <TableCell>
                        {msg.is_read ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`text-sm ${!msg.is_read ? "font-semibold" : ""}`}
                        >
                          {msg.customer_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {msg.customer_email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                          {msg.message}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(msg.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRead(msg.id, !msg.is_read);
                              }}
                            >
                              {msg.is_read ? (
                                <>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Mark unread
                                </>
                              ) : (
                                <>
                                  <MailOpen className="mr-2 h-4 w-4" />
                                  Mark read
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(msg.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({totalCount} messages)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.customer_name}</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedMessage.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedMessage.customer_email}`}
                      className="text-primary hover:underline"
                    >
                      {selectedMessage.customer_email}
                    </a>
                  </div>
                  {selectedMessage.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${selectedMessage.customer_phone}`}
                        className="text-primary hover:underline"
                      >
                        {selectedMessage.customer_phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleRead(
                        selectedMessage.id,
                        !selectedMessage.is_read,
                      )
                    }
                  >
                    {selectedMessage.is_read ? (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Mark unread
                      </>
                    ) : (
                      <>
                        <MailOpen className="mr-2 h-4 w-4" />
                        Mark read
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
