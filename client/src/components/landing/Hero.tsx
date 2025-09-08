"use client";
import { ArrowRight, Shield, UserCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LearnMorePopover } from "./LearnMorePopover";

export function Hero() {
  return (
    <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Anonymous • Secure • Supportive
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Find Support in
            <span className="text-emerald-600 block">Complete Anonymity</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Connect with verified counselors and supportive peers without
            revealing your identity. Get the help you need in a safe, encrypted
            environment designed for your privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <LearnMorePopover />
          </div>
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-slate-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-emerald-600" />
              End-to-end encrypted
            </div>
            <div className="flex items-center">
              <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
              Verified counselors
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-emerald-600" />
              24/7 crisis support
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
