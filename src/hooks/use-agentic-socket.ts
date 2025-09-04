"use client"

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SystemStatus {
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
    running: number
  }
  timestamp: Date
}

interface AgentUpdate {
  id: string
  name: string
  status: string
  progress?: number
  lastActivity: Date
}

interface TaskUpdate {
  id: string
  title: string
  status: string
  progress?: number
  assignedTo?: string
}

interface MessageUpdate {
  id: string
  agentId: string
  agentName: string
  content: string
  type: string
  timestamp: Date
}

interface ExecutionUpdate {
  id: string
  agentId: string
  taskId?: string
  status: string
  progress?: number
  duration?: number
  error?: string
}

export function useAgenticSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([])
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([])
  const [messages, setMessages] = useState<MessageUpdate[]>([])
  const [executionUpdates, setExecutionUpdates] = useState<ExecutionUpdate[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to Agentic AI System')
      setIsConnected(true)
      setError(null)
      
      // Join all rooms for real-time updates
      socket.emit('join-agents')
      socket.emit('join-tasks')
      socket.emit('join-messages')
      socket.emit('join-executions')
      
      // Request initial system status
      socket.emit('get-system-status')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from Agentic AI System')
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err)
      setError(`Connection error: ${err.message}`)
      setIsConnected(false)
    })

    // System status updates
    socket.on('system-status', (status: SystemStatus) => {
      setSystemStatus(status)
    })

    // Agent updates
    socket.on('agent-updated', (update: AgentUpdate) => {
      setAgentUpdates(prev => {
        // Remove previous updates for the same agent
        const filtered = prev.filter(u => u.id !== update.id)
        return [...filtered, update].slice(-10) // Keep last 10 updates
      })
    })

    // Task updates
    socket.on('task-updated', (update: TaskUpdate) => {
      setTaskUpdates(prev => {
        // Remove previous updates for the same task
        const filtered = prev.filter(u => u.id !== update.id)
        return [...filtered, update].slice(-10) // Keep last 10 updates
      })
    })

    // Message updates
    socket.on('message-received', (message: MessageUpdate) => {
      setMessages(prev => [...prev, message].slice(-50)) // Keep last 50 messages
    })

    // Execution updates
    socket.on('execution-updated', (update: ExecutionUpdate) => {
      setExecutionUpdates(prev => {
        // Remove previous updates for the same execution
        const filtered = prev.filter(u => u.id !== update.id)
        return [...filtered, update].slice(-10) // Keep last 10 updates
      })
    })

    // Error handling
    socket.on('error', (err: { message: string }) => {
      console.error('Socket error:', err)
      setError(err.message)
    })

    // Welcome message
    socket.on('connected', (data: { message: string; timestamp: string; socketId: string }) => {
      console.log('Welcome message:', data.message)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Functions to send updates to server
  const updateAgentStatus = (update: AgentUpdate) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('agent-status-update', update)
    }
  }

  const updateTaskStatus = (update: TaskUpdate) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('task-status-update', update)
    }
  }

  const sendMessage = (message: MessageUpdate) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('new-message', message)
    }
  }

  const updateExecution = (update: ExecutionUpdate) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('execution-update', update)
    }
  }

  const refreshSystemStatus = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-system-status')
    }
  }

  // Clear updates
  const clearAgentUpdates = () => setAgentUpdates([])
  const clearTaskUpdates = () => setTaskUpdates([])
  const clearMessages = () => setMessages([])
  const clearExecutionUpdates = () => setExecutionUpdates([])
  const clearError = () => setError(null)

  return {
    isConnected,
    systemStatus,
    agentUpdates,
    taskUpdates,
    messages,
    executionUpdates,
    error,
    updateAgentStatus,
    updateTaskStatus,
    sendMessage,
    updateExecution,
    refreshSystemStatus,
    clearAgentUpdates,
    clearTaskUpdates,
    clearMessages,
    clearExecutionUpdates,
    clearError
  }
}