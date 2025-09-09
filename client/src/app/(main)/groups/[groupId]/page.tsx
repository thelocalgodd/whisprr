"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, BadgeCheck, Users, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import {
  subscribeToMessages,
  sendMessage,
  type FirebaseMessage,
} from "@/services/firebase-messaging";
import {
  getGroup,
  getGroupMessages,
  sendGroupMessage,
  type Group as ServiceGroup,
} from "@/services/group";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function GroupChatPage() {
  const { user, firebaseUser } = useAuth();
  const params = useParams();
  const groupId = params.groupId as string;

  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<ServiceGroup | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [canPost, setCanPost] = useState(false);
  const [rules, setRules] = useState<
    { rule: string; order: number; _id: string }[]
  >([]);
  const [groupTags, setGroupTags] = useState<string[]>([]);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const unsubscribeGroupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }

    // Fetch group information
    const fetchGroupInfo = async () => {
      try {
        const group = await getGroup(groupId);
        if (group) {
          setGroupInfo(group);
          setRules(group.rules || []);
          setGroupTags(group.tags || []);
          setCreatorInfo(group.creator);

          // Determine posting permissions
          const postingPermissions = group.settings?.postingPermissions;
          const currentUserRole = user?.role || firebaseUser?.role || "user";
          const isModerator = group.moderators?.some(
            (mod: any) => mod._id === user?._id || mod._id === firebaseUser?.uid
          );

          setCanPost(
            postingPermissions === "all" ||
              (postingPermissions === "counselors-only" &&
                currentUserRole === "counselor") ||
              (postingPermissions === "moderators-only" && isModerator)
          );

          // Set member count from statistics
          setMemberCount(group.statistics?.totalMembers || 0);
        }
      } catch (error: any) {
        console.error("Failed to fetch group info:", error);
        setLoadingError(error?.message || "Failed to load group information");
        toast.error("Failed to load group information");
      }
    };

    fetchGroupInfo();

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(groupId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);

      // Update active member count based on recent activity if needed
      const uniqueSenders = new Set(
        msgs.map((m: FirebaseMessage) => m.senderId)
      );
      const activeMembers = uniqueSenders.size;
      if (groupInfo?.statistics?.activeMembers !== activeMembers) {
        setMemberCount(groupInfo?.statistics?.totalMembers || activeMembers);
      }
    });
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [groupId, user, firebaseUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !groupId || isSending || !canPost) return;

    const currentUser = firebaseUser || user;
    if (!currentUser) {
      toast.error("Please sign in to send messages");
      return;
    }

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const senderName =
        user?.profile?.displayName ||
        firebaseUser?.displayName ||
        (firebaseUser?.isAnonymous
          ? `Anonymous-${firebaseUser.uid.slice(0, 6)}`
          : "User");

      // Check if message violates rules (basic check)
      const messageLower = messageText.toLowerCase();
      const violation = rules.some(
        (rule) =>
          (rule.rule.toLowerCase().includes("spam") &&
            messageLower.includes("http")) ||
          (rule.rule.toLowerCase().includes("respect") &&
            messageLower.includes("hate")) ||
          (rule.rule.toLowerCase().includes("confidentiality") &&
            messageLower.includes("share"))
      );

      if (violation) {
        toast.warning(
          "Your message may violate group rules. Please review before sending."
        );
        setInput(messageText); // Restore input
        setIsSending(false);
        return;
      }

      await sendMessage(groupId, messageText, senderName, {
        senderId: currentUser._id || currentUser.uid,
        senderRole: currentUser.role || "user",
        isVerified: currentUser.counselorInfo?.isVerified || false,
      });

      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setInput(messageText); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSending && canPost) {
      handleSend();
    }
  };

  if (!firebaseUser && !user) {
    return (
      <Card className="w-full h-full flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Please sign in to use group chat
          </p>
        </div>
      </Card>
    );
  }

  if (loadingError) {
    return (
      <Card className="w-full h-full flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-red-500">
              <svg
                className="h-12 w-12 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">
                Failed to Load Group
              </h3>
              <p className="text-muted-foreground mt-2">{loadingError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setLoadingError(null);
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading || !groupInfo) {
    return (
      <Card className="w-full h-full flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">
              Loading group chat...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const currentUserId = firebaseUser?.uid || user?._id || user?.username || "";

  return (
    <Card className="w-full h-full flex flex-col shadow-none border-none">
      {/* Group Header */}
      <div className="px-4 py-2 border-b flex items-center">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={creatorInfo?.profile?.avatar}
            alt={groupInfo?.name}
          />
          <AvatarFallback>
            <Users className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="ml-4 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{groupInfo.name}</p>
            <Badge variant="outline" className="text-xs">
              {groupInfo.type?.replace("-", " ")}
            </Badge>
            {groupInfo.isActive && !groupInfo.isArchived ? (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Archived
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {groupInfo.statistics?.totalMembers || memberCount} members •{" "}
            {groupInfo.statistics?.activeMembers || 0} active
          </p>
          <p className="text-xs text-muted-foreground">
            Created by{" "}
            {creatorInfo?.profile?.displayName ||
              creatorInfo?.username ||
              "Unknown"}
          </p>
          {!canPost && (
            <p className="text-xs text-orange-600">
              You don't have permission to post in this group
            </p>
          )}
        </div>
      </div>

      {/* Group Rules Section */}
      {rules.length > 0 && (
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Group Rules</h3>
          </div>
          <div className="space-y-1">
            {rules.slice(0, 3).map((rule) => (
              <p key={rule._id} className="text-xs text-muted-foreground">
                • {rule.rule}
              </p>
            ))}
            {rules.length > 3 && (
              <p className="text-xs text-muted-foreground">
                • ... and {rules.length - 3} more rules
              </p>
            )}
          </div>
        </div>
      )}

      {/* Group Tags */}
      {groupTags.length > 0 && (
        <div className="px-4 py-2 border-b">
          <div className="flex flex-wrap gap-1">
            {groupTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              No messages yet. Start the conversation!
            </p>
            {!canPost && (
              <p className="text-xs mt-2">
                You can only read messages in this group.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUserId;
            const isVerified = msg.isVerified || false;
            const senderRole = msg.senderRole || "user";

            return (
              <div
                key={msg.id}
                className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col ${
                    isCurrentUser ? "items-end" : "items-start"
                  } max-w-xs`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {!isCurrentUser && (
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                          />
                          <AvatarFallback className="text-xs">
                            {msg.senderName[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-semibold text-sm truncate">
                            {msg.senderName}
                          </span>
                          {isVerified && (
                            <BadgeCheck className="h-3 w-3 text-blue-500" />
                          )}
                          {senderRole === "counselor" && !isVerified && (
                            <BadgeCheck className="h-3 w-3 text-gray-400" />
                          )}
                          {senderRole && (
                            <Badge variant="outline" className="text-xs">
                              {senderRole}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm break-words">{msg.text}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`${
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Just now"}
                      </span>
                      {msg.isAnonymous && (
                        <span className="text-xs opacity-70">(Anonymous)</span>
                      )}
                      {msg.isFlagged && (
                        <span className="text-yellow-500 text-xs">
                          ⚠ Flagged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="relative">
          <Input
            placeholder={
              canPost ? "Type a message..." : "You cannot post in this group"
            }
            className="pr-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleInputKeyDown}
            disabled={isSending || !canPost}
            className={!canPost ? "bg-muted cursor-not-allowed" : ""}
          />
          <Button
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-16 bg-primary text-primary-foreground"
            onClick={handleSend}
            disabled={isSending || !input.trim() || !canPost}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {groupInfo.settings?.requiresApproval && (
          <p className="text-xs text-muted-foreground mt-1">
            New members require approval to post
          </p>
        )}
      </div>
    </Card>
  );
}
