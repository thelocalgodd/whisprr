import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center"></div>
            <span className="text-xl font-bold text-slate-900">whisprr</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#safety"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Safety
            </a>
            <a
              href="#how-it-works"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
            <Link href="/login">
              <Button variant="outline" className="mr-2 bg-transparent">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
