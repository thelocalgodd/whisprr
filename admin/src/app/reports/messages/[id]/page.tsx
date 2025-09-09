"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { reportApi, contentFlagApi } from "@/lib/api";

export default function MessageReportDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    setLoading(true);
    try {
      const result = await reportApi.getReportById(id);
      if (result.success) {
        setReport(result.data);
      } else {
        // Fallback to mock data if API fails
        setReport({
          id: id,
          reporter: "AnonymousUser512",
          target: "AnonymousUser339",
          reason: "Harassment",
          description:
            "This user sent multiple threatening messages and continued after being asked to stop.",
          createdAt: "2025-08-01 10:22",
          status: "open",
          reportedMessage: {
            content:
              "You are worthless and should just give up. Nobody cares about you.",
            timestamp: "2025-08-01 09:45",
            messageId: "msg_12345",
          },
          context: [
            {
              sender: "AnonymousUser339",
              content: "Hey, can someone help me with anxiety management?",
              timestamp: "2025-08-01 09:40",
            },
            {
              sender: "AnonymousUser512",
              content:
                "You are worthless and should just give up. Nobody cares about you.",
              timestamp: "2025-08-01 09:45",
            },
            {
              sender: "AnonymousUser339",
              content: "That's really hurtful, please stop.",
              timestamp: "2025-08-01 09:46",
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      let result;
      switch (action) {
        case "resolve":
          result = await reportApi.reviewReport(id, {
            status: "resolved",
            reviewNotes: "Report has been resolved",
          });
          break;
        case "delete":
          if (report?.reportedMessage?.messageId) {
            result = await contentFlagApi.moderateMessage(
              report.reportedMessage.messageId,
              { action: "delete", reason: "Violation of community guidelines" }
            );
          }
          break;
        case "warn":
          result = await contentFlagApi.moderateMessage(
            report?.reportedMessage?.messageId || id,
            { action: "warn", reason: "Inappropriate behavior" }
          );
          break;
        case "suspend":
          result = await contentFlagApi.moderateMessage(
            report?.reportedMessage?.messageId || id,
            { action: "suspend", reason: "Repeated violations" }
          );
          break;
        case "dismiss":
          result = await reportApi.reviewReport(id, {
            status: "dismissed",
            reviewNotes: "Report dismissed - no action required",
          });
          break;
        default:
          break;
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: `Action "${action}" completed successfully`,
        });
        router.push("/reports/messages");
      } else {
        toast({
          title: "Error",
          description: result?.error || `Failed to ${action} report`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} report`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !report) {
    return <div>Loading...</div>;
  }

  if (!report) {
    return <div>Report not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Message Report Details
        </h2>
        <p className="text-sm text-muted-foreground">Report ID: {id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Reporter</div>
                  <div className="font-medium">{report.reporter}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Target User
                  </div>
                  <div className="font-medium">{report.target}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Reason</div>
                  <div className="font-medium">{report.reason}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium capitalize">{report.status}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Description
                </div>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {report.description}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reported Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
                <div className="text-sm text-muted-foreground mb-2">
                  Message ID: {report.reportedMessage.messageId} •{" "}
                  {report.reportedMessage.timestamp}
                </div>
                <div className="font-medium">
                  {report.reportedMessage.content}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.context.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-md ${
                      msg.content === report.reportedMessage.content
                        ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-sm text-muted-foreground mb-1">
                      {msg.sender} • {msg.timestamp}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => handleAction("resolve")}
                disabled={loading}
              >
                Mark as Resolved
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => handleAction("delete")}
                disabled={loading}
              >
                Remove Message
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleAction("warn")}
                disabled={loading}
              >
                Warn User
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleAction("suspend")}
                disabled={loading}
              >
                Suspend User
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => handleAction("dismiss")}
                disabled={loading}
              >
                Dismiss Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  Previous reports: <span className="font-medium">2</span>
                </div>
                <div>
                  Account age: <span className="font-medium">3 months</span>
                </div>
                <div>
                  Messages sent: <span className="font-medium">1,247</span>
                </div>
                <div>
                  Warnings: <span className="font-medium">1</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
