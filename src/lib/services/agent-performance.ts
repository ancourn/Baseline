import { db } from '@/lib/db'

export interface AgentPerformanceMetrics {
  agentId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  averageExecutionTime: number
  totalExecutionTime: number
  lastExecution?: Date
  tasksCompleted: number
  averageTasksPerDay: number
  uptime: number
  errorRate: number
  performanceScore: number
  efficiency: number
  reliability: number
}

export interface AgentPerformanceHistory {
  id: string
  agentId: string
  timestamp: Date
  metrics: AgentPerformanceMetrics
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
}

class AgentPerformanceTracker {
  private cache = new Map<string, AgentPerformanceMetrics>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Start periodic performance calculation
    setInterval(() => {
      this.updateAllAgentsPerformance()
    }, 10 * 60 * 1000) // Update every 10 minutes
  }

  async calculateAgentPerformance(agentId: string): Promise<AgentPerformanceMetrics> {
    try {
      // Check cache first
      const cached = this.cache.get(agentId)
      if (cached && Date.now() - (cached as any).cachedAt < this.cacheTimeout) {
        return cached
      }

      // Get agent details
      const agent = await db.agent.findUnique({
        where: { id: agentId }
      })

      if (!agent) {
        throw new Error('Agent not found')
      }

      // Get execution statistics
      const executions = await db.execution.findMany({
        where: { agentId },
        orderBy: { startedAt: 'desc' }
      })

      const totalExecutions = executions.length
      const successfulExecutions = executions.filter(e => e.status === 'COMPLETED').length
      const failedExecutions = executions.filter(e => e.status === 'FAILED').length
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
      const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0

      // Calculate execution times
      const completedExecutions = executions.filter(e => e.status === 'COMPLETED' && e.duration)
      const totalExecutionTime = completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0)
      const averageExecutionTime = completedExecutions.length > 0 ? totalExecutionTime / completedExecutions.length : 0

      // Get task statistics
      const tasks = await db.task.findMany({
        where: { assignedToId: agentId }
      })

      const tasksCompleted = tasks.filter(t => t.status === 'COMPLETED').length
      const agentAge = Date.now() - new Date(agent.createdAt).getTime()
      const daysActive = Math.max(1, agentAge / (1000 * 60 * 60 * 24))
      const averageTasksPerDay = tasksCompleted / daysActive

      // Calculate uptime (percentage of time agent was not in ERROR status)
      const statusHistory = await this.getAgentStatusHistory(agentId)
      const uptime = this.calculateUptime(statusHistory)

      // Calculate performance scores
      const performanceScore = this.calculatePerformanceScore({
        successRate,
        averageExecutionTime,
        uptime,
        errorRate,
        tasksCompleted
      })

      const efficiency = this.calculateEfficiency(tasksCompleted, totalExecutionTime)
      const reliability = this.calculateReliability(successRate, uptime)

      const metrics: AgentPerformanceMetrics = {
        agentId,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate,
        averageExecutionTime,
        totalExecutionTime,
        lastExecution: executions[0]?.startedAt,
        tasksCompleted,
        averageTasksPerDay,
        uptime,
        errorRate,
        performanceScore,
        efficiency,
        reliability
      }

      // Cache the result
      this.cache.set(agentId, metrics)
      ;(metrics as any).cachedAt = Date.now()

      return metrics
    } catch (error) {
      console.error(`Error calculating performance for agent ${agentId}:`, error)
      throw error
    }
  }

  async updateAllAgentsPerformance() {
    try {
      const agents = await db.agent.findMany({
        select: { id: true }
      })

      for (const agent of agents) {
        try {
          const metrics = await this.calculateAgentPerformance(agent.id)
          
          // Update agent performance in database
          await db.agent.update({
            where: { id: agent.id },
            data: {
              performance: JSON.stringify(metrics)
            }
          })
        } catch (error) {
          console.error(`Error updating performance for agent ${agent.id}:`, error)
        }
      }

      console.log(`📊 Updated performance metrics for ${agents.length} agents`)
    } catch (error) {
      console.error('Error updating agent performances:', error)
    }
  }

  async getAgentPerformanceHistory(agentId: string, period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily', limit: number = 30): Promise<AgentPerformanceHistory[]> {
    try {
      // This would typically query a performance history table
      // For now, we'll generate synthetic history data
      const history: AgentPerformanceHistory[] = []
      const now = new Date()
      
      for (let i = 0; i < limit; i++) {
        const timestamp = new Date(now)
        
        switch (period) {
          case 'hourly':
            timestamp.setHours(timestamp.getHours() - i)
            break
          case 'daily':
            timestamp.setDate(timestamp.getDate() - i)
            break
          case 'weekly':
            timestamp.setDate(timestamp.getDate() - (i * 7))
            break
          case 'monthly':
            timestamp.setMonth(timestamp.getMonth() - i)
            break
        }

        const metrics = await this.calculateAgentPerformance(agentId)
        
        // Add some variation to simulate historical data
        const variation = 0.9 + (Math.random() * 0.2) // ±10% variation
        
        history.push({
          id: `history_${agentId}_${i}`,
          agentId,
          timestamp,
          metrics: {
            ...metrics,
            successRate: Math.min(100, Math.max(0, metrics.successRate * variation)),
            averageExecutionTime: metrics.averageExecutionTime * variation,
            performanceScore: Math.min(100, Math.max(0, metrics.performanceScore * variation))
          },
          period
        })
      }

      return history.reverse()
    } catch (error) {
      console.error(`Error getting performance history for agent ${agentId}:`, error)
      throw error
    }
  }

  async getTopPerformingAgents(limit: number = 10, metric: 'performanceScore' | 'efficiency' | 'reliability' | 'tasksCompleted' = 'performanceScore'): Promise<{ agent: any; metrics: AgentPerformanceMetrics }[]> {
    try {
      const agents = await db.agent.findMany({
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 100
          },
          tasks: {
            where: { status: 'COMPLETED' }
          }
        }
      })

      const agentPerformances = await Promise.all(
        agents.map(async (agent) => {
          const metrics = await this.calculateAgentPerformance(agent.id)
          return { agent, metrics }
        })
      )

      return agentPerformances
        .sort((a, b) => b.metrics[metric] - a.metrics[metric])
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting top performing agents:', error)
      throw error
    }
  }

  async getAgentRankings(agentId: string): Promise<{
    overall: number
    byType: number
    byModel: number
    totalAgents: number
  }> {
    try {
      const agent = await db.agent.findUnique({
        where: { id: agentId }
      })

      if (!agent) {
        throw new Error('Agent not found')
      }

      const allAgents = await db.agent.findMany()
      const agentMetrics = await this.calculateAgentPerformance(agentId)
      
      // Calculate rankings
      const allMetrics = await Promise.all(
        allAgents.map(a => this.calculateAgentPerformance(a.id))
      )

      const overallRank = allMetrics
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .findIndex(m => m.agentId === agentId) + 1

      const sameTypeAgents = allAgents.filter(a => a.type === agent.type)
      const sameTypeMetrics = await Promise.all(
        sameTypeAgents.map(a => this.calculateAgentPerformance(a.id))
      )
      const typeRank = sameTypeMetrics
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .findIndex(m => m.agentId === agentId) + 1

      const sameModelAgents = allAgents.filter(a => a.model === agent.model)
      const sameModelMetrics = await Promise.all(
        sameModelAgents.map(a => this.calculateAgentPerformance(a.id))
      )
      const modelRank = sameModelMetrics
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .findIndex(m => m.agentId === agentId) + 1

      return {
        overall: overallRank,
        byType: typeRank,
        byModel: modelRank,
        totalAgents: allAgents.length
      }
    } catch (error) {
      console.error(`Error getting rankings for agent ${agentId}:`, error)
      throw error
    }
  }

  private async getAgentStatusHistory(agentId: string): Promise<{ status: string; timestamp: Date }[]> {
    // This would typically query a status history table
    // For now, we'll return synthetic data
    return [
      { status: 'IDLE', timestamp: new Date(Date.now() - 3600000) },
      { status: 'RUNNING', timestamp: new Date(Date.now() - 1800000) },
      { status: 'COMPLETED', timestamp: new Date(Date.now() - 900000) },
      { status: 'IDLE', timestamp: new Date() }
    ]
  }

  private calculateUptime(statusHistory: { status: string; timestamp: Date }[]): number {
    if (statusHistory.length < 2) return 100

    let totalTime = 0
    let errorTime = 0

    for (let i = 1; i < statusHistory.length; i++) {
      const prev = statusHistory[i - 1]
      const curr = statusHistory[i]
      const duration = curr.timestamp.getTime() - prev.timestamp.getTime()
      totalTime += duration

      if (prev.status === 'ERROR') {
        errorTime += duration
      }
    }

    return totalTime > 0 ? ((totalTime - errorTime) / totalTime) * 100 : 100
  }

  private calculatePerformanceScore(data: {
    successRate: number
    averageExecutionTime: number
    uptime: number
    errorRate: number
    tasksCompleted: number
  }): number {
    // Weighted calculation of performance score
    const successRateWeight = 0.3
    const executionTimeWeight = 0.2
    const uptimeWeight = 0.25
    const errorRateWeight = 0.15
    const tasksWeight = 0.1

    // Normalize metrics to 0-100 scale
    const normalizedSuccessRate = data.successRate
    const normalizedExecutionTime = Math.max(0, 100 - (data.averageExecutionTime / 100)) // Assume 100ms is ideal
    const normalizedUptime = data.uptime
    const normalizedErrorRate = Math.max(0, 100 - data.errorRate)
    const normalizedTasks = Math.min(100, data.tasksCompleted * 2) // 2 points per task

    const score =
      (normalizedSuccessRate * successRateWeight) +
      (normalizedExecutionTime * executionTimeWeight) +
      (normalizedUptime * uptimeWeight) +
      (normalizedErrorRate * errorRateWeight) +
      (normalizedTasks * tasksWeight)

    return Math.min(100, Math.max(0, score))
  }

  private calculateEfficiency(tasksCompleted: number, totalExecutionTime: number): number {
    if (totalExecutionTime === 0) return 0
    const tasksPerMinute = (tasksCompleted / totalExecutionTime) * 60000
    return Math.min(100, tasksPerMinute * 10) // Scale to 0-100
  }

  private calculateReliability(successRate: number, uptime: number): number {
    return (successRate + uptime) / 2
  }
}

// Export singleton instance
export const agentPerformanceTracker = new AgentPerformanceTracker()

// Export for testing and module access
export { AgentPerformanceTracker }