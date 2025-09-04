export interface SystemMetrics {
  timestamp: Date
  cpu: {
    usage: number
    cores: number
  }
  memory: {
    total: number
    used: number
    free: number
    usage: number
  }
  disk: {
    total: number
    used: number
    free: number
    usage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
  }
  processes: {
    total: number
    running: number
  }
  uptime: number
}

export interface ApplicationMetrics {
  timestamp: Date
  agents: {
    total: number
    running: number
    idle: number
    error: number
  }
  tasks: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
  }
  executions: {
    total: number
    running: number
    completed: number
    failed: number
    averageDuration: number
  }
  messages: {
    total: number
    lastHour: number
  }
  websocket: {
    connected: number
    messages: number
  }
}

export interface PerformanceAlert {
  id: string
  type: 'WARNING' | 'ERROR' | 'INFO'
  category: 'SYSTEM' | 'APPLICATION' | 'SECURITY'
  message: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: SystemMetrics[] = []
  private appMetrics: ApplicationMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private thresholds = {
    cpu: 80, // CPU usage percentage
    memory: 85, // Memory usage percentage
    disk: 90, // Disk usage percentage
    errorRate: 10, // Error rate percentage
    responseTime: 5000, // Response time in ms
    failedTasks: 20 // Failed tasks percentage
  }
  private isRunning: boolean = false

  constructor() {
    this.start()
  }

  start() {
    if (this.isRunning) return
    
    console.log('📊 Performance Monitor started')
    this.isRunning = true
    
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)
    
    // Collect application metrics every minute
    setInterval(() => {
      this.collectApplicationMetrics()
    }, 60000)
    
    // Check for alerts every 5 minutes
    setInterval(() => {
      this.checkAlerts()
    }, 300000)
    
