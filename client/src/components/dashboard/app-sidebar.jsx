"use client";
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
import { Button } from "../ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path) => {
    // Exact match for dashboard, prefix match for others
    if (path === "/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Conversations",
      href: "/conversations",
    },
    {
      label: "Groups",
      href: "/groups",
    },
    {
      label: "Talk",
      href: "/voice",
    },
    {
      label: "Resources",
      href: "/resources",
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
        <p className="text-2xl font-bold">whisprr</p>
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
              <Link href="/profile">Profile</Link>
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
