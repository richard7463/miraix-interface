import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://new-miraix-api.vercel.app';

export async function POST(request: Request) {
  try {
    const { chatId, persona } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Call Node.js API to create chat
    const response = await fetch(`${API_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        persona,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
} 