    // Initial collection
    this.collectSystemMetrics()
    this.collectApplicationMetrics()
  }

  stop() {
    console.log('📊 Performance Monitor stopped')
    this.isRunning = false
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Simulate system metrics collection
      // In a real implementation, you would use system information libraries
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: Math.random() * 100,
          cores: 4
        },
        memory: {
          total: 16 * 1024 * 1024 * 1024, // 16GB
          used: Math.random() * 16 * 1024 * 1024 * 1024,
          free: Math.random() * 16 * 1024 * 1024 * 1024,
          usage: Math.random() * 100
        },
        disk: {
          total: 500 * 1024 * 1024 * 1024, // 500GB
          used: Math.random() * 500 * 1024 * 1024 * 1024,
          free: Math.random() * 500 * 1024 * 1024 * 1024,
          usage: Math.random() * 100
        },
        network: {
          bytesIn: Math.random() * 1000000,
          bytesOut: Math.random() * 1000000,
          packetsIn: Math.random() * 10000,
          packetsOut: Math.random() * 10000
        },
        processes: {
          total: Math.floor(Math.random() * 200) + 50,
          running: Math.floor(Math.random() * 50) + 10
        },
        uptime: process.uptime() * 1000
      }

      // Keep only last 1000 metrics
      this.metrics.push(metrics)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }

      return metrics
    } catch (error) {
      console.error('Error collecting system metrics:', error)
      throw error
    }
  }

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    try {
      // In a real implementation, you would query your database for actual metrics
      const metrics: ApplicationMetrics = {
        timestamp: new Date(),
        agents: {
          total: Math.floor(Math.random() * 20) + 5,
          running: Math.floor(Math.random() * 10),
          idle: Math.floor(Math.random() * 10),
          error: Math.floor(Math.random() * 5)
        },
        tasks: {
          total: Math.floor(Math.random() * 100) + 20,
          pending: Math.floor(Math.random() * 30),
          running: Math.floor(Math.random() * 10),
          completed: Math.floor(Math.random() * 60),
          failed: Math.floor(Math.random() * 10)
        },
        executions: {
          total: Math.floor(Math.random() * 500) + 100,
          running: Math.floor(Math.random() * 20),
          completed: Math.floor(Math.random() * 400),
          failed: Math.floor(Math.random() * 50),
          averageDuration: Math.floor(Math.random() * 10000) + 1000
        },
        messages: {
          total: Math.floor(Math.random() * 1000) + 100,
          lastHour: Math.floor(Math.random() * 100)
        },
        websocket: {
          connected: Math.floor(Math.random() * 50),
          messages: Math.floor(Math.random() * 1000)
        }
      }

      // Keep only last 1000 metrics
      this.appMetrics.push(metrics)
      if (this.appMetrics.length > 1000) {
        this.appMetrics = this.appMetrics.slice(-1000)
      }

      return metrics
    } catch (error) {
      console.error('Error collecting application metrics:', error)
      throw error
    }
  }

  private async checkAlerts() {
    try {
      const latestMetrics = this.appMetrics[this.appMetrics.length - 1]
      const latestSystemMetrics = this.metrics[this.metrics.length - 1]

      if (!latestMetrics || !latestSystemMetrics) return

      // Check CPU usage
      if (latestSystemMetrics.cpu.usage > this.thresholds.cpu) {
        this.createAlert({
          type: 'WARNING',
          category: 'SYSTEM',
          message: `High CPU usage: ${latestSystemMetrics.cpu.usage.toFixed(1)}%`,
          metadata: { cpu: latestSystemMetrics.cpu.usage }
        })
      }

      // Check memory usage
      if (latestSystemMetrics.memory.usage > this.thresholds.memory) {
        this.createAlert({
          type: 'WARNING',
          category: 'SYSTEM',
          message: `High memory usage: ${latestSystemMetrics.memory.usage.toFixed(1)}%`,
          metadata: { memory: latestSystemMetrics.memory.usage }
        })
      }

      // Check disk usage
      if (latestSystemMetrics.disk.usage > this.thresholds.disk) {
        this.createAlert({
          type: 'ERROR',
          category: 'SYSTEM',
          message: `High disk usage: ${latestSystemMetrics.disk.usage.toFixed(1)}%`,
          metadata: { disk: latestSystemMetrics.disk.usage }
        })
      }

      // Check task error rate
      const errorRate = (latestMetrics.tasks.failed / latestMetrics.tasks.total) * 100
      if (errorRate > this.thresholds.errorRate) {
        this.createAlert({
          type: 'WARNING',
          category: 'APPLICATION',
          message: `High task error rate: ${errorRate.toFixed(1)}%`,
          metadata: { errorRate, failed: latestMetrics.tasks.failed, total: latestMetrics.tasks.total }
        })
      }

      // Check execution failure rate
      const executionErrorRate = (latestMetrics.executions.failed / latestMetrics.executions.total) * 100
      if (executionErrorRate > this.thresholds.errorRate) {
        this.createAlert({
          type: 'WARNING',
          category: 'APPLICATION',
          message: `High execution failure rate: ${executionErrorRate.toFixed(1)}%`,
          metadata: { errorRate: executionErrorRate, failed: latestMetrics.executions.failed, total: latestMetrics.executions.total }
        })
      }

      // Check average response time
      if (latestMetrics.executions.averageDuration > this.thresholds.responseTime) {
        this.createAlert({
          type: 'WARNING',
          category: 'APPLICATION',
          message: `High average execution time: ${latestMetrics.executions.averageDuration}ms`,
          metadata: { averageDuration: latestMetrics.executions.averageDuration }
        })
      }

    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>) {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    }

    this.alerts.push(alert)
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }

    console.log(`🚨 Alert created: [${alert.type}] ${alert.message}`)
  }

  // Public methods to retrieve metrics and alerts
  getSystemMetrics(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit)
  }

  getApplicationMetrics(limit: number = 100): ApplicationMetrics[] {
    return this.appMetrics.slice(-limit)
  }

  getAlerts(limit: number = 100, unresolvedOnly: boolean = false): PerformanceAlert[] {
    let alerts = this.alerts.slice(-limit)
    if (unresolvedOnly) {
      alerts = alerts.filter(alert => !alert.resolved)
    }
    return alerts
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      console.log(`✅ Alert resolved: ${alert.message}`)
      return true
    }
    return false
  }

  getCurrentMetrics(): { system: SystemMetrics | null; application: ApplicationMetrics | null } {
    return {
      system: this.metrics[this.metrics.length - 1] || null,
      application: this.appMetrics[this.appMetrics.length - 1] || null
    }
  }

  getHealthStatus(): {
    status: 'HEALTHY' | 'WARNING' | 'ERROR'
    checks: Record<string, { status: 'PASS' | 'FAIL' | 'WARN'; message?: string }>
    timestamp: Date
  } {
    const currentSystem = this.metrics[this.metrics.length - 1]
    const currentApp = this.appMetrics[this.appMetrics.length - 1]

    const checks: Record<string, { status: 'PASS' | 'FAIL' | 'WARN'; message?: string }> = {}

    // System checks
    if (currentSystem) {
      checks.cpu = {
        status: currentSystem.cpu.usage > this.thresholds.cpu ? 'WARN' : 'PASS',
        message: currentSystem.cpu.usage > this.thresholds.cpu ? `CPU usage high: ${currentSystem.cpu.usage.toFixed(1)}%` : undefined
      }

      checks.memory = {
        status: currentSystem.memory.usage > this.thresholds.memory ? 'WARN' : 'PASS',
        message: currentSystem.memory.usage > this.thresholds.memory ? `Memory usage high: ${currentSystem.memory.usage.toFixed(1)}%` : undefined
      }

      checks.disk = {
        status: currentSystem.disk.usage > this.thresholds.disk ? 'FAIL' : 'PASS',
        message: currentSystem.disk.usage > this.thresholds.disk ? `Disk usage critical: ${currentSystem.disk.usage.toFixed(1)}%` : undefined
      }
    }

    // Application checks
    if (currentApp) {
      const errorRate = (currentApp.tasks.failed / currentApp.tasks.total) * 100
      checks.taskErrorRate = {
        status: errorRate > this.thresholds.errorRate ? 'WARN' : 'PASS',
        message: errorRate > this.thresholds.errorRate ? `Task error rate high: ${errorRate.toFixed(1)}%` : undefined
      }

      checks.executionTime = {
        status: currentApp.executions.averageDuration > this.thresholds.responseTime ? 'WARN' : 'PASS',
        message: currentApp.executions.averageDuration > this.thresholds.responseTime ? `Execution time high: ${currentApp.executions.averageDuration}ms` : undefined
      }
    }

    // Determine overall status
    let status: 'HEALTHY' | 'WARNING' | 'ERROR' = 'HEALTHY'
    Object.values(checks).forEach(check => {
      if (check.status === 'FAIL') status = 'ERROR'
      else if (check.status === 'WARN' && status !== 'ERROR') status = 'WARNING'
    })

    return {
      status,
      checks,
      timestamp: new Date()
    }
  }

  updateThresholds(newThresholds: Partial<typeof this.thresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds }
    console.log('📊 Performance thresholds updated:', this.thresholds)
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export for testing and module access
export { PerformanceMonitor }