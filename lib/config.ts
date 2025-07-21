const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://new-miraix-api.vercel.app';

export { API_BASE };

export const API_ENDPOINTS = {
  CHAT: `${API_BASE}/api/chat`,
  CREATE_CHAT: `${API_BASE}/api/create-chat`,
  CHAT_MESSAGES: (chatId: string) => `${API_BASE}/api/chats/${chatId}/messages`,
  SAVE_MESSAGES: (chatId: string) => `${API_BASE}/api/${chatId}/savemessages`,
  DOCUMENT_UPLOAD: `${API_BASE}/api/document/upload`,
  REGISTER_USER: `${API_BASE}/api/auth/register`,
  USER_CHATS: `${API_BASE}/api/user/chats`,
  CHAT_INFO: (chatId: string) => `${API_BASE}/api/chats/${chatId}`,
} as const; 