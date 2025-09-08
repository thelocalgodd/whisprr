"use client";

import { Lock, Heart, UserCheck, Shield } from "lucide-react";
import { CrisisSupportPopover } from "./CrisisSupportPopover";

export function Safety() {
  return (
    <section id="safety" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Your Safety is Our Priority
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Advanced security protocols and AI-powered safety systems ensure
              you're protected while getting the support you need.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    End-to-End Encryption
                  </h3>
                  <p className="text-slate-600">
                    All messages are encrypted with zero-knowledge protocols.
                    Even we can't read your conversations.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Crisis Detection
                  </h3>
                  <p className="text-slate-600">
                    AI monitors for crisis keywords and immediately provides
                    resources and professional hotline access.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Verified Counselors
                  </h3>
                  <p className="text-slate-600">
                    All counselors undergo ID verification and background checks
                    before gaining access to the platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Content Moderation
                  </h3>
                  <p className="text-slate-600">
                    AI-powered content analysis and human moderation ensure a
                    safe, supportive environment for everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                24/7 Crisis Support
              </h3>
              <p className="text-slate-600 mb-6">
                Our panic button instantly connects you to professional crisis
                hotlines. Help is always just one click away.
              </p>
              <CrisisSupportPopover />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
