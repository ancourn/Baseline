import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, customConfig, overrideCapabilities } = body

    // Get the original agent
    const originalAgent = await db.agent.findUnique({
      where: { id: params.id },
      include: {
        template: true
      }
    })

    if (!originalAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Validate new agent name
    if (!name) {
      return NextResponse.json(
        { error: 'New agent name is required' },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existingAgent = await db.agent.findFirst({
      where: { name }
    })

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent with this name already exists' },
        { status: 409 }
      )
    }

    // Parse original agent data
    const capabilities = overrideCapabilities || JSON.parse(originalAgent.capabilities || '[]')
    const config = customConfig || (originalAgent.config ? JSON.parse(originalAgent.config) : null)

    // Create cloned agent
    const clonedAgent = await db.agent.create({
      data: {
        name,
        type: originalAgent.type,
        description: `Cloned from ${originalAgent.name}. ${originalAgent.description}`,
        capabilities: JSON.stringify(capabilities),
        model: originalAgent.model,
        config: config ? JSON.stringify(config) : null,
        templateId: originalAgent.templateId,
        status: 'IDLE'
      },
      include: {
        template: true
      }
    })

    // Log the cloning operation
    console.log(`🔄 Agent cloned: ${originalAgent.name} -> ${name}`)

    return NextResponse.json({
      originalAgent: {
        id: originalAgent.id,
        name: originalAgent.name,
        type: originalAgent.type
      },
      clonedAgent,
      message: 'Agent cloned successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error cloning agent:', error)
    return NextResponse.json(
      { error: 'Failed to clone agent' },
      { status: 500 }
    )
  }
}