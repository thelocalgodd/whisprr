import { database, ref, push, onValue, off, serverTimestamp, set, get } from "@/lib/firebase";
import { getCurrentFirebaseUser } from "./firebase-auth";
import { whisprrBot } from "@/lib/groq";

export interface FirebaseMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: unknown;
  isAnonymous?: boolean;
}

export interface FirebaseConversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: unknown;
  type: "direct" | "group" | "bot";
}

// Send a message to a conversation
export const sendMessage = async (
  conversationId: string,
  text: string,
  senderName: string
): Promise<void> => {
  const user = getCurrentFirebaseUser();
  if (!user) throw new Error("User not authenticated");

  const messagesRef = ref(database, `messages/${conversationId}`);
  const newMessage: Omit<FirebaseMessage, 'id'> = {
    senderId: user.uid,
    senderName: senderName || (user.isAnonymous ? `Anonymous-${user.uid.slice(0, 6)}` : user.displayName || "Unknown"),
    text,
    timestamp: serverTimestamp(),
    isAnonymous: user.isAnonymous,
  };

  await push(messagesRef, newMessage);

  // Update conversation's last message
  const conversationRef = ref(database, `conversations/${conversationId}/lastMessage`);
  await set(conversationRef, text);
  const conversationTimeRef = ref(database, `conversations/${conversationId}/lastMessageTime`);
  await set(conversationTimeRef, serverTimestamp());
};

// Listen to messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: FirebaseMessage[]) => void
): (() => void) => {
  const messagesRef = ref(database, `messages/${conversationId}`);
  
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const messages: FirebaseMessage[] = Object.entries(data).map(([id, message]) => ({
      id,
      ...(message as Omit<FirebaseMessage, 'id'>),
    }));

    // Sort messages by timestamp
    messages.sort((a, b) => {
      const timeA = (a.timestamp as number) || 0;
      const timeB = (b.timestamp as number) || 0;
      return timeA - timeB;
    });

    callback(messages);
  });

  return () => off(messagesRef, 'value');
};

// Create or get a conversation
export const createOrGetConversation = async (
  participants: string[],
  type: "direct" | "group" | "bot" = "direct"
): Promise<string> => {
  const user = getCurrentFirebaseUser();
  if (!user) throw new Error("User not authenticated");

  // Add current user to participants if not already included
  if (!participants.includes(user.uid)) {
    participants.push(user.uid);
  }

  // For direct messages, create a deterministic ID
  if (type === "direct" && participants.length === 2) {
    const sortedParticipants = participants.sort();
    const conversationId = `${sortedParticipants[0]}_${sortedParticipants[1]}`;
    
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);
    
    if (!snapshot.exists()) {
      await set(conversationRef, {
        id: conversationId,
        participants: sortedParticipants,
        type,
        createdAt: serverTimestamp(),
      });
    }
    
    return conversationId;
  }

  // For group chats or bot conversations, create a new conversation
  const conversationsRef = ref(database, 'conversations');
  const newConversationRef = push(conversationsRef);
  const conversationId = newConversationRef.key!;
  
  await set(newConversationRef, {
    id: conversationId,
    participants,
    type,
    createdAt: serverTimestamp(),
  });

  return conversationId;
};

// Subscribe to user's conversations
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: FirebaseConversation[]) => void
): (() => void) => {
  const conversationsRef = ref(database, 'conversations');
  
  onValue(conversationsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const conversations: FirebaseConversation[] = Object.entries(data)
      .filter(([, conv]) => {
        const conversation = conv as Record<string, unknown>;
        const participants = conversation.participants as string[] | undefined;
        return participants?.includes(userId);
      })
      .map(([id, conv]) => ({
        id,
        ...(conv as Omit<FirebaseConversation, 'id'>),
      }));

    callback(conversations);
  });

  return () => off(conversationsRef, 'value');
};

// Get conversation history for context
const getConversationHistory = async (conversationId: string): Promise<FirebaseMessage[]> => {
  const messagesRef = ref(database, `messages/${conversationId}`);
  const snapshot = await get(messagesRef);
  
  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();
  const messages: FirebaseMessage[] = Object.entries(data).map(([id, message]) => ({
    id,
    ...message,
  }));

  // Sort messages by timestamp and return last 10
  messages.sort((a, b) => {
    const timeA = (a.timestamp as number) || 0;
    const timeB = (b.timestamp as number) || 0;
    return timeA - timeB;
  });

  return messages.slice(-10);
};

// Send a message to the Whisprr Bot (powered by Groq)
export const sendBotMessage = async (
  conversationId: string,
  userMessage: string,
  userName: string
): Promise<void> => {
  // If it's the initial message (empty userMessage), just send the welcome message
  if (!userMessage) {
    const botMessageRef = ref(database, `messages/${conversationId}`);
    await push(botMessageRef, {
      senderId: "whisprr-bot",
      senderName: "Whisprr Bot",
      text: "Hey there! I'm Whisprr Bot, powered by AI. I'm here to provide emotional support and be a safe space for you to share. How are you feeling today?",
      timestamp: serverTimestamp(),
      isAnonymous: false,
    });
    return;
  }

  // Send user message first
  await sendMessage(conversationId, userMessage, userName);

  // Get conversation history for context
  const conversationHistory = await getConversationHistory(conversationId);

  // Generate bot response using Groq
  setTimeout(async () => {
    try {
      const botResponse = await whisprrBot.generateResponse(userMessage, conversationHistory);
      const botMessageRef = ref(database, `messages/${conversationId}`);
      
      await push(botMessageRef, {
        senderId: "whisprr-bot",
        senderName: "Whisprr Bot",
        text: botResponse,
        timestamp: serverTimestamp(),
        isAnonymous: false,
      });

      // Update conversation's last message
      const conversationRef = ref(database, `conversations/${conversationId}/lastMessage`);
      await set(conversationRef, botResponse);
      const conversationTimeRef = ref(database, `conversations/${conversationId}/lastMessageTime`);
      await set(conversationTimeRef, serverTimestamp());
    } catch (error) {
      console.error('Error generating bot response:', error);
      
      // Fallback to simple response if Groq fails
      const fallbackResponse = "I'm having trouble connecting right now, but I'm still here to listen. Can you tell me more about how you're feeling?";
      const botMessageRef = ref(database, `messages/${conversationId}`);
      
      await push(botMessageRef, {
        senderId: "whisprr-bot",
        senderName: "Whisprr Bot",
        text: fallbackResponse,
        timestamp: serverTimestamp(),
        isAnonymous: false,
      });

      // Update conversation's last message
      const conversationRef = ref(database, `conversations/${conversationId}/lastMessage`);
      await set(conversationRef, fallbackResponse);
      const conversationTimeRef = ref(database, `conversations/${conversationId}/lastMessageTime`);
      await set(conversationTimeRef, serverTimestamp());
    }
  }, 1000);
};

