import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await db.agentTemplate.findUnique({
      where: { id: params.id },
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Agent template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching agent template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      displayName, 
      description, 
      type, 
      capabilities, 
      model, 
      config, 
      category, 
      tags, 
      isActive 
    } = body

    const existingTemplate = await db.agentTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Agent template not found' },
        { status: 404 }
      )
    }

    // System templates cannot be modified
    if (existingTemplate.isSystem) {
      return NextResponse.json(
        { error: 'System templates cannot be modified' },
        { status: 403 }
      )
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (displayName !== undefined) updateData.displayName = displayName
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (capabilities !== undefined) updateData.capabilities = JSON.stringify(capabilities)
    if (model !== undefined) updateData.model = model
    if (config !== undefined) updateData.config = config ? JSON.stringify(config) : null
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const template = await db.agentTemplate.update({
      where: { id: params.id },
      data: updateData,
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating agent template:', error)
    return NextResponse.json(
      { error: 'Failed to update agent template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingTemplate = await db.agentTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Agent template not found' },
        { status: 404 }
      )
    }

    // System templates cannot be deleted
    if (existingTemplate.isSystem) {
      return NextResponse.json(
        { error: 'System templates cannot be deleted' },
        { status: 403 }
      )
    }

    await db.agentTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Agent template deleted successfully' })
  } catch (error) {
    console.error('Error deleting agent template:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent template' },
      { status: 500 }
    )
  }
}