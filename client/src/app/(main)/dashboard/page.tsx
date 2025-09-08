"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Users,
  BookOpen,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const QuickAction = ({ title, href }: { title: string; href: string }) => (
  <Link
    href={href}
    className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg transition-colors"
  >
    <div className="flex items-center gap-4">
      <PlusCircle className="h-5 w-5 text-stone-500 dark:text-stone-400" />
      <span className="font-semibold">{title}</span>
    </div>
    <ArrowRight className="h-5 w-5 text-stone-400 dark:text-stone-500" />
  </Link>
);

const StatCard = ({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const RecentActivityItem = ({
  type,
  title,
  time,
}: {
  type: "conversation" | "forum";
  title: string;
  time: string;
}) => (
  <div className="flex items-start">
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 mr-4">
      {type === "conversation" ? (
        <MessageSquare className="h-4 w-4 text-stone-500" />
      ) : (
        <Users className="h-4 w-4 text-stone-500" />
      )}
    </div>
    <div className="flex-1">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{time}</p>
    </div>
  </div>
);

type Activity = { type: "conversation" | "forum"; title: string; time: string };

function DashboardPage() {
  const user = {
    name: "Anonymous",
  };
  const stats = {
    conversations: 0,
    forumPosts: 0,
    resources: 0,
  };
  const recentActivities: Activity[] = [];

  return (
    <Card className="w-full shadow-none border-none">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Here is a snapshot of your recent activity and stats.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Active Conversations"
            value={stats.conversations}
            description="Ongoing private and group chats"
            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Forum Contributions"
            value={stats.forumPosts}
            description="Threads started and replies posted"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Saved Resources"
            value={stats.resources}
            description="Helpful articles and links"
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump right back into the action.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickAction title="New Conversation" href="/conversations" />
              <QuickAction title="Browse Groups" href="/groups" />
              <QuickAction title="Explore Resources" href="/resources" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                What you have missed since your last visit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <RecentActivityItem
                    key={index}
                    type={activity.type}
                    title={activity.title}
                    time={activity.time}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Card>
  );
}

export default DashboardPage;
