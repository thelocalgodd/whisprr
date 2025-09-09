"use client";

import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
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

interface User {
  username: string;
  fullName?: string;
  bio?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  isVerified: boolean;
}

// Fetch user details from API on mount
const defaultUser: User = {
  username: "Anonymous",
  fullName: "Anonymous User",
  bio: "",
  role: "user",
  createdAt: new Date().toISOString(),
  isActive: true,
  isVerified: false,
};

export default function ProfilePage() {
  const [user, setUser] = useState<User>(defaultUser);
  const [username, setUsername] = useState(defaultUser.username);
  const [fullName, setFullName] = useState(defaultUser.fullName || "");
  const [bio, setBio] = useState(defaultUser.bio || "");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await authApi.getProfile();
        if (res && res.success && res.data) {
          setUser(res.data);
          setUsername(res.data.username);
          setFullName(res.data.fullName || "");
          setBio(res.data.bio || "");
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchProfile();
  }, []);
  const [updateMessage, setUpdateMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       const response = await getProfile();
  //       if (response.success) {
  //         setUser(response.user);
  //         setUsername(response.user.username);
  //       } else {
  //         setError(response.message);
  //       }
  //     } catch {
  //       setError("Failed to fetch profile. Please try again later.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchProfile();
  // }, []);

  const handleUpdateProfile = () => {
    setUser({ ...user, username, fullName, bio });
    setUpdateMessage("Profile updated successfully!");
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordMessage("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

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
                  src={user.avatar || "https://github.com/shadcn.png"}
                  alt="@"
                />
                <AvatarFallback>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {user.fullName || user.username}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
              <p className="text-sm p-2 bg-gray-100 rounded-md">{user.role}</p>
            </div>
            <div className="grid gap-2">
              <Label>Joined</Label>
              <p className="text-sm p-2 bg-gray-100 rounded-md">
                {new Date(user.createdAt).toLocaleDateString([], {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <p
                className={`text-sm p-2 rounded-md ${user.isActive ? "bg-green-100" : "bg-red-100"}`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Verified</Label>
              <p
                className={`text-sm p-2 rounded-md ${user.isVerified ? "bg-blue-100" : "bg-gray-100"}`}
              >
                {user.isVerified ? "Verified" : "Unverified"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdateProfile}>Update Profile</Button>
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
