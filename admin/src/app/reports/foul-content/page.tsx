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
import { AlertCircle } from "lucide-react";
import { contentFlagApi } from "@/lib/api";

interface ContentFlag {
  _id: string;
  userId: {
    _id: string;
    username: string;
    fullName: string;
  };
  contentType: "message" | "profile" | "group";
  contentSnippet: string;
  category: "hate" | "harassment" | "self-harm" | "sexual" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "reviewed" | "actioned" | "dismissed";
  createdAt: string;
}

export default function FoulContentPage() {
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContentFlags = async () => {
      try {
        setLoading(true);
        const response = await contentFlagApi.getContentFlags({ limit: 50 });
        
        if (response.success && response.data) {
          setContentFlags(response.data.flags);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch content flags');
        }
      } catch (err) {
        setError('An error occurred while fetching content flags');
        console.error('Content flags fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContentFlags();
  }, []);

  const handleUpdateStatus = async (flagId: string, status: string, action?: string) => {
    try {
      const response = await contentFlagApi.updateContentFlag(flagId, { status, action });
      if (response.success) {
        setContentFlags(contentFlags.map(flag => 
          flag._id === flagId ? { ...flag, status } : flag
        ));
      }
    } catch (err) {
      console.error('Update content flag status error:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Foul Content</h2>
          <p className="text-sm text-muted-foreground">
            Loading content flags...
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
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
          <h2 className="text-3xl font-bold tracking-tight">Foul Content</h2>
          <p className="text-sm text-muted-foreground">
            Flags for abusive or harmful content.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading content flags: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Foul Content</h2>
        <p className="text-sm text-muted-foreground">
          Flags for abusive or harmful content.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Content Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Snippet</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentFlags.map((flag) => (
                <TableRow key={flag._id}>
                  <TableCell className="font-medium">
                    {flag.userId?.username || 'Unknown'}
                  </TableCell>
                  <TableCell className="capitalize">{flag.contentType}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {flag.contentSnippet}
                  </TableCell>
                  <TableCell className="capitalize">{flag.category}</TableCell>
                  <TableCell>
                    <Badge variant={flag.severity === 'critical' ? 'destructive' : flag.severity === 'high' ? 'default' : 'secondary'}>
                      {flag.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={flag.status === 'open' ? 'destructive' : flag.status === 'actioned' ? 'default' : 'secondary'}>
                      {flag.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/reports/foul-content/${flag._id}`}>
                        View Details
                      </Link>
                    </Button>
                    {flag.status === "open" && (
                      <>
                        <Button size="sm" onClick={() => handleUpdateStatus(flag._id, 'actioned', 'content_removed')}>
                          Take Action
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(flag._id, 'dismissed')}>
                          Dismiss
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {contentFlags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No content flags found
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
