import { NextRequest, NextResponse } from 'next/server'
import { agentPerformanceTracker } from '@/lib/services/agent-performance'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const includeRankings = searchParams.get('rankings') === 'true'
    const period = searchParams.get('period') || 'daily'
    const limit = parseInt(searchParams.get('limit') || '30')

    // Get basic performance metrics
    const metrics = await agentPerformanceTracker.calculateAgentPerformance(params.id)

    const response: any = { metrics }

    // Include performance history if requested
    if (includeHistory) {
      response.history = await agentPerformanceTracker.getAgentPerformanceHistory(
        params.id, 
        period as any, 
        limit
      )
    }

    // Include rankings if requested
    if (includeRankings) {
      response.rankings = await agentPerformanceTracker.getAgentRankings(params.id)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching agent performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent performance' },
      { status: 500 }
    )
  }
}