"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserProfile {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  isVerified: boolean;
  profile?: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    pronouns?: string;
    timezone?: string;
    languages?: string[];
  };
}


export default function Profile() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
      return;
    }

    // Redirect counselors to counselor dashboard
    if (authUser.role === 'counselor') {
      router.push('/counselor/dashboard');
      return;
    }

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await authApi.getProfile();
        if (res && res.success && res.data) {
          setUserProfile(res.data);
          setDisplayName(res.data.profile?.displayName || res.data.fullName || res.data.username);
          setBio(res.data.profile?.bio || "");
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [authUser, router]);
  const [updateMessage, setUpdateMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    
    try {
      setIsUpdating(true);
      const response = await authApi.updateProfile({
        'profile.displayName': displayName,
        'profile.bio': bio,
      });
      
      if (response.success && response.data) {
        setUserProfile(response.data);
        toast.success('Profile updated successfully!');
        setUpdateMessage('Profile updated successfully!');
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      toast.error('New passwords do not match.');
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordMessage("Please fill in all password fields.");
      toast.error('Please fill in all password fields.');
      return;
    }

    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      
      if (response.success) {
        setPasswordMessage('Password changed successfully!');
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      setPasswordMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!authUser) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="w-full mt-2 shadow-none">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="w-full mt-2 shadow-none">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">Failed to load profile</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-2 shadow-none">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        {updateMessage && (
          <p className="text-center p-2 bg-blue-100 rounded-md">
            {updateMessage}
          </p>
        )}
        <Card className="shadow-none border-none -mx-6">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              View and manage your profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={userProfile.profile?.avatar || userProfile.avatar}
                  alt="@"
                />
                <AvatarFallback>
                  {userProfile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {displayName || userProfile.username}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{userProfile.username}
                </p>
                {userProfile.email && (
                  <p className="text-sm text-muted-foreground">
                    {userProfile.email}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <p className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md">@{userProfile.username}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            {userProfile.email && (
              <div className="grid gap-2">
                <Label>Email</Label>
                <p className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md">{userProfile.email}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <p className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md capitalize">{userProfile.role}</p>
            </div>
            <div className="grid gap-2">
              <Label>Joined</Label>
              <p className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                {new Date(userProfile.createdAt).toLocaleDateString([], {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <p
                className={`text-sm p-2 rounded-md ${
                  userProfile.isActive 
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}
              >
                {userProfile.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Verified</Label>
              <p
                className={`text-sm p-2 rounded-md ${
                  userProfile.isVerified 
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {userProfile.isVerified ? "Verified" : "Unverified"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordMessage && (
              <p className="text-center p-2 bg-blue-100 rounded-md">
                {passwordMessage}
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-row gap-2 w-full">
              <div className="grid gap-2 w-1/2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2 w-1/2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </CardFooter>
        </Card>
      </div>
    </Card>
  );
}
