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
import { AlertCircle, Clock, Loader2 } from "lucide-react";
import { counselorApi } from "@/lib/api";

interface Counselor {
  _id: string;
  username: string;
  email: string;
  counselorInfo: {
    isVerified: boolean;
    verificationStatus: "pending" | "approved" | "rejected";
    verificationDocuments: string[];
    specializations: string[];
    certifications: string[];
    availabilityStatus: boolean;
    rating: number;
    totalSessions: number;
  };
  profile: {
    displayName: string;
    bio: string;
    avatar: string;
    pronouns: string;
    timezone: string;
    languages: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PendingCounselorsPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await counselorApi.getPendingCounselors({ limit: 50 });

        if (response?.success && response?.data) {
          setCounselors(response.data.counselors || []);
          setPagination(response.data.pagination || null);
        } else if (response?.data) {
          setCounselors(response.data.counselors || []);
          setPagination(response.data.pagination || null);
        }

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch counselors"
        );
        console.error("Counselors fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickApprove = async (counselorId: string) => {
    try {
      await counselorApi.approveCounselor(counselorId, {
        approvalNotes: "Quick approval from admin panel",
      });

      setCounselors(
        counselors.map((counselor) =>
          counselor._id === counselorId
            ? {
                ...counselor,
                counselorInfo: {
                  ...counselor.counselorInfo,
                  verificationStatus: "approved",
                },
              }
            : counselor
        )
      );
    } catch (err) {
      console.error("Approve counselor error:", err);
    }
  };

  const handleQuickReject = async (counselorId: string) => {
    try {
      await counselorApi.rejectCounselor(counselorId, {
        rejectionReason: "other",
        rejectionNotes: "Rejected from admin panel",
      });

      setCounselors(
        counselors.map((counselor) =>
          counselor._id === counselorId
            ? {
                ...counselor,
                counselorInfo: {
                  ...counselor.counselorInfo,
                  verificationStatus: "rejected",
                },
              }
            : counselor
        )
      );
    } catch (err) {
      console.error("Reject counselor error:", err);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Pending Counselors
          </h2>
          <p className="text-sm text-muted-foreground">
            Loading counselor applications...
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading applications...
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
          <h2 className="text-3xl font-bold tracking-tight">
            Pending Counselors
          </h2>
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
        <h2 className="text-3xl font-bold tracking-tight">
          Pending Counselors
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and approve counselor applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({counselors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Counselor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counselors.map((counselor) => (
                <TableRow key={counselor._id}>
                  <TableCell>
                    <div className="font-medium">
                      {counselor.profile.displayName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{counselor.username}
                    </div>
                  </TableCell>
                  <TableCell>{counselor.email}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(counselor.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {counselor.counselorInfo.specializations?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {counselor.counselorInfo.specializations
                          .slice(0, 2)
                          .map((spec, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                        {counselor.counselorInfo.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +
                            {counselor.counselorInfo.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {counselor.profile.languages?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {counselor.profile.languages
                          .slice(0, 2)
                          .map((lang, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {lang}
                            </Badge>
                          ))}
                        {counselor.profile.languages.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{counselor.profile.languages.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(
                        counselor.counselorInfo.verificationStatus
                      )}
                    >
                      {counselor.counselorInfo.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/counselors/pending/${counselor._id}`}>
                          Review
                        </Link>
                      </Button>
                      {counselor.counselorInfo.verificationStatus ===
                        "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleQuickApprove(counselor._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleQuickReject(counselor._id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {counselors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No pending counselor applications found
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
