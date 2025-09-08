"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Info } from "lucide-react";

export default function CounselorVerificationPage() {
  const [status, setStatus] = useState<"unverified" | "pending" | "verified">(
    "unverified"
  );
  const [fullName, setFullName] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [organization, setOrganization] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, submit to backend then set pending
    setStatus("pending");
  };

  return (
    <Card className="w-full shadow-none border-none">
      <div className="p-4 sm:p-6 lg:p-6">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Counselor Verification
          </h1>
          {status !== "unverified" && (
            <BadgeCheck
              className={`w-6 h-6 ${
                status === "verified" ? "text-blue-500" : "text-gray-400"
              }`}
            />
          )}
        </div>
        <p className="text-muted-foreground mb-8 text-sm">
          Please provide your credentials to get verified as a counselor. This
          helps us ensure quality and trust within the community.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>
              {status === "unverified" && (
                <span className="flex items-center gap-2 text-yellow-700">
                  <Info className="w-4 h-4" /> You are currently unverified.
                  Submit your credentials to get verified.
                </span>
              )}
              {status === "pending" && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-4 h-4" /> Your verification is under
                  review.
                </span>
              )}
              {status === "verified" && (
                <span className="flex items-center gap-2 text-blue-600">
                  <BadgeCheck className="w-4 h-4" /> Verified counselor
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 w-1/2">
                <div className="grid gap-2 w-full">
                  <Label htmlFor="full-name">Full Name (kept private)</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your legal name"
                  />
                </div>
                <div className="grid gap-2 w-full">
                  <Label htmlFor="license-id">License / Certification ID</Label>
                  <Input
                    id="license-id"
                    value={licenseId}
                    onChange={(e) => setLicenseId(e.target.value)}
                    placeholder="e.g., ABC-123456"
                  />
                </div>
              </div>
              <div className="flex gap-2 w-1/2">
                <div className="grid gap-2 w-full">
                  <Label htmlFor="organization">ID Document Upload</Label>
                  <Input id="organization" value={organization} type="file" />
                </div>
              </div>
              <div className="grid gap-2 w-1/2">
                <Label htmlFor="organization">Issuing Organization</Label>
                <Input
                  id="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g., State Board of Counseling"
                />
              </div>
              <div className="grid gap-2 w-1/2">
                <Label htmlFor="note">Additional notes (optional)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the reviewer should know"
                />
              </div>
              <CardFooter className="px-0 w-1/2">
                <Button type="submit" disabled={status === "pending"}>
                  {status === "pending"
                    ? "Submitted"
                    : "Submit for Verification"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
