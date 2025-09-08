import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DynamicBreadcrumb } from "../components/dynamic-breadcrumb";
import { AdminSidebar } from "../components/admin-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "whisprr admin | anonymous peer counselling app",
  description: "whisprr admin | anonymous peer counselling app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <div className="mb-4">
              <DynamicBreadcrumb />
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
