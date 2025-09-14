"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Users, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { groupApi, messageApi, type Group, type Message } from "@/lib/api";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface GroupMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

export default function GroupChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const groupId = params.groupId as string;

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [canPost, setCanPost] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!groupId || !user) {
      setIsLoading(false);
      return;
    }

    // Fetch group information
    const fetchGroupInfo = async () => {
      try {
        const response = await groupApi.getGroup(groupId);
        if (response.success && response.data) {
          const group = response.data;
          console.log("group: ", group);
          setGroupInfo(group);

          // Determine posting permissions
          const currentUserRole = user?.role || "user";
          const isModerator = group.moderators?.some(
            (mod) => mod._id === user?._id
          );

          setCanPost(true); // For now, allow all users to post

          // Set member count from statistics
          setMemberCount(group.statistics?.totalMembers || 0);
        }
      } catch (error) {
        console.error("Failed to fetch group info:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load group information";
        setLoadingError(errorMessage);
        toast.error("Failed to load group information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupInfo();
    loadMessages();

    // Set up polling for new messages
    const pollMessages = async () => {
      await loadMessages();
    };

    pollingIntervalRef.current = setInterval(pollMessages, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [groupId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!groupId || !user) return;

    try {
      const response = await groupApi.getGroupMessages(groupId);

      if (response.success && response.data) {
        const formattedMessages: GroupMessage[] = response.data.messages.map(
          (msg: Message) => ({
            id: msg._id,
            text: msg.content.text,
            senderId: msg.sender._id,
            senderName: msg.sender.username || msg.sender.fullName || "User",
            timestamp: new Date(msg.createdAt),
            isCurrentUser: msg.sender._id === user._id,
          })
        );

        setMessages(formattedMessages);
      } else {
        console.error("Failed to load messages:", response.message || response.error);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      // Don't show toast for polling errors to avoid spam
      if (!pollingIntervalRef.current) {
        toast.error("Failed to load messages");
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !groupId || isSending || !canPost) return;

    if (!user) {
      toast.error("Please sign in to send messages");
      return;
    }

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const response = await groupApi.sendGroupMessage(groupId, {
        content: {
          text: messageText,
          type: "text",
        },
        messageType: "text",
      });

      if (response.success) {
        // Reload messages to get the new message
        await loadMessages();
        toast.success("Message sent!");
      } else {
        console.error("Failed to send message:", response.message || response.error);
        toast.error(response.message || "Failed to send message");
        setInput(messageText); // Restore input on error
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(errorMessage);
      setInput(messageText); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Please sign in to use the chat
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading group...</p>
        </div>
      </Card>
    );
  }

  if (loadingError) {
    return (
      <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-destructive">{loadingError}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
      <div className="border-b">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={groupInfo?.avatar} />
              <AvatarFallback>
                {groupInfo?.name?.charAt(0).toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{groupInfo?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{memberCount} members</span>
                {groupInfo?.type && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {groupInfo.type}
                    </Badge>
                  </>
                )}
                {!canPost && (
                  <>
                    <span>•</span>
                    <span className="text-destructive">View Only</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {groupInfo?.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {groupInfo.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-stone-50 dark:bg-stone-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 ${msg.isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-lg max-w-xs ${
                  msg.isCurrentUser
                    ? "bg-blue-500 text-white"
                    : "bg-stone-200 dark:bg-stone-800"
                }`}
              >
                {!msg.isCurrentUser && (
                  <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.isCurrentUser
                      ? "text-white/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        {canPost ? (
          <div className="relative">
            <Input
              placeholder="Type a message..."
              className="pr-12"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isSending}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-16 bg-primary text-primary-foreground"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <Shield className="h-4 w-4 inline mr-1" />
            You don&apos;t have permission to post in this group
          </div>
        )}
      </div>
    </Card>
  );
}
