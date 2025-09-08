"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  createOrGetConversation, 
  subscribeToMessages, 
  sendBotMessage,
  type FirebaseMessage 
} from "@/services/firebase-messaging";
import { toast } from "sonner";

const BOT_NAME = "Whisprr Bot";

function WhisprrBotChat() {
  const { user, firebaseUser } = useAuth();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initialize bot conversation
    const initConversation = async () => {
      if (!firebaseUser && !user) {
        setIsLoading(false);
        return;
      }

      try {
        const userId = firebaseUser?.uid || user?.username || "anonymous";
        const convId = await createOrGetConversation(["whisprr-bot", userId], "bot");
        setConversationId(convId);

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(convId, (msgs) => {
          setMessages(msgs);
          setIsLoading(false);
        });
        unsubscribeRef.current = unsubscribe;

        // Send initial bot message if no messages exist
        if (messages.length === 0) {
          setTimeout(() => {
            sendBotMessage(convId, "", "Whisprr Bot");
          }, 500);
        }
      } catch (error) {
        console.error("Error initializing conversation:", error);
        toast.error("Failed to initialize chat");
        setIsLoading(false);
      }
    };

    initConversation();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [firebaseUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isSending) return;
    
    const currentUser = firebaseUser || user;
    if (!currentUser) {
      toast.error("Please sign in to send messages");
      return;
    }

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const userName = user?.username || 
        (firebaseUser?.isAnonymous ? `Anonymous-${firebaseUser.uid.slice(0, 6)}` : firebaseUser?.displayName || "User");
      
      await sendBotMessage(conversationId, messageText, userName);
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
      <Card className="w-full mx-auto h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to use the chat</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full mx-auto h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
      <div className="flex items-center gap-2 px-4 py-0 border-b">
        <Bot className="w-6 h-6 text-blue-500" />
        <span className="font-bold text-lg">{BOT_NAME}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50 dark:bg-stone-900">
        {messages.length === 0 ? (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 max-w-xs bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
              Hey there! I'm whisprr. How are you feeling today?
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.senderId !== "whisprr-bot";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs whitespace-pre-line ${
                    isUser
                      ? "bg-blue-500 text-white"
                      : "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  }`}
                >
                  {msg.text}
                  {msg.isAnonymous && (
                    <p className="text-xs mt-1 opacity-70">
                      {msg.senderName}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={isSending || !conversationId}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !input.trim() || !conversationId}
          variant="default"
        >
          <Send className="w-4 h-4 mr-1" />
          Send
        </Button>
      </div>
    </Card>
  );
}

export default WhisprrBotChat;
