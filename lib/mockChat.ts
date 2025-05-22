import { ChatMessage, Persona } from '@/components/Chat/interface'

const mockResponses = [
  "I understand you want to swap. I can help you with that. What tokens would you like to swap?",
  "Sure, I can help you with the swap. Which tokens are you interested in?",
  "Let's do the swap! Please tell me which tokens you want to exchange.",
  "I'm ready to help with your swap. What tokens would you like to trade?",
  "Great! For the swap, I'll need to know which tokens you want to exchange.",
  "I can assist with your swap request. Please specify the tokens you want to swap.",
  "Let's get started with your swap. Which tokens are you looking to exchange?",
  "I'm here to help with your swap. What tokens would you like to trade?",
  "Ready to help with your swap! Please tell me the tokens you want to exchange.",
  "I can help you with the swap. Which tokens would you like to swap?"
];

export const mockChatReply = async (
  messages: ChatMessage[],
  persona: Persona
): Promise<ChatMessage> => {
  // 随机选择一个回复
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  const mockReply = mockResponses[randomIndex];
  
  return {
    role: 'assistant',
    content: mockReply
  }
} 