import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FoulContentDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Mock data - in real app, fetch based on ID
  const report = {
    id: id,
    contentType: "message" as const,
    category: "harassment" as const,
    severity: "high" as const,
    createdAt: "2025-08-06 08:12",
    status: "open" as const,
    flaggedContent: {
      content:
        "You are completely worthless and should just disappear forever. Nobody would miss you anyway.",
      messageId: "msg_67890",
      timestamp: "2025-08-06 07:45",
      sender: "AnonymousUser445",
    },
    detectionMethod: "AI Content Filter",
    confidence: 0.95,
    context: [
      {
        sender: "AnonymousUser123",
        content: "I'm really struggling today and could use some support...",
        timestamp: "2025-08-06 07:40",
      },
      {
        sender: "AnonymousUser445",
        content:
          "You are completely worthless and should just disappear forever. Nobody would miss you anyway.",
        timestamp: "2025-08-06 07:45",
      },
      {
        sender: "AnonymousUser123",
        content: "That's really hurtful... I was just asking for help",
        timestamp: "2025-08-06 07:46",
      },
    ],
    similarFlags: 3,
    userHistory: {
      accountAge: "2 months",
      messagesSent: 892,
      previousFlags: 5,
      warnings: 2,
      suspensions: 0,
    },
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-950/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Foul Content Details
        </h2>
        <p className="text-sm text-muted-foreground">Flag ID: {id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flag Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Content Type
                  </div>
                  <div className="font-medium capitalize">
                    {report.contentType}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium capitalize">
                    {report.category}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Severity</div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                      report.severity
                    )}`}
                  >
                    {report.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Detection Method
                  </div>
                  <div className="font-medium">{report.detectionMethod}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Confidence
                  </div>
                  <div className="font-medium">
                    {Math.round(report.confidence * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium capitalize">{report.status}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flagged Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
                <div className="text-sm text-muted-foreground mb-2">
                  From: {report.flaggedContent.sender} • Message ID:{" "}
                  {report.flaggedContent.messageId}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {report.flaggedContent.timestamp}
                </div>
                <div className="font-medium">
                  {report.flaggedContent.content}
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
                      msg.content === report.flaggedContent.content
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
              <CardTitle>Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">Remove Content</Button>
              <Button variant="destructive" className="w-full">
                Suspend User
              </Button>
              <Button variant="outline" className="w-full">
                Issue Warning
              </Button>
              <Button variant="outline" className="w-full">
                Restrict User
              </Button>
              <Button variant="ghost" className="w-full">
                Mark as False Positive
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  Username:{" "}
                  <span className="font-medium">
                    {report.flaggedContent.sender}
                  </span>
                </div>
                <div>
                  Account age:{" "}
                  <span className="font-medium">
                    {report.userHistory.accountAge}
                  </span>
                </div>
                <div>
                  Messages sent:{" "}
                  <span className="font-medium">
                    {report.userHistory.messagesSent.toLocaleString()}
                  </span>
                </div>
                <div>
                  Previous flags:{" "}
                  <span className="font-medium text-red-600">
                    {report.userHistory.previousFlags}
                  </span>
                </div>
                <div>
                  Warnings issued:{" "}
                  <span className="font-medium text-yellow-600">
                    {report.userHistory.warnings}
                  </span>
                </div>
                <div>
                  Suspensions:{" "}
                  <span className="font-medium text-red-600">
                    {report.userHistory.suspensions}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Similar Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="mb-2">
                  Found{" "}
                  <span className="font-medium">{report.similarFlags}</span>{" "}
                  similar flags from this user in the past 30 days.
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Similar Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
