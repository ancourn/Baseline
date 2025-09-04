import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, customInput, overridePriority, assignedToId } = body

    // Get the template
    const template = await db.taskTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Task template not found' },
        { status: 404 }
      )
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: 'Template is not active' },
        { status: 400 }
      )
    }

    // Use provided title or generate one
    const taskTitle = title || `${template.displayName} - ${new Date().toLocaleDateString()}`

    // Parse template data
    const input = customInput || (template.inputTemplate ? JSON.parse(template.inputTemplate) : null)
    const priority = overridePriority || template.priority

    // Create the task from template
    const task = await db.task.create({
      data: {
        title: taskTitle,
        description: template.description,
        priority: priority,
        input: input ? JSON.stringify(input) : null,
        templateId: template.id,
        assignedToId,
        status: 'PENDING'
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task from template:', error)
    return NextResponse.json(
      { error: 'Failed to create task from template' },
      { status: 500 }
    )
  }
}