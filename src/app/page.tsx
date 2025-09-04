"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAgenticSocket } from "@/hooks/use-agentic-socket"
import { 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  MessageSquare, 
  Brain, 
  Network, 
  Activity,
  Zap,
  Target,
  Users,
  BarChart3,
  Code,
  FileText,
  Search,
  Database,
  Cloud,
  Shield,
  Globe,
  Wifi,
  WifiOff,
  AlertCircle
} from "lucide-react"

interface Agent {
  id: string
  name: string
  type: string
  status: "IDLE" | "RUNNING" | "PAUSED" | "ERROR" | "STOPPED"
  capabilities: string[]
  model: string
  description: string
  progress?: number
  createdAt: Date
  updatedAt: Date
}

interface Task {
  id: string
  title: string
  description: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED"
  assignedTo?: Agent
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  progress?: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

interface Message {
  id: string
  agentId: string
  agent: Agent
  content: string
  timestamp: Date
  type: "SYSTEM" | "AGENT" | "USER"
}

export default function AgenticAIDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newTask, setNewTask] = useState("")
  const [newAgentName, setNewAgentName] = useState("")
  const [newAgentType, setNewAgentType] = useState("")
  const [newAgentDescription, setNewAgentDescription] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const socket = useAgenticSocket()

  // Fetch initial data
  useEffect(() => {
    fetchAgents()
    fetchTasks()
    fetchMessages()
  }, [])

  // Handle real-time updates
  useEffect(() => {
    if (socket.agentUpdates.length > 0) {
      const latestUpdate = socket.agentUpdates[socket.agentUpdates.length - 1]
      setAgents(prev => prev.map(agent => 
        agent.id === latestUpdate.id 
          ? { ...agent, status: latestUpdate.status as any, progress: latestUpdate.progress }
          : agent
      ))
    }
  }, [socket.agentUpdates])

  useEffect(() => {
    if (socket.taskUpdates.length > 0) {
      const latestUpdate = socket.taskUpdates[socket.taskUpdates.length - 1]
      setTasks(prev => prev.map(task => 
        task.id === latestUpdate.id 
          ? { ...task, status: latestUpdate.status as any, progress: latestUpdate.progress }
          : task
      ))
    }
  }, [socket.taskUpdates])

  useEffect(() => {
    if (socket.messages.length > 0) {
      const latestMessage = socket.messages[socket.messages.length - 1]
      setMessages(prev => [...prev, {
        id: latestMessage.id,
        agentId: latestMessage.agentId,
        agent: { id: latestMessage.agentId, name: latestMessage.agentName, type: '', status: 'IDLE' as any, capabilities: [], model: '', description: '', createdAt: new Date(), updatedAt: new Date() },
        content: latestMessage.content,
        timestamp: latestMessage.timestamp,
        type: latestMessage.type as any
      }])
    }
  }, [socket.messages])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive"
      })
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive"
      })
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive"
      })
    }
  }

  const createNewAgent = async () => {
    if (!newAgentName || !newAgentType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgentName,
          type: newAgentType,
          description: newAgentDescription,
          capabilities: ["Learning", "Adapting"],
          model: "Local LLaMA 3"
        })
      })

      if (response.ok) {
        await fetchAgents()
        setNewAgentName("")
        setNewAgentType("")
        setNewAgentDescription("")
        toast({
          title: "Success",
          description: "Agent created successfully"
        })
      } else {
        throw new Error("Failed to create agent")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createNewTask = async () => {
    if (!newTask.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask,
          description: "New task created",
          priority: "MEDIUM"
        })
      })

      if (response.ok) {
        await fetchTasks()
        setNewTask("")
        toast({
          title: "Success",
          description: "Task created successfully"
        })
      } else {
        throw new Error("Failed to create task")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const executeAgent = async (agentId: string, taskId?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          taskId,
          input: { timestamp: new Date().toISOString() }
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Agent execution started"
        })
      } else {
        throw new Error("Failed to start execution")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start agent execution",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agents[0]?.id || "system",
          content: newMessage,
          type: "USER"
        })
      })

      if (response.ok) {
        setNewMessage("")
        await fetchMessages()
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING": return "bg-green-500"
      case "IDLE": return "bg-gray-500"
      case "PAUSED": return "bg-yellow-500"
      case "ERROR": return "bg-red-500"
      case "COMPLETED": return "bg-green-600"
      case "FAILED": return "bg-red-600"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
      case "URGENT": return "bg-red-500"
      case "MEDIUM": return "bg-yellow-500"
      case "LOW": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Agentic AI System
          </h1>
          <p className="text-lg text-muted-foreground flex items-center justify-center gap-2">
            Multi-agent system powered by open-source AI models
            {socket.isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {socket.systemStatus?.agents.running || agents.filter(a => a.status === "RUNNING").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {socket.systemStatus?.agents.total || agents.length} total agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {socket.systemStatus?.tasks.running || tasks.filter(t => t.status === "RUNNING").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {socket.systemStatus?.tasks.total || tasks.length} total tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {socket.systemStatus ? 
                  Math.round((socket.systemStatus.tasks.completed / socket.systemStatus.tasks.total) * 100) || 0 : 
                  Math.round((tasks.filter(t => t.status === "COMPLETED").length / tasks.length) * 100) || 0
                }%
              </div>
              <p className="text-xs text-muted-foreground">
                Success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Load</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {socket.systemStatus?.executions.running || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active executions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {socket.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Connection Error:</span>
                <span>{socket.error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">AI Agents</h2>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    {agents.length} Active
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={`/api/placeholder/40/40`} />
                              <AvatarFallback>
                                <Bot className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              <CardDescription>{agent.type}</CardDescription>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Model:</span>
                            <Badge variant="secondary">{agent.model}</Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Capabilities:</span>
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(agent.capabilities || '[]').map((cap: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {agent.progress !== undefined && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span>{agent.progress}%</span>
                              </div>
                              <Progress value={agent.progress} className="h-2" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => executeAgent(agent.id)}
                            disabled={loading || agent.status === "RUNNING"}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Execute
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Create New Agent */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Agent
                    </CardTitle>
                    <CardDescription>
                      Add a new AI agent to the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Agent Name *</label>
                      <Input
                        placeholder="e.g., Data Analyst"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Agent Type *</label>
                      <Input
                        placeholder="e.g., Analytics Specialist"
                        value={newAgentType}
                        onChange={(e) => setNewAgentType(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe the agent's purpose..."
                        value={newAgentDescription}
                        onChange={(e) => setNewAgentDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <Button onClick={createNewAgent} disabled={loading} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Agent
                    </Button>
                  </CardContent>
                </Card>

                {/* System Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Architecture:</span>
                      <Badge variant="outline">Multi-Agent</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>AI Models:</span>
                      <Badge variant="outline">Open Source</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Cost:</span>
                      <Badge variant="outline">Free</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Privacy:</span>
                      <Badge variant="outline">Local</Badge>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      Powered by local LLMs including LLaMA 3, Mistral, and Code Llama
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Task Queue</h2>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    {tasks.length} Tasks
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Assigned to:</span>
                          <div className="flex gap-1">
                            {task.assignedTo ? (
                              <Badge variant="secondary" className="text-xs">
                                {task.assignedTo.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {task.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => task.assignedTo && executeAgent(task.assignedTo.id, task.id)}
                            disabled={loading || task.status === "RUNNING"}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Execute
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Create New Task */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Task
                    </CardTitle>
                    <CardDescription>
                      Add a new task to the queue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Task Title *</label>
                      <Input
                        placeholder="Enter task title..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                      />
                    </div>
                    
                    <Button onClick={createNewTask} disabled={loading} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </CardContent>
                </Card>

                {/* Task Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Task Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium">
                        {socket.systemStatus?.tasks.completed || tasks.filter(t => t.status === "COMPLETED").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Running:</span>
                      <span className="font-medium">
                        {socket.systemStatus?.tasks.running || tasks.filter(t => t.status === "RUNNING").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Pending:</span>
                      <span className="font-medium">
                        {socket.systemStatus?.tasks.pending || tasks.filter(t => t.status === "PENDING").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Failed:</span>
                      <span className="font-medium">
                        {socket.systemStatus?.tasks.failed || tasks.filter(t => t.status === "FAILED").length}
                      </span>
                    </div>
                    <Separator />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {socket.systemStatus ? 
                          Math.round((socket.systemStatus.tasks.completed / socket.systemStatus.tasks.total) * 100) || 0 : 
                          Math.round((tasks.filter(t => t.status === "COMPLETED").length / tasks.length) * 100) || 0
                        }%
                      </div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Communication Feed */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Agent Communication</h2>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Network className="h-3 w-3" />
                    {socket.isConnected ? "Live" : "Offline"}
                  </Badge>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-96 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div key={message.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback>
                                {message.type === "SYSTEM" ? (
                                  <Shield className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{message.agent.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {message.type}
                                </Badge>
                              </div>
                              <div className="text-sm bg-muted p-3 rounded-lg">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                {/* Message Input */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Send message to agents..." 
                        className="flex-1"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Communication Controls */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Communication Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Real-time Updates</span>
                      <Badge variant={socket.isConnected ? "default" : "secondary"}>
                        {socket.isConnected ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Agent Collaboration</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Message Logging</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <Separator />
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setMessages([])}>
                      Clear History
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Connections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Active Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {agents.filter(a => a.status === "RUNNING").map((agent) => (
                      <div key={agent.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>{agent.name}</span>
                      </div>
                    ))}
                    {agents.filter(a => a.status === "RUNNING").length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No active connections
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks Processed</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{socket.systemStatus?.tasks.total || tasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {socket.systemStatus?.agents.running || agents.filter(a => a.status === "RUNNING").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {socket.systemStatus ? 
                      Math.round((socket.systemStatus.tasks.completed / socket.systemStatus.tasks.total) * 100) || 0 : 
                      Math.round((tasks.filter(t => t.status === "COMPLETED").length / tasks.length) * 100) || 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Task completion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">100%</div>
                  <p className="text-xs text-muted-foreground">
                    {socket.isConnected ? "Connected" : "Disconnected"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                  <CardDescription>Individual agent metrics and efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{agent.name}</span>
                          <Badge variant="outline">{agent.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Model</span>
                          <span>{agent.model}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Type</span>
                          <span>{agent.type}</span>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Real-time system metrics and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Connection Status</span>
                        <Badge variant={socket.isConnected ? "default" : "destructive"}>
                          {socket.isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Active Agents</span>
                        <span>{socket.systemStatus?.agents.running || 0}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Running Tasks</span>
                        <span>{socket.systemStatus?.tasks.running || 0}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Executions</span>
                        <span>{socket.systemStatus?.executions.running || 0}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Update:</span>
                      <span>
                        {socket.systemStatus?.timestamp ? 
                          new Date(socket.systemStatus.timestamp).toLocaleTimeString() : 
                          "Never"
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>System Status:</span>
                      <span className="text-green-600">Operational</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}