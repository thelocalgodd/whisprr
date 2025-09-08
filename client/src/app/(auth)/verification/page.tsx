"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import Link from "next/link";

function Verification() {
  return (
    <>
      <Toaster theme="dark" />
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Counselor Verification</CardTitle>
            <CardDescription>
              To become a verified counselor, you need to complete a
              verification process. This helps us ensure the safety and quality
              of our platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please contact our administration team to begin the verification
              process. Further instructions will be provided via email.
            </p>
            <Button
              onClick={() => {
                toast.error("This feature is not available yet");
              }}
              className="mb-4"
            >
              Contact Admin
            </Button>
            <p className="text-xs text-gray-500 mb-2">
              You can continue to use the platform as an unverified counselor.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Continue to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default Verification;
