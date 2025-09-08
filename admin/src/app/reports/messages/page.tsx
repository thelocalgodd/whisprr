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
import { reportApi } from "@/lib/api";

interface Report {
  _id: string;
  type: string;
  reporter: {
    _id: string;
    username: string;
    fullName: string;
  };
  target: {
    _id: string;
    username: string;
    fullName: string;
  };
  reason: string;
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export default function MessageReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await reportApi.getReports({ type: 'message', limit: 50 });
        
        if (response.success && response.data) {
          setReports(response.data.reports);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch reports');
        }
      } catch (err) {
        setError('An error occurred while fetching reports');
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      const response = await reportApi.updateReportStatus(reportId, { status });
      if (response.success) {
        setReports(reports.map(report => 
          report._id === reportId ? { ...report, status } : report
        ));
      }
    } catch (err) {
      console.error('Update report status error:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Message Reports</h2>
          <p className="text-sm text-muted-foreground">
            Loading reports...
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
          <h2 className="text-3xl font-bold tracking-tight">Message Reports</h2>
          <p className="text-sm text-muted-foreground">
            User-submitted reports on messages.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading reports: {error}</span>
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
          User-submitted reports on messages.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell className="font-medium">{report.reporter.username}</TableCell>
                  <TableCell className="font-medium">{report.target.username}</TableCell>
                  <TableCell className="capitalize">{report.reason}</TableCell>
                  <TableCell>
                    <Badge variant={report.priority === 'urgent' ? 'destructive' : report.priority === 'high' ? 'default' : 'secondary'}>
                      {report.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'open' ? 'destructive' : report.status === 'resolved' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/reports/messages/${report._id}`}>
                        View Details
                      </Link>
                    </Button>
                    {report.status === "open" && (
                      <>
                        <Button size="sm" onClick={() => handleUpdateStatus(report._id, 'resolved')}>
                          Resolve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(report._id, 'dismissed')}>
                          Dismiss
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
