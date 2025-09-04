import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/services/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const unresolvedOnly = searchParams.get('unresolved') === 'true'

    const alerts = performanceMonitor.getAlerts(limit, unresolvedOnly)

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, action } = body

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, action' },
        { status: 400 }
      )
    }

    if (action === 'resolve') {
      const success = performanceMonitor.resolveAlert(alertId)
      if (success) {
        return NextResponse.json({ message: 'Alert resolved successfully' })
      } else {
        return NextResponse.json(
          { error: 'Alert not found or already resolved' },
          { status: 404 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: resolve' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}