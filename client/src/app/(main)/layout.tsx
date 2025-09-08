import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
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
