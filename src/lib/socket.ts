import { Server } from 'socket.io';
import { db } from './db';

export interface AgentUpdate {
  id: string;
  name: string;
  status: string;
  progress?: number;
  lastActivity: Date;
}

export interface TaskUpdate {
  id: string;
  title: string;
  status: string;
  progress?: number;
  assignedTo?: string;
}

export interface MessageUpdate {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  type: string;
  timestamp: Date;
}

export interface ExecutionUpdate {
  id: string;
  agentId: string;
  taskId?: string;
  status: string;
  progress?: number;
  duration?: number;
  error?: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join rooms for real-time updates
    socket.on('join-agents', () => {
      socket.join('agents');
      console.log(`Client ${socket.id} joined agents room`);
    });

    socket.on('join-tasks', () => {
      socket.join('tasks');
      console.log(`Client ${socket.id} joined tasks room`);
    });

    socket.on('join-messages', () => {
      socket.join('messages');
      console.log(`Client ${socket.id} joined messages room`);
    });

    socket.on('join-executions', () => {
      socket.join('executions');
      console.log(`Client ${socket.id} joined executions room`);
    });

    // Handle agent status updates
    socket.on('agent-status-update', async (data: AgentUpdate) => {
      try {
        // Update database
        await db.agent.update({
          where: { id: data.id },
          data: { 
            status: data.status as any,
            updatedAt: new Date()
          }
        });

        // Broadcast to all clients in agents room
        io.to('agents').emit('agent-updated', data);
        console.log(`Agent ${data.name} status updated to ${data.status}`);
      } catch (error) {
        console.error('Error updating agent status:', error);
        socket.emit('error', { message: 'Failed to update agent status' });
      }
    });

    // Handle task status updates
    socket.on('task-status-update', async (data: TaskUpdate) => {
      try {
        // Update database
        await db.task.update({
          where: { id: data.id },
          data: { 
            status: data.status as any,
            progress: data.progress,
            updatedAt: new Date()
          }
        });

        // Broadcast to all clients in tasks room
        io.to('tasks').emit('task-updated', data);
        console.log(`Task ${data.title} status updated to ${data.status}`);
      } catch (error) {
        console.error('Error updating task status:', error);
        socket.emit('error', { message: 'Failed to update task status' });
      }
    });

    // Handle new messages
    socket.on('new-message', async (data: MessageUpdate) => {
      try {
        // Save to database
        const message = await db.message.create({
          data: {
            agentId: data.agentId,
            content: data.content,
            type: data.type as any,
            metadata: JSON.stringify({ timestamp: data.timestamp })
          }
        });

        // Broadcast to all clients in messages room
        io.to('messages').emit('message-received', {
          ...data,
          id: message.id,
          timestamp: new Date()
        });
        console.log(`New message from ${data.agentName}`);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to save message' });
      }
    });

    // Handle execution updates
    socket.on('execution-update', async (data: ExecutionUpdate) => {
      try {
        // Update database
        await db.execution.update({
          where: { id: data.id },
          data: { 
            status: data.status as any,
            duration: data.duration,
            error: data.error,
            completedAt: data.status === 'COMPLETED' || data.status === 'FAILED' ? new Date() : null
          }
        });

        // Broadcast to all clients in executions room
        io.to('executions').emit('execution-updated', data);
        console.log(`Execution ${data.id} status updated to ${data.status}`);
      } catch (error) {
        console.error('Error updating execution:', error);
        socket.emit('error', { message: 'Failed to update execution' });
      }
    });

    // Handle request for system status
    socket.on('get-system-status', async () => {
      try {
        const [agents, tasks, executions] = await Promise.all([
          db.agent.findMany({ select: { id: true, name: true, status: true } }),
          db.task.findMany({ select: { id: true, title: true, status: true, progress: true } }),
          db.execution.findMany({ 
            where: { status: 'RUNNING' },
            select: { id: true, agentId: true, taskId: true, status: true }
          })
        ]);

        const systemStatus = {
          agents: {
            total: agents.length,
            running: agents.filter(a => a.status === 'RUNNING').length,
            idle: agents.filter(a => a.status === 'IDLE').length,
            error: agents.filter(a => a.status === 'ERROR').length
          },
          tasks: {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'PENDING').length,
            running: tasks.filter(t => t.status === 'RUNNING').length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
            failed: tasks.filter(t => t.status === 'FAILED').length
          },
          executions: {
            running: executions.length
          },
          timestamp: new Date()
        };

        socket.emit('system-status', systemStatus);
      } catch (error) {
        console.error('Error getting system status:', error);
        socket.emit('error', { message: 'Failed to get system status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Agentic AI System',
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });
};

// Helper functions to broadcast updates from server-side
export const broadcastAgentUpdate = (io: Server, update: AgentUpdate) => {
  io.to('agents').emit('agent-updated', update);
};

export const broadcastTaskUpdate = (io: Server, update: TaskUpdate) => {
  io.to('tasks').emit('task-updated', update);
};

export const broadcastMessage = (io: Server, message: MessageUpdate) => {
  io.to('messages').emit('message-received', message);
};

export const broadcastExecutionUpdate = (io: Server, update: ExecutionUpdate) => {
  io.to('executions').emit('execution-updated', update);
};