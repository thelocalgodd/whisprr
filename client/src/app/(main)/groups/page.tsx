"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGroups,
  getGroupMessages,
  sendGroupMessage,
} from "@/services/group";
import { GroupList } from "@/components/groups/GroupList";
import { GroupChat } from "@/components/groups/GroupChat";
import { Group, Message, User } from "@/lib/api";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function GroupsPage() {
  const { user: authUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getGroups({ limit: 20 });
        setGroups(result.groups);
        setPagination(result.pagination);
      } catch (error: any) {
        console.error("Failed to fetch groups:", error);
        setError(error?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedGroup) {
        try {
          setIsLoadingMessages(true);
          setError(null);
          const result = await getGroupMessages(selectedGroup._id);
          setMessages(result.messages);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          setError("Failed to load messages. Please try again.");
        } finally {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMessages();
  }, [selectedGroup]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (selectedGroup && content.trim() && !isSendingMessage) {
        try {
          setIsSendingMessage(true);

          // Check posting permissions based on postingPermissions
          const { postingPermissions } = selectedGroup.settings;
          let canPost = false;
          if (postingPermissions === "all") {
            canPost = true;
          } else if (
            postingPermissions === "counselors-only" &&
            authUser?.role === "counselor"
          ) {
            canPost = true;
          } else if (
            postingPermissions === "moderators-only" &&
            selectedGroup.moderators.some((mod) => mod._id === authUser?._id)
          ) {
            canPost = true;
          }

          if (!canPost) {
            setError("You don't have permission to post in this group");
            return;
          }

          const sentMessage = await sendGroupMessage(
            selectedGroup._id,
            content.trim()
          );

          if (sentMessage) {
            // Optimistically update messages instead of refetching
            setMessages((prev) => [...prev, sentMessage]);
            setError(null);
          } else {
            setError("Failed to send message");
          }
        } catch (error: any) {
          console.error("Failed to send message:", error);
          setError(error?.message || "Failed to send message");
        } finally {
          setIsSendingMessage(false);
        }
      }
    },
    [selectedGroup, authUser, isSendingMessage]
  );

  const handleGroupSelect = useCallback((group: Group) => {
    setSelectedGroup(group);
    setError(null);
  }, []);

  const handleRetryMessages = useCallback(async () => {
    if (selectedGroup) {
      try {
        setError(null);
        const result = await getGroupMessages(selectedGroup._id);
        setMessages(result.messages);
      } catch (error: any) {
        console.error("Failed to fetch messages:", error);
        setError("Failed to load messages. Please try again.");
      }
    }
  }, [selectedGroup]);

  if (error && !selectedGroup) {
    return (
      <Card className="w-full shadow-none h-[calc(100vh-4rem)]">
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-600">
                Error Loading Groups
              </h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setError(null);
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

  return (
    <Card className="w-full shadow-none h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        <GroupList
          groups={groups}
          selectedGroup={selectedGroup}
          onGroupSelect={handleGroupSelect}
          loading={loading}
        />
        <GroupChat
          group={selectedGroup}
          messages={messages}
          authUser={authUser}
          onSendMessage={handleSendMessage}
          isSending={isSendingMessage}
          error={error}
          onRetry={handleRetryMessages}
          isLoadingMessages={isLoadingMessages}
        />
      </div>
      {pagination && (
        <div className="p-4 text-sm text-muted-foreground">
          Showing page {pagination.page} of {pagination.pages} (Total:{" "}
          {pagination.total} groups)
        </div>
      )}
    </Card>
  );
}
