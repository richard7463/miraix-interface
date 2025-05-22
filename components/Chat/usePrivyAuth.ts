import { useSignMessage } from '@privy-io/react-auth';
import { useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

type AuthHeaders = Record<string, string>;

// 测试模式：使用固定的测试签名
const TEST_SIGNATURE = "0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";
const TEST_ADDRESS = "0x1234567890123456789012345678901234567890";

export const usePrivyAuth = () => {
  const { signMessage } = useSignMessage({
    onSuccess: async ({ signature }) => {
      console.log('Signature successful:', signature);
    },
    onError: (error) => {
      console.error('Signature error:', error);
    }
  });

  const getAuthHeaders = useCallback(async (message: string): Promise<AuthHeaders> => {
    try {
      const { signature } = await signMessage({ message });
      // Use mock address instead of window.ethereum?.selectedAddress
      const address = TEST_ADDRESS;
      
      if (!address) {
        throw new Error('No address found');
      }

      return {
        'signature': signature,
        'message': message,
        'address': address,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw error;
    }
  }, [signMessage]);

  const getUserChats = useCallback(async () => {
    try {
      const message = 'Get user chats';
      // 使用测试签名和地址
      const headers = {
        'signature': TEST_SIGNATURE,
        'message': message,
        'address': TEST_ADDRESS,
        'Content-Type': 'application/json'
      };

      const response = await fetch(API_ENDPOINTS.USER_CHATS, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to get user chats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }, []); // 移除 getAuthHeaders 依赖

  const registerUser = useCallback(async () => {
    try {
      const address = window.ethereum?.selectedAddress;
      if (!address) throw new Error('No address found');

      const response = await fetch(API_ENDPOINTS.REGISTER_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }, []);

  const createChat = useCallback(async (chatData: any) => {
    try {
      const message = 'Create new chat';
      const headers = await getAuthHeaders(message);

      const response = await fetch(API_ENDPOINTS.CREATE_CHAT, {
        method: 'POST',
        headers,
        body: JSON.stringify(chatData)
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }, [getAuthHeaders]);

  const getChatMessages = useCallback(async (chatId: string) => {
    try {
      const message = `Get messages for chat ${chatId}`;
      const headers = await getAuthHeaders(message);

      const response = await fetch(API_ENDPOINTS.CHAT_MESSAGES(chatId), {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to get chat messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }, [getAuthHeaders]);

  const saveMessages = useCallback(async (chatId: string, messages: any[]) => {
    try {
      const message = `Save messages for chat ${chatId}`;
      const headers = await getAuthHeaders(message);

      const response = await fetch(API_ENDPOINTS.SAVE_MESSAGES(chatId), {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        throw new Error('Failed to save messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }, [getAuthHeaders]);

  return {
    registerUser,
    getUserChats,
    createChat,
    getChatMessages,
    saveMessages
  };
}; 