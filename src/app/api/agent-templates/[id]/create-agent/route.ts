import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, customConfig, overrideCapabilities } = body

    // Get the template
    const template = await db.agentTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Agent template not found' },
        { status: 404 }
      )
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: 'Template is not active' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      )
    }

    // Parse template data
    const capabilities = overrideCapabilities || JSON.parse(template.capabilities || '[]')
    const config = customConfig || (template.config ? JSON.parse(template.config) : null)

    // Create the agent from template
    const agent = await db.agent.create({
      data: {
        name,
        type: template.type,
        description: template.description,
        capabilities: JSON.stringify(capabilities),
        model: template.model,
        config: config ? JSON.stringify(config) : null,
        templateId: template.id,
        status: 'IDLE'
      }
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent from template:', error)
    return NextResponse.json(
      { error: 'Failed to create agent from template' },
      { status: 500 }
    )
  }
}