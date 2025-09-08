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
import { AlertCircle, Clock, FileText, User, Loader2 } from "lucide-react";
import { counselorApi } from "@/lib/api";

interface CounselorApplication {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    avatar?: string;
  };
  applicationData: {
    firstName: string;
    lastName: string;
    education: Array<{
      degree: string;
      institution: string;
      graduationYear: number;
    }>;
    specializations: string[];
    experience: Array<{
      position: string;
      organization: string;
      yearsExperience?: number;
    }>;
  };
  status: string;
  submittedAt: string;
  completionPercentage?: number;
}

interface ApplicationStats {
  submitted: number;
  underReview: number;
  pendingDocuments: number;
  approved: number;
  rejected: number;
  total: number;
  lastMonthApplications: number;
}

export default function PendingCounselorsPage() {
  const [applications, setApplications] = useState<CounselorApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch applications and stats in parallel
        const [applicationsResponse, statsResponse] = await Promise.all([
          counselorApi.getPendingCounselors({ limit: 50, status: 'all' }),
          counselorApi.getApplicationStats()
        ]);

        if (applicationsResponse?.data?.applications) {
          setApplications(applicationsResponse.data.applications);
        }

        if (statsResponse?.data) {
          setStats(statsResponse.data);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
        console.error('Applications fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickApprove = async (applicationId: string) => {
    try {
      await counselorApi.approveCounselor(applicationId, { approvalNotes: 'Quick approval from admin panel' });
      
      // Update local state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: 'approved' } : app
      ));
    } catch (err) {
      console.error('Approve application error:', err);
    }
  };

  const handleQuickReject = async (applicationId: string) => {
    try {
      await counselorApi.rejectCounselor(applicationId, { 
        rejectionReason: 'other',
        rejectionNotes: 'Rejected from admin panel' 
      });
      
      // Update local state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: 'rejected' } : app
      ));
    } catch (err) {
      console.error('Reject application error:', err);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'under_review': return 'secondary';
      case 'pending_documents': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Counselors</h2>
          <p className="text-sm text-muted-foreground">
            Loading applications...
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Loading applications...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Pending Counselors</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve counselor applications.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading applications: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pending Counselors</h2>
        <p className="text-sm text-muted-foreground">
          Review and approve counselor applications.
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">New Applications</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Under Review</p>
                  <p className="text-2xl font-bold">{stats.underReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Education</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app._id}>
                  <TableCell>
                    <div className="font-medium">
                      {app.applicationData?.firstName} {app.applicationData?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{app.userId.username}
                    </div>
                  </TableCell>
                  <TableCell>{app.userId.email}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {app.applicationData?.education?.[0] ? (
                      <div>
                        <div className="font-medium">{app.applicationData.education[0].degree}</div>
                        <div className="text-muted-foreground">{app.applicationData.education[0].institution}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {app.applicationData?.specializations?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {app.applicationData.specializations.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec.replace('_', ' ')}
                          </Badge>
                        ))}
                        {app.applicationData.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.applicationData.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/counselors/pending/${app._id}`}>
                          Review
                        </Link>
                      </Button>
                      {(app.status === "submitted" || app.status === "under_review") && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleQuickApprove(app._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleQuickReject(app._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No pending applications found
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