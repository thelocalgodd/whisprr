"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, MessageSquare, User, Clock, Shield } from "lucide-react";
import { reportApi, contentFlagApi } from "@/lib/api";

interface MessageDetail {
  _id: string;
  sender: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
      avatar?: string;
    };
  };
  group: {
    _id: string;
    name: string;
    type: string;
  };
  content: {
    text: string;
    type?: string;
  };
  moderation: {
    flagged: boolean;
    action: string;
    actionBy?: string;
    actionAt?: string;
    reason?: string;
  };
  crisis: {
    detected: boolean;
    keywords: string[];
    severity: string;
    confidence?: number;
  };
  status: {
    sentAt: string;
    editedAt?: string;
    deletedAt?: string;
  };
  reports?: Array<{
    reporter: string;
    reason: string;
    description: string;
    createdAt: string;
  }>;
  conversation?: Array<{
    _id: string;
    sender: string;
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function MessageReportDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessageDetails = async () => {
      try {
        setLoading(true);
        const response = await reportApi.getReportById(id);
        
        if (response?.success && response?.data) {
          setMessage(response.data);
          setError(null);
        } else if (response?.data) {
          setMessage(response.data);
          setError(null);
        } else {
          setError(response?.error || 'Failed to fetch message details');
        }
      } catch (err) {
        setError('An error occurred while fetching message details');
        console.error('Message detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageDetails();
  }, [id]);

  const handleAction = async (action: string, reason?: string) => {
    if (!message) return;
    
    try {
      setActionLoading(action);
      
      let response;
      switch (action) {
        case 'resolve':
          response = await reportApi.reviewReport(id, { 
            status: 'resolved',
            reviewNotes: 'Resolved from admin panel' 
          });
          break;
        case 'remove':
          response = await contentFlagApi.moderateMessage(id, { 
            action: 'remove',
            reason: reason || 'Violated community guidelines' 
          });
          break;
        case 'warn':
          response = await contentFlagApi.moderateMessage(id, { 
            action: 'warn',
            reason: reason || 'Warning issued for inappropriate content' 
          });
          break;
        case 'suspend':
          response = await contentFlagApi.moderateMessage(id, { 
            action: 'suspend',
            reason: reason || 'Account suspended for policy violations' 
          });
          break;
        case 'dismiss':
          response = await reportApi.reviewReport(id, { 
            status: 'dismissed',
            reviewNotes: 'Report dismissed - no action needed' 
          });
          break;
        default:
          throw new Error('Unknown action');
      }
      
      if (response?.success) {
        // Update local state
        setMessage(prev => prev ? {
          ...prev,
          moderation: {
            ...prev.moderation,
            action: action === 'dismiss' ? 'none' : action,
            actionAt: new Date().toISOString()
          }
        } : null);
        
        // Show success and redirect after a delay
        setTimeout(() => {
          router.push('/reports/messages');
        }, 1500);
      }
    } catch (err) {
      console.error(`Action ${action} error:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Message Report Details
          </h2>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading message details...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Message Report Details
          </h2>
          <p className="text-sm text-muted-foreground">Report ID: {id}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error || 'Message not found'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
              <CardTitle>Message Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Sender</div>
                  <div className="font-medium">
                    {message.sender.profile.displayName}
                    <span className="text-sm text-muted-foreground ml-2">
                      @{message.sender.username}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Group</div>
                  <div className="font-medium">{message.group.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Sent At</div>
                  <div className="font-medium">
                    {new Date(message.status.sentAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={message.moderation.flagged ? "destructive" : "default"}>
                    {message.moderation.action || 'pending'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-md ${
                message.moderation.flagged 
                  ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" 
                  : "bg-muted"
              }`}>
                <div className="font-medium">{message.content.text}</div>
              </div>
            </CardContent>
          </Card>

          {message.crisis.detected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Crisis Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Severity</span>
                  <Badge className={getSeverityColor(message.crisis.severity)}>
                    {message.crisis.severity.toUpperCase()}
                  </Badge>
                </div>
                {message.crisis.keywords.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Detected Keywords
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.crisis.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {message.crisis.confidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {(message.crisis.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {message.reports && message.reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {message.reports.map((report, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">
                        {report.reporter} • {new Date(report.createdAt).toLocaleString()}
                      </div>
                      <div className="font-medium text-sm mb-1">{report.reason}</div>
                      {report.description && (
                        <div className="text-sm text-muted-foreground">
                          {report.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {message.conversation && message.conversation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conversation Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {message.conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md ${
                        msg._id === message._id
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
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => handleAction('resolve')}
                disabled={actionLoading !== null || message.moderation.action === 'resolved'}
              >
                {actionLoading === 'resolve' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as Resolved
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => handleAction('remove')}
                disabled={actionLoading !== null || message.moderation.action === 'removed'}
              >
                {actionLoading === 'remove' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove Message
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleAction('warn')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'warn' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Warn User
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleAction('suspend')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'suspend' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Suspend User
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => handleAction('dismiss')}
                disabled={actionLoading !== null || message.moderation.action === 'dismissed'}
              >
                {actionLoading === 'dismiss' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Dismiss Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sender:</span>
                  <span className="font-medium">{message.sender.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Group:</span>
                  <span className="font-medium">{message.group.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {message.moderation.actionAt && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Action taken:</span>
                    <span className="font-medium">
                      {new Date(message.moderation.actionAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}