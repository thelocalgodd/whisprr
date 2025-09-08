"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Loader2, User, Mail, Calendar, Activity } from "lucide-react";
import { userApi } from "@/lib/api";

interface UserDetail {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'user' | 'counselor' | 'admin' | 'moderator';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastSeen: string;
}

interface UserStats {
  messageCount: number;
  reportsAsReporter: number;
  reportsAsTarget: number;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userApi.getUserById(id);
        
        if (response.success && response.data) {
          setUser(response.data.user);
          setStats(response.data.stats);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch user details');
        }
      } catch (err) {
        setError('An error occurred while fetching user details');
        console.error('User detail fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleStatusUpdate = async (isActive: boolean) => {
    if (!user) return;
    
    try {
      setUpdating(true);
      const response = await userApi.updateUserStatus(user._id, { isActive });
      
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      console.error('User status update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRoleUpdate = async (role: string) => {
    if (!user) return;
    
    try {
      setUpdating(true);
      const response = await userApi.updateUserStatus(user._id, { role });
      
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      console.error('User role update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading user details: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{user.username}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-medium">{user.fullName || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Role</div>
                  <div className="font-medium">
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'counselor' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Verified</div>
                  <div className="font-medium">
                    <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="font-medium flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Seen</div>
                  <div className="font-medium flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>{new Date(user.lastSeen).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={user.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleStatusUpdate(!user.isActive)}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {user.isActive ? 'Deactivate User' : 'Activate User'}
                </Button>
                
                {user.role === 'user' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleUpdate('counselor')}
                    disabled={updating}
                  >
                    Promote to Counselor
                  </Button>
                )}
                
                {user.role === 'counselor' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleUpdate('user')}
                    disabled={updating}
                  >
                    Demote to User
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Statistics */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Messages Sent</div>
                    <div className="text-2xl font-bold">{stats.messageCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reports Made</div>
                    <div className="text-2xl font-bold">{stats.reportsAsReporter.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reports Against</div>
                    <div className="text-2xl font-bold text-red-600">{stats.reportsAsTarget.toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Statistics unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
