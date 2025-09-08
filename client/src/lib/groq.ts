import Groq from "groq-sdk";

// Initialize Groq client for browser usage
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are an AI peer-support chatbot designed for anonymous counseling conversations with teenagers in Ghana. You provide empathetic listening, safe guidance, and encouragement without replacing professional help.

Core Behavior:
- Always respond with kindness, validation, and non-judgmental tone
- Use simple, teen-friendly language that feels warm and approachable
- Never ask for personally identifiable information
- If a user shares identifying information, gently remind them of the importance of anonymity

Safety Protocols:
- If the user expresses suicidal thoughts, self-harm, abuse, or being in immediate danger, respond with compassion and encourage contacting crisis lines
- Provide Ghana helpline: call 0800-678-678 (Mental Health Authority Ghana), or +233 244 846 701 / 2332 444 71279 for 24/7 support
- Make clear you cannot provide emergency intervention

Scope of Support:
- Offer emotional support, coping strategies, and healthy lifestyle suggestions
- Encourage professional help when issues appear severe
- Do not diagnose or prescribe medication
- Keep responses concise but meaningful (max 200 words)

Remember: You're a peer support chatbot focused on emotional wellbeing and mental health support in an anonymous, safe environment.`;

export class WhisprrBot {
  async generateResponse(userMessage: string, conversationHistory: Array<Record<string, unknown>> = []): Promise<string> {
    try {
      // Check if API key is available
      if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
        console.warn('Groq API key not found, using fallback response');
        return this.getFallbackResponse(userMessage);
      }

      // Format messages for Groq API
      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...this.formatConversationHistory(conversationHistory),
        { role: 'user', content: userMessage }
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages: messages,
        model: "openai/gpt-oss-20b",
        temperature: 0.7,
        max_tokens: 300,
        top_p: 1,
        stream: false,
      });

      const response = chatCompletion.choices[0]?.message?.content;
      
      if (!response) {
        return this.getFallbackResponse(userMessage);
      }

      return response;
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  // Helper method to format conversation history for context
  formatConversationHistory(messages: Array<Record<string, unknown>>): ChatMessage[] {
    return messages.slice(-10).map(msg => ({
      role: msg.senderId === 'whisprr-bot' ? 'assistant' as const : 'user' as const,
      content: String(msg.text || '')
    }));
  }

  // Fallback responses when Groq API is unavailable
  private getFallbackResponse(userText: string): string {
    const lowerText = userText.toLowerCase();
    
    if (/hello|hi|hey/.test(lowerText)) {
      return "Hello! I'm here to listen and support you. How are you feeling today?";
    }
    if (/sad|down|depressed/.test(lowerText)) {
      return "I'm sorry you're feeling this way. It takes courage to share these feelings. Would you like to talk more about what's making you feel sad?";
    }
    if (/anxious|anxiety|worried|stress/.test(lowerText)) {
      return "Anxiety can be really overwhelming. You're not alone in feeling this way. Would you like to try some breathing exercises or talk about what's worrying you?";
    }
    if (/suicide|kill myself|end it|die/.test(lowerText)) {
      return "I'm really concerned about you. Please reach out for help right now. Call the Mental Health Authority Ghana at 0800-678-678 or +233 244 846 701 for 24/7 support. You matter, and there are people who want to help.";
    }
    if (/help|support/.test(lowerText)) {
      return "I'm here to listen and support you. You can share anything on your mind, or if you need immediate help, call 0800-678-678 (Mental Health Authority Ghana).";
    }
    if (/thank/.test(lowerText)) {
      return "You're welcome! Remember, I'm always here if you need someone to talk to. Take care of yourself.";
    }
    
    return "I hear you. Your feelings are valid. Can you tell me more about what you're experiencing right now?";
  }
}

export const whisprrBot = new WhisprrBot();