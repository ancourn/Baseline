import { NextRequest, NextResponse } from 'next/server'
import { agentPerformanceTracker } from '@/lib/services/agent-performance'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const top = searchParams.get('top') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const metric = searchParams.get('metric') || 'performanceScore'

    if (top) {
      const topAgents = await agentPerformanceTracker.getTopPerformingAgents(
        limit, 
        metric as any
      )
      return NextResponse.json({ topAgents })
    }

    // Return all agents with their performance metrics
    const agents = await agentPerformanceTracker.getTopPerformingAgents(1000)
    return NextResponse.json({ agents })

  } catch (error) {
    console.error('Error fetching agents performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents performance' },
      { status: 500 }
    )
  }
}