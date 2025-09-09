"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { conversationApi, messageApi, type Message } from "@/lib/api";

const BOT_NAME = "Whisprr Bot";
const BOT_ID = "whisprr-bot";

interface BotMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isBot: boolean;
}

function WhisprrBotChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize bot conversation
    const initConversation = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get or create conversation with bot
        const conversationsResponse = await conversationApi.getConversations();
        
        if (conversationsResponse.success && conversationsResponse.data) {
          // Find existing bot conversation
          let botConversation = conversationsResponse.data.find(
            (conv) => conv.participants.some(p => p.username === BOT_ID)
          );

          if (!botConversation) {
            // Create new conversation with bot
            const createResponse = await conversationApi.createConversation({
              participantIds: [BOT_ID],
              isGroup: false
            });

            if (createResponse.success && createResponse.data) {
              botConversation = createResponse.data;
            }
          }

          if (botConversation) {
            setConversationId(botConversation._id);
            
            // Load initial messages
            await loadMessages(botConversation._id);
            
            // Send welcome message if no messages exist
            if (messages.length === 0) {
              await sendBotWelcomeMessage();
            }
          }
        }
      } catch (error) {
        console.error("Error initializing conversation:", error);
        toast.error("Failed to initialize chat");
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    // Set up polling for new messages
    if (conversationId && user) {
      const pollMessages = async () => {
        await loadMessages(conversationId);
      };

      pollingIntervalRef.current = setInterval(pollMessages, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (convId: string) => {
    try {
      const response = await messageApi.getMessages(convId);
      
      if (response.success && response.data) {
        const formattedMessages: BotMessage[] = response.data.messages.map((msg: Message) => ({
          id: msg._id,
          text: msg.content.text,
          senderId: msg.sender._id,
          senderName: msg.sender.username === BOT_ID ? BOT_NAME : msg.sender.username,
          timestamp: new Date(msg.createdAt),
          isBot: msg.sender.username === BOT_ID
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendBotWelcomeMessage = async () => {
    try {
      // This would normally trigger a bot response from the backend
      // For now, we'll simulate it locally
      const welcomeMessage: BotMessage = {
        id: `welcome-${Date.now()}`,
        text: "Hey there! I'm Whisprr Bot. How are you feeling today?",
        senderId: BOT_ID,
        senderName: BOT_NAME,
        timestamp: new Date(),
        isBot: true
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Error sending welcome message:", error);
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
      // Send message to conversation
      const response = await messageApi.sendMessage(conversationId, {
        content: {
          text: messageText,
          type: 'text'
        },
        messageType: 'text'
      });

      if (response.success) {
        // Reload messages to get the new message and bot response
        await loadMessages(conversationId);
        
        // Simulate bot response (in production, this would be handled by the backend)
        setTimeout(async () => {
          const botResponse = generateBotResponse(messageText);
          
          // Add bot response locally (in production, this would come from the backend)
          const botMessage: BotMessage = {
            id: `bot-${Date.now()}`,
            text: botResponse,
            senderId: BOT_ID,
            senderName: BOT_NAME,
            timestamp: new Date(),
            isBot: true
          };
          
          setMessages(prev => [...prev, botMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setInput(messageText); // Restore input on error
    } finally {
      setIsSending(false);
    }
  };

  const generateBotResponse = (userMessage: string): string => {
    // Simple bot responses - in production, this would use AI/ML
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! It's great to hear from you. How can I support you today?";
    }
    
    if (lowerMessage.includes("sad") || lowerMessage.includes("depressed")) {
      return "I hear that you're going through a difficult time. It's okay to feel this way. Would you like to talk more about what's been on your mind?";
    }
    
    if (lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
      return "Anxiety can be really challenging. Remember to take deep breaths. What's been causing you to feel anxious lately?";
    }
    
    if (lowerMessage.includes("help")) {
      return "I'm here to listen and support you. You can share anything that's on your mind, or if you need professional help, consider reaching out to one of our counselors.";
    }
    
    if (lowerMessage.includes("thank")) {
      return "You're very welcome! I'm always here if you need someone to talk to. Take care of yourself!";
    }
    
    // Default response
    return "I understand. Thank you for sharing that with me. How does that make you feel?";
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSending) {
      handleSend();
    }
  };

  if (!user) {
    return (
      <Card className="w-full mx-auto h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
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
      <Card className="w-full mx-auto h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto h-[calc(100vh-3rem)] flex flex-col shadow-none border-none">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Bot className="w-6 h-6 text-blue-500" />
        <span className="font-bold text-lg">{BOT_NAME}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50 dark:bg-stone-900">
        {messages.length === 0 ? (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 max-w-xs bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
              Hey there! I&apos;m Whisprr Bot. How are you feeling today?
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = !msg.isBot;
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
                  {!msg.isBot && (
                    <p className="text-xs mt-1 opacity-70">{msg.senderName}</p>
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