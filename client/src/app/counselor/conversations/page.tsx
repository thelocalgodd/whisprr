"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Search, Send, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { conversationApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  _id: string;
  username: string;
  role?: "user" | "counselor";
  isVerified?: boolean;
}

interface Message {
  _id: string;
  sender: User;
  text: string;
  time: string;
}

interface Conversation {
  _id: string;
  name: string;
  role?: "user" | "counselor";
  isVerified?: boolean;
  lastMessage: string;
  time: string;
  avatar: string;
  messages: Message[];
}

export default function ConversationsPage() {
  const { user: authUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await conversationApi.getConversations();
        
        if (result.success && result.data) {
          // Transform API data to match our interface
          const transformedConversations = result.data.map((conv: any) => ({
            _id: conv._id || conv.id,
            name: conv.participant?.username || conv.name || "Anonymous User",
            role: conv.participant?.role || "user",
            isVerified: conv.participant?.isVerified || false,
            lastMessage: conv.lastMessage?.content || "No messages yet",
            time: conv.lastMessage?.createdAt || conv.createdAt || new Date().toISOString(),
            avatar: conv.participant?.profile?.avatar || "",
            messages: conv.messages?.map((msg: any) => ({
              _id: msg._id || msg.id,
              sender: {
                _id: msg.sender?._id || msg.sender?.id || "unknown",
                username: msg.sender?.username || "Anonymous"
              },
              text: msg.content || msg.text || "",
              time: msg.createdAt || msg.timestamp || new Date().toISOString()
            })) || []
          }));
          setConversations(transformedConversations);
        } else {
          setError(result.error || "Failed to load conversations");
        }
      } catch (error: any) {
        console.error("Failed to fetch conversations:", error);
        setError("Failed to load conversations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages);
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (selectedConversation && newMessage.trim()) {
      const message: Message = {
        _id: (messages.length + 1).toString(),
        sender: { _id: "currentUser", username: "Me" },
        text: newMessage.trim(),
        time: new Date().toISOString(),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const filteredConversations = conversations.filter((convo) =>
    convo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="w-full shadow-none h-[calc(100vh-4rem)]">
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-none h-[calc(100vh-4rem)]">
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-600">Error Loading Conversations</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
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
        <div className="w-1/4 border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Conversations</h2>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => (
                <Card
                  key={convo._id}
                  className={`flex flex-row shadow-none h-10 border-none rounded-none border-b items-center px-4 cursor-pointer w-full ${
                    selectedConversation?._id === convo._id
                      ? "bg-accent"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedConversation(convo)}
                >
                  <div className="flex items-center w-full">
                    <p className="font-semibold w-full">{convo.name}</p>
                    {convo.role === "counselor" && (
                      <BadgeCheck
                        className={`w-5 h-5 ml-2 ${
                          convo.isVerified ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No conversations available.
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="px-4 py-2 border-b flex items-center">
                <div className="flex-1 flex items-center">
                  <p className="font-semibold">{selectedConversation.name}</p>
                  {selectedConversation.role === "counselor" && (
                    <BadgeCheck
                      className={`w-5 h-5 ml-2 ${
                        selectedConversation.isVerified
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex mb-4 ${
                      msg.sender.username === "Me"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-xs ${
                        msg.sender.username === "Me"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender.username === "Me"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    className="pr-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-16 bg-primary text-primary-foreground"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">No conversations available or select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
