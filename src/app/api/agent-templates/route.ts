import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const templates = await db.agentTemplate.findMany({
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' }
      ],
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

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching agent templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      displayName, 
      description, 
      type, 
      capabilities, 
      model, 
      config, 
      category, 
      tags,
      isSystem = false 
    } = body

    if (!name || !displayName || !type || !model || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, type, model, category' },
        { status: 400 }
      )
    }

    const template = await db.agentTemplate.create({
      data: {
        name,
        displayName,
        description: description || '',
        type,
        capabilities: JSON.stringify(capabilities || []),
        model,
        config: config ? JSON.stringify(config) : null,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        isSystem,
        isActive: true
      },
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

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating agent template:', error)
    return NextResponse.json(
      { error: 'Failed to create agent template' },
      { status: 500 }
    )
  }
}