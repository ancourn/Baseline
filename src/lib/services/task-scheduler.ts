import cron from 'node-cron'
import { db } from '@/lib/db'

export interface ScheduledTask {
  id: string
  title: string
  description: string
  schedule: string
  agentId?: string
  priority: string
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
}

class TaskScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map()
  private isRunning: boolean = false

  constructor() {
    this.start()
  }

  start() {
    if (this.isRunning) return
    
    console.log('🕐 Task Scheduler started')
    this.isRunning = true
    
    // Schedule the main checker to run every minute
    cron.schedule('* * * * *', () => {
      this.checkAndExecuteScheduledTasks()
    })
    
    // Load existing scheduled tasks from database
    this.loadScheduledTasks()
  }

  stop() {
    console.log('⏹️ Task Scheduler stopped')
    this.isRunning = false
    
    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job) => {
      job.stop()
    })
    this.scheduledJobs.clear()
  }

  async loadScheduledTasks() {
    try {
      const scheduledTasks = await db.task.findMany({
        where: {
          schedule: {
            not: null
          },
          isRecurring: true,
          status: 'PENDING'
        }
      })

      for (const task of scheduledTasks) {
        if (task.schedule) {
          this.scheduleTask(task.id, task.schedule)
        }
      }

      console.log(`📅 Loaded ${scheduledTasks.length} scheduled tasks`)
    } catch (error) {
      console.error('Error loading scheduled tasks:', error)
    }
  }

  scheduleTask(taskId: string, schedule: string): boolean {
    try {
      // Validate cron expression
      if (!cron.validate(schedule)) {
        console.error(`Invalid cron expression for task ${taskId}: ${schedule}`)
        return false
      }

      // Remove existing job if it exists
      if (this.scheduledJobs.has(taskId)) {
        this.scheduledJobs.get(taskId)?.stop()
        this.scheduledJobs.delete(taskId)
      }

      // Create new scheduled job
      const job = cron.schedule(schedule, async () => {
        await this.executeScheduledTask(taskId)
      }, {
        scheduled: false // Don't start immediately, we'll control it
      })

      this.scheduledJobs.set(taskId, job)
      job.start()

      console.log(`📅 Scheduled task ${taskId} with cron: ${schedule}`)
      return true
    } catch (error) {
      console.error(`Error scheduling task ${taskId}:`, error)
      return false
    }
  }

  unscheduleTask(taskId: string): boolean {
    try {
      const job = this.scheduledJobs.get(taskId)
      if (job) {
        job.stop()
        this.scheduledJobs.delete(taskId)
        console.log(`📅 Unscheduled task ${taskId}`)
        return true
      }
      return false
    } catch (error) {
      console.error(`Error unscheduling task ${taskId}:`, error)
      return false
    }
  }

  async checkAndExecuteScheduledTasks() {
    try {
      const now = new Date()
      
      // Find tasks that are scheduled to run now
      const tasksToExecute = await db.task.findMany({
        where: {
          scheduledFor: {
            lte: now
          },
          status: 'PENDING'
        }
      })

      for (const task of tasksToExecute) {
        await this.executeScheduledTask(task.id)
      }
    } catch (error) {
      console.error('Error checking scheduled tasks:', error)
    }
  }

  async executeScheduledTask(taskId: string) {
    try {
      // Get the task details
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          assignedTo: true
        }
      })

      if (!task || task.status !== 'PENDING') {
        return
      }

      console.log(`🚀 Executing scheduled task: ${task.title}`)

      // If task has an assigned agent, execute it
      if (task.assignedTo) {
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
          where: { id: taskId },
          data: { 
            status: 'RUNNING',
            lastRun: new Date()
          }
        })

        // Execute the agent logic (this would be similar to the existing execute endpoint)
        await this.executeAgentLogic(task.assignedTo, task, execution)

        // If it's a recurring task, calculate next run time
        if (task.isRecurring && task.schedule) {
          const nextRun = this.calculateNextRun(task.schedule)
          await db.task.update({
            where: { id: taskId },
            data: { 
              scheduledFor: nextRun,
              status: 'PENDING'
            }
          })
        }
      } else {
        console.log(`⚠️ Task ${task.title} has no assigned agent`)
      }
    } catch (error) {
      console.error(`Error executing scheduled task ${taskId}:`, error)
      
      // Update task status to failed
      await db.task.update({
        where: { id: taskId },
        data: { 
          status: 'FAILED',
          lastRun: new Date()
        }
      })
    }
  }

  async executeAgentLogic(agent: any, task: any, execution: any) {
    try {
      const startTime = Date.now()
      
      // Import ZAI SDK dynamically to avoid issues
      const ZAI = await import('z-ai-web-dev-sdk')
      const zai = await ZAI.create()

      // Prepare the prompt
      let prompt = `You are ${agent.name}, a ${agent.type}. `
      
      if (task) {
        prompt += `Your task is: ${task.title}. ${task.description}. `
      }
      
      prompt += `Use your capabilities to accomplish this task effectively.`

      if (task.input) {
        prompt += `\n\nInput data: ${task.input}`
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

      // Update task status
      await db.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          output: JSON.stringify({ result, timestamp: new Date().toISOString() }),
          completedAt: new Date()
        }
      })

      console.log(`✅ Task ${task.title} completed successfully`)

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

      // Update task status
      await db.task.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      })
    }
  }

  calculateNextRun(cronExpression: string): Date {
    try {
      // This is a simplified next run calculation
      // In a production environment, you might want to use a more robust cron parser
      const now = new Date()
      
      // For common intervals, calculate next run time
      if (cronExpression === '0 * * * *') { // Every hour
        const next = new Date(now)
        next.setHours(next.getHours() + 1)
        next.setMinutes(0)
        next.setSeconds(0)
        return next
      } else if (cronExpression === '0 0 * * *') { // Every day at midnight
        const next = new Date(now)
        next.setDate(next.getDate() + 1)
        next.setHours(0)
        next.setMinutes(0)
        next.setSeconds(0)
        return next
      } else if (cronExpression === '0 9 * * 1') { // Every Monday at 9 AM
        const next = new Date(now)
        next.setDate(next.getDate() + (1 + 7 - next.getDay()) % 7)
        next.setHours(9)
        next.setMinutes(0)
        next.setSeconds(0)
        return next
      }
      
      // Default: add 1 hour
      const next = new Date(now)
      next.setHours(next.getHours() + 1)
      return next
    } catch (error) {
      console.error('Error calculating next run time:', error)
      // Default to 1 hour from now
      const next = new Date()
      next.setHours(next.getHours() + 1)
      return next
    }
  }

  getScheduledTasks(): ScheduledTask[] {
    const tasks: ScheduledTask[] = []
    
    this.scheduledJobs.forEach((job, taskId) => {
      tasks.push({
        id: taskId,
        title: `Task ${taskId}`,
        description: 'Scheduled task',
        schedule: 'cron-expression', // This would be stored with the job
        priority: 'MEDIUM',
        isActive: true
      })
    })
    
    return tasks
  }

  getJobStatus(taskId: string): { isScheduled: boolean; isActive: boolean } {
    const job = this.scheduledJobs.get(taskId)
    return {
      isScheduled: !!job,
      isActive: job ? !job.running : false
    }
  }
}

// Export singleton instance
export const taskScheduler = new TaskScheduler()

// Export for testing and module access
export { TaskScheduler }