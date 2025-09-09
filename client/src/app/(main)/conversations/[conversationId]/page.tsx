"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { conversationApi, messageApi, type Message } from "@/lib/api";
import { toast } from "sonner";

interface ConversationMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

export default function ConversationPage() {
  const { user } = useAuth();
  const params = useParams();
  const conversationId = params.conversationId as string;
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationName, setConversationName] = useState("Conversation");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId || !user) {
      setIsLoading(false);
      return;
    }

    // Load conversation details and messages
    const loadConversation = async () => {
      try {
        const convResponse = await conversationApi.getConversation(conversationId);
        if (convResponse.success && convResponse.data) {
          const conv = convResponse.data;
          setConversationName(conv.name || 
            (conv.isGroup ? "Group Chat" : 
              conv.participants.find(p => p._id !== user._id)?.username || "Private Chat"));
        }

        await loadMessages();
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast.error("Failed to load conversation");
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();

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
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId || !user) return;

    try {
      const response = await messageApi.getMessages(conversationId);
      
      if (response.success && response.data) {
        const formattedMessages: ConversationMessage[] = response.data.messages.map((msg: Message) => ({
          id: msg._id,
          text: msg.content.text,
          senderId: msg.sender._id,
          senderName: msg.sender.username || msg.sender.fullName || "User",
          timestamp: new Date(msg.createdAt),
          isCurrentUser: msg.sender._id === user._id
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isSending) return;
    
    if (!user) {
      toast.error("Please sign in to send messages");
      return;
    }

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const response = await messageApi.sendMessage(conversationId, {
        content: {
          text: messageText,
          type: 'text'
        },
        messageType: 'text'
      });

      if (response.success) {
        // Reload messages to get the new message
        await loadMessages();
      }
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

  if (!user) {
    return (
      <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to use the chat</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{conversationName}</h2>
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
                  <p className="text-xs font-semibold mb-1">
                    {msg.senderName}
                  </p>
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