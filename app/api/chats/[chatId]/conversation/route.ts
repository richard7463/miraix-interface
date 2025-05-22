import { NextResponse } from 'next/server'
import { API_BASE } from '@/lib/config'

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const response = await fetch(`${API_BASE}/api/chat-sessions/${params.chatId}/messages`)
    if (!response.ok) {
      throw new Error('Failed to fetch messages')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const body = await request.json()
    const response = await fetch(`${API_BASE}/api/chat-sessions/${params.chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error('Failed to save messages')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error saving messages:', error)
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    )
  }
} 