"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b"];

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCounselors: number;
    verifiedCounselors: number;
    totalGroups: number;
    totalMessages: number;
    totalSessions: number;
    activeUsersToday: number;
    newUsersThisWeek: number;
    messagesThisWeek: number;
    sessionsThisWeek: number;
  };
  moderation: {
    pendingVerifications: number;
    flaggedMessages: number;
    crisisAlerts: number;
    reportedContent: number;
  };
  charts: {
    userGrowth: { _id: string; count: number }[];
    messageVolume: { _id: string; count: number }[];
  };
  topGroups: any[];
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getAnalytics();

        if (response.success && response.data) {
          setAnalytics(response.data);
          setError(null);
        } else if (response.data) {
          // Handle direct data response
          setAnalytics(response.data);
          setError(null);
        } else {
          setError(response.error || "Failed to fetch analytics");
        }
      } catch (err) {
        setError("An error occurred while fetching analytics");
        console.error("Dashboard analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Loading analytics data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Platform overview and analytics at a glance.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading analytics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Platform overview and analytics at a glance.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+
              {analytics.overview.newUsersThisWeek} this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.overview.messagesThisWeek > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {analytics.overview.messagesThisWeek} this week
                </>
              ) : (
                <>No messages this week</>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Counselors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.verifiedCounselors}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.overview.totalCounselors} total counselors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.activeUsersToday.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {analytics.overview.sessionsThisWeek} sessions this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {analytics.charts.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.charts.userGrowth}
                  margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Stats</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="space-y-4 pt-8">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Groups</span>
                <span className="text-2xl font-bold">
                  {analytics.overview.totalGroups}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Sessions</span>
                <span className="text-2xl font-bold">
                  {analytics.overview.totalSessions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Sessions This Week</span>
                <span className="text-2xl font-bold">
                  {analytics.overview.sessionsThisWeek}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Messages This Week</span>
                <span className="text-2xl font-bold">
                  {analytics.overview.messagesThisWeek}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {analytics.charts.messageVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.charts.messageVolume}
                  margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No message data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Groups</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {analytics.topGroups.length > 0 ? (
              <div className="space-y-2">
                {analytics.topGroups.map((group: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm">{group.name}</span>
                    <Badge>{group.members} members</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No groups available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Response Time</span>
              <span className="text-sm font-medium">142ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Sessions</span>
              <span className="text-sm font-medium">642</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Pending Verifications</span>
              <span className="text-sm font-medium text-yellow-600">
                {analytics.moderation.pendingVerifications}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Flagged Messages</span>
              <span className="text-sm font-medium text-yellow-600">
                {analytics.moderation.flaggedMessages}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Crisis Alerts</span>
              <span className="text-sm font-medium text-red-600">
                {analytics.moderation.crisisAlerts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Reported Content</span>
              <span className="text-sm font-medium text-yellow-600">
                {analytics.moderation.reportedContent}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">New Users This Week</span>
              <span className="text-sm font-medium text-green-600">
                +{analytics.overview.newUsersThisWeek}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Users</span>
              <span className="text-sm font-medium">
                {analytics.overview.totalUsers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Verified Counselors</span>
              <span className="text-sm font-medium">
                {analytics.overview.verifiedCounselors}/
                {analytics.overview.totalCounselors}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
