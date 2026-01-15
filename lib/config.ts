const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://new-miraix-api.vercel.app';
const LANGGRAPH_API_BASE = process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE || 'https://langgraph-defai.vercel.app';
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/';

export { API_BASE, LANGGRAPH_API_BASE, SOLANA_RPC_URL };

export const API_ENDPOINTS = {
  CHAT: `${API_BASE}/api/chat`,
  CREATE_CHAT: `${API_BASE}/api/create-chat`,
  CHAT_MESSAGES: (chatId: string) => `${API_BASE}/api/chats/${chatId}/messages`,
  SAVE_MESSAGES: (chatId: string) => `${API_BASE}/api/${chatId}/savemessages`,
  DOCUMENT_UPLOAD: `${API_BASE}/api/document/upload`,
  REGISTER_USER: `${API_BASE}/api/auth/register`,
  USER_CHATS: `${API_BASE}/api/user/chats`,
  CHAT_INFO: (chatId: string) => `${API_BASE}/api/chats/${chatId}`,
  PAYAI_SETTLE: `${LANGGRAPH_API_BASE}/api/payai/settle`,
  X402_VERIFY_PAYMENT: `${LANGGRAPH_API_BASE}/api/x402/verify-payment`,
} as const; 