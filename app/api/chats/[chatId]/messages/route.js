import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://new-miraix-api.vercel.app';

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
    } catch (error) {
    clearTimeout(id);
        throw error;
    }
}

export async function GET(request, { params }) {
    try {
    const chatId = await Promise.resolve(params.chatId);
        if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
        }

    const response = await fetchWithTimeout(`${API_URL}/api/chats/${chatId}/messages`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
    } catch (error) {
    console.error('Error loading messages:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
    const { chatId } = params;
        if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
        }

        const { messages } = await request.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages must be an array' }, { status: 400 });
    }

    console.log('Saving messages:', {
      chatId,
      messageCount: messages.length
    });

    const response = await fetchWithTimeout(`${API_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    } catch (error) {
    console.error('Error saving messages:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
      }
    }
    return NextResponse.json({ error: 'Failed to save messages' }, { status: 500 });
    }
} 