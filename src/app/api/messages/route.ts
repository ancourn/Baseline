import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const messages = await db.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(messages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, content, type, metadata } = body

    if (!agentId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, content' },
        { status: 400 }
      )
    }

    // Verify agent exists
    const agent = await db.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const message = await db.message.create({
      data: {
        agentId,
        content,
        type: type || 'AGENT',
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}