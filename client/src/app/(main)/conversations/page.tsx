"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Bot, Search, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { conversationApi, messageApi, type Conversation, type Message } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ConversationsPage() {
  const { user: authUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await conversationApi.getConversations();
        if (response.success && response.data) {
          setConversations(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        try {
          const response = await messageApi.getMessages(selectedConversation._id);
          if (response.success && response.data) {
            setMessages(response.data.messages);
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      }
    };

    fetchMessages();
  }, [selectedConversation]);


  const handleSendMessage = async () => {
    if (selectedConversation && newMessage.trim()) {
      try {
        const response = await messageApi.sendMessage({
          conversationId: selectedConversation._id,
          content: newMessage.trim(),
          messageType: 'text'
        });

        if (response.success && response.data) {
          // Refresh messages
          const messagesResponse = await messageApi.getMessages(selectedConversation._id);
          if (messagesResponse.success && messagesResponse.data) {
            setMessages(messagesResponse.data.messages);
          }
        }
        setNewMessage("");
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const filteredConversations = conversations.filter((convo) => {
    const searchableText = convo.participants
      .map(p => p.username)
      .join(' ')
      .toLowerCase();
    return searchableText.includes(searchTerm.toLowerCase());
  });


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
            <Card
              onClick={() => {
                router.push("/conversations/whisprr-bot");
              }}
              className="flex flex-row shadow-none h-10 border-none rounded-none border-b items-center px-4 cursor-pointer w-full"
            >
              <Bot className="w-5 h-5" />
              <p className="font-semibold w-full">Whisprr Bot</p>
            </Card>
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
                    <p className="font-semibold w-full">
                      {convo.participants
                        .filter(p => p._id !== 'currentUserId') // Replace with actual current user ID
                        .map(p => p.username)
                        .join(', ') || 'Conversation'}
                    </p>
                    {convo.participants.some(p => p.role === "counselor") && (
                      <BadgeCheck
                        className={`w-5 h-5 ml-2 ${
                          convo.participants.some(p => p.isVerified) ? "text-blue-500" : "text-gray-400"
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
                  <p className="font-semibold">
                    {selectedConversation.participants
                      .filter(p => p._id !== 'currentUserId') // Replace with actual current user ID
                      .map(p => p.username)
                      .join(', ') || 'Conversation'}
                  </p>
                  {selectedConversation.participants.some(p => p.role === "counselor") && (
                    <BadgeCheck
                      className={`w-5 h-5 ml-2 ${
                        selectedConversation.participants.some(p => p.isVerified)
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex mb-4 ${
                        msg.sender._id === "currentUserId" // Replace with actual current user ID
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg max-w-xs ${
                          msg.sender._id === "currentUserId" // Replace with actual current user ID
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender._id === "currentUserId" // Replace with actual current user ID
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No messages yet.</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    className="pr-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
