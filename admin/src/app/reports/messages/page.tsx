"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { reportApi } from "@/lib/api";

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
    };
  };
  group: {
    _id: string;
    name: string;
    type: string;
  };
  content: {
    text: string;
  };
  moderation: {
    flagged: boolean;
    action: string;
  };
  crisis: {
    detected: boolean;
    keywords: string[];
    severity: string;
  };
  status: {
    sentAt: string;
  };
  createdAt: string;
  conversationId: string;
  messageType: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function MessageReportsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await reportApi.getReports({
          type: "message",
          limit: 50,
        });

        if (response.success && response.data) {
          setMessages(response.data.messages || []);
          setPagination(response.data.pagination || null);
          setError(null);
        } else {
          setError(response.error || "Failed to fetch messages");
        }
      } catch (err) {
        setError("An error occurred while fetching messages");
        console.error("Messages fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleUpdateStatus = async (messageId: string, action: string) => {
    try {
      const response = await reportApi.reviewReport(messageId, { action });
      if (response.success) {
        setMessages(
          messages.map((message) =>
            message._id === messageId
              ? { ...message, moderation: { ...message.moderation, action } }
              : message
          )
        );
      }
    } catch (err) {
      console.error("Update message moderation error:", err);
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case "none":
        return "secondary";
      case "removed":
        return "destructive";
      case "reviewed":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Message Reports</h2>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading messages...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Message Reports</h2>
          <p className="text-sm text-muted-foreground">
            User-submitted message reports.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading messages: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Message Reports</h2>
        <p className="text-sm text-muted-foreground">
          User-submitted message reports.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Crisis Severity</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message._id}>
                  <TableCell className="font-medium">
                    <div>{message.sender.profile.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      @{message.sender.username}
                    </div>
                  </TableCell>
                  <TableCell>{message.group.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {message.content.text}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getSeverityVariant(message.crisis.severity)}
                    >
                      {message.crisis.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(message.status.sentAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getActionVariant(message.moderation.action)}
                    >
                      {message.moderation.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/reports/messages/${message._id}`}>
                        View Details
                      </Link>
                    </Button>
                    {message.moderation.action === "none" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(message._id, "reviewed")
                          }
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(message._id, "removed")
                          }
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {messages.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No message reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
