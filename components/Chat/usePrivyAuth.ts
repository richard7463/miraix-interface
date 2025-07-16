import { useSignMessage } from '@privy-io/react-auth';
import { useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import { useSolanaWallets } from '@privy-io/react-auth/solana';

type AuthHeaders = Record<string, string>;

// 测试模式：使用固定的测试签名
const TEST_SIGNATURE = "0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";

export const usePrivyAuth = () => {
  const { wallets: solanaWallets } = useSolanaWallets();
  const { signMessage } = useSignMessage({
    onSuccess: async ({ signature }) => {
      console.log('Signature successful:', signature);
    },
    onError: (error) => {
      console.error('Signature error:', error);
    }
  });

  // 获取当前连接的Solana钱包地址
  const getCurrentWalletAddress = useCallback(() => {
    const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
    return embeddedWallet?.address || '0x1234567890123456789012345678901234567890';
  }, [solanaWallets]);

  const getAuthHeaders = useCallback(async (message: string): Promise<AuthHeaders> => {
    try {
      const { signature } = await signMessage({ message });
      // Use current Solana wallet address
      const address = getCurrentWalletAddress();
      
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
  }, [signMessage, getCurrentWalletAddress]);

  const getUserChats = useCallback(async () => {
    try {
      const message = 'Get user chats';
      const currentAddress = getCurrentWalletAddress();
      
      console.log('[usePrivyAuth] Getting user chats for address:', currentAddress);
      
      // 使用当前连接的Solana钱包地址
      const headers = {
        'signature': TEST_SIGNATURE,
        'message': message,
        'address': currentAddress,
        'Content-Type': 'application/json'
      };

      const response = await fetch(API_ENDPOINTS.USER_CHATS, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to get user chats');
      }

      const data = await response.json();
      console.log('[usePrivyAuth] Received user chats:', data);
      return data;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }, [getCurrentWalletAddress]); // 添加getCurrentWalletAddress依赖

  const registerUser = useCallback(async () => {
    try {
      const address = getCurrentWalletAddress();
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
  }, [getCurrentWalletAddress]);

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