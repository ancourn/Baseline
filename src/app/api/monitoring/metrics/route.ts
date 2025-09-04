import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/services/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')

    let response: any = {}

    switch (type) {
      case 'system':
        response.system = performanceMonitor.getSystemMetrics(limit)
        break
      case 'application':
        response.application = performanceMonitor.getApplicationMetrics(limit)
        break
      case 'current':
        response.current = performanceMonitor.getCurrentMetrics()
        break
      default:
        response = {
          system: performanceMonitor.getSystemMetrics(limit),
          application: performanceMonitor.getApplicationMetrics(limit),
          current: performanceMonitor.getCurrentMetrics()
        }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}