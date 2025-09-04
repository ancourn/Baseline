import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, taskId, input } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required field: agentId' },
        { status: 400 }
      )
    }

    // Get agent details
    const agent = await db.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get task details if provided
    let task = null
    if (taskId) {
      task = await db.task.findUnique({
        where: { id: taskId }
      })
    }

    // Create execution record
    const execution = await db.execution.create({
      data: {
        agentId,
        taskId,
        status: 'RUNNING',
        input: input ? JSON.stringify(input) : null
      }
    })

    // Update agent status
    await db.agent.update({
      where: { id: agentId },
      data: { status: 'RUNNING' }
    })

    // Update task status if provided
    if (task) {
      await db.task.update({
        where: { id: taskId },
        data: { status: 'RUNNING' }
      })
    }

    // Execute the agent logic asynchronously
    executeAgentLogic(agent, task, execution, input)

    return NextResponse.json({
      executionId: execution.id,
      status: 'RUNNING',
      message: 'Agent execution started'
    })
  } catch (error) {
    console.error('Error starting execution:', error)
    return NextResponse.json(
      { error: 'Failed to start execution' },
      { status: 500 }
    )
  }
}

async function executeAgentLogic(agent: any, task: any, execution: any, input: any) {
  try {
    const startTime = Date.now()
    
    // Log execution start
    await db.executionLog.create({
      data: {
        executionId: execution.id,
        level: 'INFO',
        message: `Starting execution for agent: ${agent.name}`,
        metadata: JSON.stringify({ agentId: agent.id, taskId: task?.id })
      }
    })

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Prepare the prompt based on agent type and task
    let prompt = `You are ${agent.name}, a ${agent.type}. `
    
    if (task) {
      prompt += `Your task is: ${task.title}. ${task.description}. `
    }
    
    prompt += `Use your capabilities to accomplish this task effectively.`

    if (input) {
      prompt += `\n\nInput data: ${JSON.stringify(input)}`
    }

    // Get agent capabilities
    const capabilities = JSON.parse(agent.capabilities || '[]')
    if (capabilities.length > 0) {
      prompt += `\n\nYour capabilities include: ${capabilities.join(', ')}.`
    }

    // Execute the AI model
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are ${agent.name}, ${agent.type}. ${agent.description}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const result = completion.choices[0]?.message?.content || 'No response generated'

    // Calculate execution duration
    const duration = Date.now() - startTime

    // Update execution record
    await db.execution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        output: JSON.stringify({ result, timestamp: new Date().toISOString() }),
        duration,
        completedAt: new Date()
      }
    })

    // Update task if provided
    if (task) {
      await db.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          output: JSON.stringify({ result, timestamp: new Date().toISOString() }),
          completedAt: new Date()
        }
      })
    }

    // Log completion
    await db.executionLog.create({
      data: {
        executionId: execution.id,
        level: 'INFO',
        message: `Execution completed successfully in ${duration}ms`,
        metadata: JSON.stringify({ result: result.substring(0, 100) + '...' })
      }
    })

    // Create agent message
    await db.message.create({
      data: {
        agentId: agent.id,
        content: `Task completed: ${result.substring(0, 200)}...`,
        type: 'AGENT',
        metadata: JSON.stringify({ executionId: execution.id, taskId: task?.id })
      }
    })

    // Reset agent status
    await db.agent.update({
      where: { id: agent.id },
      data: { status: 'IDLE' }
    })

  } catch (error) {
    console.error('Error in agent execution:', error)
    
    const duration = Date.now() - new Date(execution.startedAt).getTime()

    // Update execution with error
    await db.execution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        completedAt: new Date()
      }
    })

    // Update task status if provided
    if (task) {
      await db.task.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      })
    }

    // Log error
    await db.executionLog.create({
      data: {
        executionId: execution.id,
        level: 'ERROR',
        message: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: JSON.stringify({ error: error instanceof Error ? error.stack : 'Unknown error' })
      }
    })

    // Create error message
    await db.message.create({
      data: {
        agentId: agent.id,
        content: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'AGENT',
        metadata: JSON.stringify({ executionId: execution.id, taskId: task?.id, error: true })
      }
    })

    // Reset agent status
    await db.agent.update({
      where: { id: agent.id },
      data: { status: 'ERROR' }
    })
  }
}