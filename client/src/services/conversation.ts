import axios from "@/utils/axios";

// Fetch all conversations
export const getConversations = async () => {
  try {
    const response = await axios.get("/conversations");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    throw error;
  }
};

// Fetch messages for a specific conversation
export const getMessages = async (conversationId: string) => {
  try {
    const response = await axios.get(`/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    throw error;
  }
};

// Send a new message
export const sendMessage = async (conversationId: string, content: string) => {
  try {
    const response = await axios.post(`/conversations/${conversationId}/messages`, { content });
    return response.data;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};
