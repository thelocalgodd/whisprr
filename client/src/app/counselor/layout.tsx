"use client";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function CounselorAppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    // Ensure matching against counselor routes
    if (path === "/counselor/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const menuItems = [
    {
      label: "Dashboard",
      href: "/counselor/dashboard",
    },
    {
      label: "Conversations",
      href: "/counselor/conversations",
    },
    {
      label: "Groups",
      href: "/counselor/groups",
    },
    {
      label: "Resources",
      href: "/counselor/resources",
    },
    {
      label: "Verification",
      href: "/counselor/verification",
    },
    {
      label: "Talk",
      href: "/counselor/voice",
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <Sidebar className="">
      <SidebarHeader className="mx-4 mt-4">
        <p className="text-xl font-bold">
          whisprr<span className="text-blue-500">counselor</span>
        </p>
      </SidebarHeader>
      <SidebarContent className="mx-4 mt-16">
        <SidebarMenu className="">
          {menuItems.map((item, index) => (
            <SidebarMenuButton
              key={index}
              className={`px-2 my-0.5 font-semibold ${
                isActive(item.href)
                  ? "bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 p-2 rounded-lg w-full"
                  : "w-full"
              }`}
            >
              <Link href={item.href}>{item.label}</Link>
            </SidebarMenuButton>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button asChild variant="outline" className="w-full">
              <Link href="/counselor/profile">Profile</Link>
            </Button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CounselorAppSidebar />
      <main className="p-4 w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <DynamicBreadcrumb />
          <div className="flex-1" />
          <NotificationPopover />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
