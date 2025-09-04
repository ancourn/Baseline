import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { taskScheduler } from '@/lib/services/task-scheduler'

export async function GET() {
  try {
    const scheduledTasks = await db.task.findMany({
      where: {
        OR: [
          {
            schedule: {
              not: null
            }
          },
          {
            scheduledFor: {
              not: null
            }
          }
        ]
      },
      orderBy: [
        { scheduledFor: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    // Add scheduler status for each task
    const tasksWithStatus = scheduledTasks.map(task => ({
      ...task,
      schedulerStatus: taskScheduler.getJobStatus(task.id)
    }))

    return NextResponse.json(tasksWithStatus)
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      taskId, 
      schedule, 
      scheduledFor, 
      isRecurring = false,
      agentId 
    } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get the existing task
    const existingTask = await db.task.findUnique({
      where: { id: taskId }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate cron expression if provided
    if (schedule && !validateCronExpression(schedule)) {
      return NextResponse.json(
        { error: 'Invalid cron expression' },
        { status: 400 }
      )
    }

    // Update the task with scheduling information
    const updateData: any = {
      updatedAt: new Date()
    }

    if (schedule !== undefined) updateData.schedule = schedule
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring
    if (agentId !== undefined) updateData.assignedToId = agentId

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    // Schedule the task if it has a cron expression
    if (schedule && isRecurring) {
      const success = taskScheduler.scheduleTask(taskId, schedule)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to schedule task with cron expression' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      task: updatedTask,
      message: 'Task scheduled successfully'
    })
  } catch (error) {
    console.error('Error scheduling task:', error)
    return NextResponse.json(
      { error: 'Failed to schedule task' },
      { status: 500 }
    )
  }
}

function validateCronExpression(cronExpression: string): boolean {
  try {
    // Basic validation for common cron patterns
    const parts = cronExpression.split(' ')
    if (parts.length !== 5) return false

    // Validate each part (minute, hour, day, month, weekday)
    const validRanges = [
      { min: 0, max: 59 },   // minute
      { min: 0, max: 23 },   // hour
      { min: 1, max: 31 },   // day
      { min: 1, max: 12 },   // month
      { min: 0, max: 6 }     // weekday (0=Sunday)
    ]

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      
      // Allow wildcard
      if (part === '*') continue
      
      // Allow step values (e.g., */5)
      if (part.includes('/')) {
        const [base, step] = part.split('/')
        if (base !== '*' && isNaN(parseInt(base))) return false
        if (isNaN(parseInt(step))) return false
        continue
      }
      
      // Allow ranges (e.g., 1-5)
      if (part.includes('-')) {
        const [start, end] = part.split('-')
        if (isNaN(parseInt(start)) || isNaN(parseInt(end))) return false
        continue
      }
      
      // Allow lists (e.g., 1,2,3)
      if (part.includes(',')) {
        const values = part.split(',')
        for (const value of values) {
          if (isNaN(parseInt(value))) return false
        }
        continue
      }
      
      // Allow single numbers
      if (isNaN(parseInt(part))) return false
      
      // Check range
      const num = parseInt(part)
      const range = validRanges[i]
      if (num < range.min || num > range.max) return false
    }

    return true
  } catch (error) {
    return false
  }
}