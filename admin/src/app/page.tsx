"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSplashPage() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 1000);

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Animated logo/text */}
        <div className="mb-8">
          <h1 className="font-bold mb-4 tracking-wider">
            <span className="inline-block animate-pulse delay-50 text-slate-900">
              w
            </span>
            <span className="inline-block animate-pulse delay-75 text-slate-900">
              h
            </span>
            <span className="inline-block animate-pulse delay-150 text-slate-900">
              i
            </span>
            <span className="inline-block animate-pulse delay-225 text-slate-900">
              s
            </span>
            <span className="inline-block animate-pulse delay-300 text-slate-900">
              p
            </span>
            <span className="inline-block animate-pulse delay-375 text-slate-900">
              r
            </span>
            <span className="inline-block animate-pulse delay-450 text-slate-900">
              r
            </span>
            <span className="inline-block animate-pulse delay-500 text-red-500">
              a
            </span>
            <span className="inline-block animate-pulse delay-575 text-red-500">
              d
            </span>
            <span className="inline-block animate-pulse delay-650 text-red-500">
              m
            </span>
            <span className="inline-block animate-pulse delay-725 text-red-500">
              i
            </span>
            <span className="inline-block animate-pulse delay-800 text-red-500">
              n
            </span>
          </h1>
        </div>

        {/* Custom CSS for additional animations */}
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse-progress {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }

          .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
          }

          .animation-delay-1000 {
            animation-delay: 1000ms;
          }

          .animate-pulse-progress {
            animation: pulse-progress 5s ease-out forwards;
          }

          .delay-0 {
            animation-delay: 0ms;
          }
          .delay-75 {
            animation-delay: 75ms;
          }
          .delay-150 {
            animation-delay: 150ms;
          }
          .delay-225 {
            animation-delay: 225ms;
          }
          .delay-300 {
            animation-delay: 300ms;
          }
          .delay-375 {
            animation-delay: 375ms;
          }
          .delay-450 {
            animation-delay: 450ms;
          }
          .delay-500 {
            animation-delay: 500ms;
          }
          .delay-575 {
            animation-delay: 575ms;
          }
          .delay-650 {
            animation-delay: 650ms;
          }
          .delay-725 {
            animation-delay: 725ms;
          }
          .delay-800 {
            animation-delay: 800ms;
          }
        `}</style>
      </div>
    </div>
  );
}
