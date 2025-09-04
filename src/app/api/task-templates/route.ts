import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const templates = await db.taskTemplate.findMany({
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' }
      ],
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching task templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task templates' },
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
      priority, 
      inputTemplate, 
      config, 
      category, 
      tags,
      isSystem = false 
    } = body

    if (!name || !displayName || !type || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, type, category' },
        { status: 400 }
      )
    }

    const template = await db.taskTemplate.create({
      data: {
        name,
        displayName,
        description: description || '',
        type,
        priority: priority || 'MEDIUM',
        inputTemplate: inputTemplate ? JSON.stringify(inputTemplate) : null,
        config: config ? JSON.stringify(config) : null,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        isSystem,
        isActive: true
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating task template:', error)
    return NextResponse.json(
      { error: 'Failed to create task template' },
      { status: 500 }
    )
  }
}