"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, BadgeCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { 
  subscribeToMessages, 
  sendMessage,
  type FirebaseMessage 
} from "@/services/firebase-messaging";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function GroupChatPage() {
  const { user, firebaseUser } = useAuth();
  const params = useParams();
  const groupId = params.groupId as string;
  
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [groupName, setGroupName] = useState("Group Chat");
  const [memberCount, setMemberCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(groupId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      
      // Update member count based on unique senders
      const uniqueSenders = new Set(msgs.map(m => m.senderId));
      setMemberCount(uniqueSenders.size);
    });
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !groupId || isSending) return;
    
    const currentUser = firebaseUser || user;
    if (!currentUser) {
      toast.error("Please sign in to send messages");
      return;
    }

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const senderName = user?.username || 
        (firebaseUser?.isAnonymous ? `Anonymous-${firebaseUser.uid.slice(0, 6)}` : firebaseUser?.displayName || "User");
      
      await sendMessage(groupId, messageText, senderName);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setInput(messageText); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSending) {
      handleSend();
    }
  };

  if (!firebaseUser && !user) {
    return (
      <Card className="w-full h-full flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to use group chat</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading group chat...</p>
        </div>
      </Card>
    );
  }

  const currentUserId = firebaseUser?.uid || user?.username || "";

  return (
    <Card className="w-full h-full flex flex-col shadow-none border-none">
      <div className="px-4 py-2 border-b flex items-center">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            <Users className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="ml-4 flex-1">
          <p className="font-semibold">{groupName}</p>
          <p className="text-sm text-muted-foreground">
            {memberCount} members
          </p>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-2 py-1 rounded-lg max-w-xs ${
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm mb-1 w-full">{msg.text}</p>
                <p
                  className={`text-xs ${
                    isCurrentUser
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-2">
                    {msg.senderName}
                    {msg.isAnonymous && (
                      <span className="opacity-70">(Anonymous)</span>
                    )}
                    {msg.timestamp && (
                      <span className="text-xs font-normal">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="relative">
          <Input
            placeholder="Type a message..."
            className="pr-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleInputKeyDown}
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
      </div>
    </Card>
  );
}