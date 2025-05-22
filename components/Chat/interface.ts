export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Persona {
  id: string;
  name: string;
  prompt: string;
  description?: string;
  avatar?: string;
  role?: 'assistant' | 'user' | 'system';
}

export interface Chat {
  id: string;
  persona: Persona;
  isNew: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: string;
}

export type ChatRole = 'assistant' | 'user' | 'system'

export const DefaultPersonas: Persona[] = [
  {
    id: 'default',
    name: 'MiraiX',
    prompt: 'You are MiraiX, a helpful AI assistant.',
    description: 'Default persona for MiraiX',
    role: 'assistant'
  }
]
