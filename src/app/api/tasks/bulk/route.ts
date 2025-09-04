import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, tasks } = body

    if (!operation || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Operation and tasks array are required' },
        { status: 400 }
      )
    }

    const results: any[] = []
    let successCount = 0
    let failureCount = 0

    switch (operation) {
      case 'create':
        for (const taskData of tasks) {
          try {
            const task = await db.task.create({
              data: {
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority || 'MEDIUM',
                input: taskData.input ? JSON.stringify(taskData.input) : null,
                assignedToId: taskData.assignedToId,
                scheduledFor: taskData.scheduledFor ? new Date(taskData.scheduledFor) : null,
                schedule: taskData.schedule,
                isRecurring: taskData.isRecurring || false,
                status: 'PENDING'
              }
            })
            results.push({ success: true, task, index: tasks.indexOf(taskData) })
            successCount++
          } catch (error) {
            results.push({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
          }
        }
        break

      case 'update':
        for (const taskData of tasks) {
          if (!taskData.id) {
            results.push({ 
              success: false, 
              error: 'Task ID is required for update operation', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
            continue
          }

          try {
            const updateData: any = {}
            if (taskData.title !== undefined) updateData.title = taskData.title
            if (taskData.description !== undefined) updateData.description = taskData.description
            if (taskData.priority !== undefined) updateData.priority = taskData.priority
            if (taskData.input !== undefined) updateData.input = taskData.input ? JSON.stringify(taskData.input) : null
            if (taskData.assignedToId !== undefined) updateData.assignedToId = taskData.assignedToId
            if (taskData.status !== undefined) updateData.status = taskData.status
            if (taskData.progress !== undefined) updateData.progress = taskData.progress
            if (taskData.scheduledFor !== undefined) updateData.scheduledFor = taskData.scheduledFor ? new Date(taskData.scheduledFor) : null
            if (taskData.schedule !== undefined) updateData.schedule = taskData.schedule
            if (taskData.isRecurring !== undefined) updateData.isRecurring = taskData.isRecurring

            const task = await db.task.update({
              where: { id: taskData.id },
              data: updateData
            })
            results.push({ success: true, task, index: tasks.indexOf(taskData) })
            successCount++
          } catch (error) {
            results.push({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
          }
        }
        break

      case 'delete':
        for (const taskData of tasks) {
          if (!taskData.id) {
            results.push({ 
              success: false, 
              error: 'Task ID is required for delete operation', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
            continue
          }

          try {
            await db.task.delete({
              where: { id: taskData.id }
            })
            results.push({ success: true, deletedId: taskData.id, index: tasks.indexOf(taskData) })
            successCount++
          } catch (error) {
            results.push({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
          }
        }
        break

      case 'execute':
        for (const taskData of tasks) {
          if (!taskData.id) {
            results.push({ 
              success: false, 
              error: 'Task ID is required for execute operation', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
            continue
          }

          try {
            // Get the task with assigned agent
            const task = await db.task.findUnique({
              where: { id: taskData.id },
              include: { assignedTo: true }
            })

            if (!task) {
              results.push({ 
                success: false, 
                error: 'Task not found', 
                index: tasks.indexOf(taskData) 
              })
              failureCount++
              continue
            }

            if (!task.assignedTo) {
              results.push({ 
                success: false, 
                error: 'Task has no assigned agent', 
                index: tasks.indexOf(taskData) 
              })
              failureCount++
              continue
            }

            // Create execution record
            const execution = await db.execution.create({
              data: {
                agentId: task.assignedTo.id,
                taskId: task.id,
                status: 'RUNNING',
                input: task.input
              }
            })

            // Update task status
            await db.task.update({
              where: { id: task.id },
              data: { status: 'RUNNING' }
            })

            results.push({ 
              success: true, 
              executionId: execution.id, 
              taskId: task.id,
              index: tasks.indexOf(taskData) 
            })
            successCount++
          } catch (error) {
            results.push({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error', 
              index: tasks.indexOf(taskData) 
            })
            failureCount++
          }
        }
        break

      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      operation,
      total: tasks.length,
      successCount,
      failureCount,
      results
    })

  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}