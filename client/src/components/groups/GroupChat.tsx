"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  Shield,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Group, Message, User } from "@/lib/api";

interface GroupChatProps {
  group: Group | null;
  messages: Message[];
  authUser: User | null;
  onSendMessage: (content: string) => void;
  isSending: boolean;
  error?: string | null;
  onRetry?: () => void;
  isLoadingMessages?: boolean;
}

export function GroupChat({
  group,
  messages,
  authUser,
  onSendMessage,
  isSending,
  error,
  onRetry,
  isLoadingMessages = false,
}: GroupChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && !isSending) {
      onSendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const canUserPost = (group: Group, user: User | null): boolean => {
    if (!user || !group) return false;

    const { postingPermissions } = group.settings;

    switch (postingPermissions) {
      case "all":
        return true;
      case "counselors-only":
        return user.role === "counselor";
      case "moderators-only":
        return group.moderators.some((mod) => mod._id === user._id);
      default:
        return false;
    }
  };

  const getPostingPermissionMessage = (postingPermissions: string): string => {
    switch (postingPermissions) {
      case "counselors-only":
        return "Only verified counselors can post in this group";
      case "moderators-only":
        return "Only group moderators can post messages";
      default:
        return "You don't have permission to post in this group";
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            Select a group to start chatting
          </h3>
          <p className="text-sm">
            Choose from the support groups on the left to begin your
            conversation.
          </p>
        </div>
      </div>
    );
  }

  const canPost = canUserPost(group, authUser);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Group Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={group.creator.profile.avatar} alt={group.name} />
            <AvatarFallback className="bg-emerald-100 text-emerald-800">
              {group.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-slate-900">{group.name}</h2>
              <Badge
                variant="outline"
                className={
                  group.type === "support-circle"
                    ? "bg-purple-100 text-purple-800"
                    : group.type === "public"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                }
              >
                {group.type.replace("-", " ")}
              </Badge>
              {group.settings.requiresApproval && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Moderated
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {group.statistics.totalMembers} members
              </span>
              <span className="text-green-600">
                {group.statistics.activeMembers} active
              </span>
              <span>Created by {group.creator.profile.displayName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Group Rules */}
      {group.rules.length > 0 && (
        <div className="p-3 border-b bg-blue-50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Group Guidelines
              </p>
              <div className="text-xs text-blue-800 space-y-1">
                {group.rules.slice(0, 3).map((rule, index) => (
                  <p key={rule._id}>
                    {index + 1}. {rule.rule}
                  </p>
                ))}
                {group.rules.length > 3 && (
                  <p className="text-blue-700">
                    +{group.rules.length - 3} more guidelines
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="m-4 mb-0 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-red-800">{error}</span>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium mb-1">No messages yet</p>
            <p className="text-sm text-center">
              {canPost
                ? "Be the first to start the conversation!"
                : "Waiting for someone to start the conversation."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender?._id === authUser?._id;

              return (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender?.profile?.avatar} />
                    <AvatarFallback className="text-xs">
                      {
                        (message.sender?.profile?.displayName ||
                          message.sender?.username ||
                          "U")[0]
                      }
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex-1 max-w-xs ${isOwnMessage ? "text-right" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {message.sender?.profile?.displayName ||
                          message.sender?.username ||
                          "Unknown"}
                      </span>
                      {message.sender?.role === "counselor" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-100 text-blue-800"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Counselor
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatMessageTime(
                          message.createdAt || new Date().toISOString()
                        )}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isOwnMessage
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {typeof message.content === "string"
                          ? message.content
                          : message.content?.text || ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        {!canPost ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <Shield className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-sm text-amber-800">
              {getPostingPermissionMessage(group.settings.postingPermissions)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!messageInput.trim() || isSending}
              className="px-4"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}

        {group.settings.requiresApproval && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Messages in this group are reviewed by moderators before being
            posted
          </p>
        )}
      </div>
    </div>
  );
}
