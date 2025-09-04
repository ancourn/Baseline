import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        assignedTo: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 3
        },
        dependencies: {
          include: {
            dependsOn: true
          }
        }
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority, assignedToId, input } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'MEDIUM',
        assignedToId,
        input: input ? JSON.stringify(input) : null,
        status: 'PENDING',
        progress: 0
      },
      include: {
        assignedTo: true
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}