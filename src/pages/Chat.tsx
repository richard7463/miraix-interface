const sendMessage = async (message: string) => {
  if (!message.trim()) return;
  
  // 更新 currentChat.id 为最新的
  const updatedChat = await getChatById(currentChat.id);
  if (updatedChat) {
    setCurrentChat(updatedChat);
  }

  const newMessage: Message = {
    id: Date.now().toString(),
    content: message,
    role: 'user',
    timestamp: new Date().toISOString(),
  };

  setMessages(prev => [...prev, newMessage]);
  setInputValue('');

  try {
    const response = await fetch(`${API_BASE_URL}/chat/${currentChat.id}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    setMessages(prev => [...prev, data]);
  } catch (error) {
    console.error('Error sending message:', error);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: 'Failed to send message. Please try again.',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    }]);
  }
}; 