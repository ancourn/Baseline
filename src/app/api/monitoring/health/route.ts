import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/services/performance-monitor'

export async function GET() {
  try {
    const healthStatus = performanceMonitor.getHealthStatus()

    // Determine HTTP status code based on health status
    let statusCode = 200
    if (healthStatus.status === 'ERROR') {
      statusCode = 503
    } else if (healthStatus.status === 'WARNING') {
      statusCode = 200 // Still healthy but with warnings
    }

    return NextResponse.json(healthStatus, { status: statusCode })
  } catch (error) {
    console.error('Error checking health status:', error)
    return NextResponse.json(
      { 
        status: 'ERROR',
        checks: {},
        timestamp: new Date(),
        error: 'Failed to check health status'
      },
      { status: 500 }
    )
  }
}