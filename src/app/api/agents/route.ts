import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, description, capabilities, model, config } = body

    if (!name || !type || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, model' },
        { status: 400 }
      )
    }

    const agent = await db.agent.create({
      data: {
        name,
        type,
        description: description || '',
        capabilities: JSON.stringify(capabilities || []),
        model,
        config: config ? JSON.stringify(config) : null,
        status: 'IDLE'
      }
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}