"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UserCheck, MessageSquare, Shield, Home } from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
];

const counselorItems = [
  {
    label: "Pending Counselors",
    href: "/counselors/pending",
    icon: UserCheck,
  },
];

const reportItems = [
  {
    label: "Message Reports",
    href: "/reports/messages",
    icon: MessageSquare,
  },
  {
    label: "Foul Content",
    href: "/reports/foul-content",
    icon: Shield,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="w-fit border-r bg-white dark:bg-zinc-900 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          whisprr<span className="text-red-500">admin</span>
        </h1>
      </div>

      <nav className="space-y-1 text-sm">
        {/* Main Navigation */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive(item.href)
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Counselors Section */}
        <div className="pt-4">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Counselors
            </p>
          </div>
          {counselorItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Reports Section */}
        <div className="pt-4">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Reports
            </p>
          </div>
          {reportItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
