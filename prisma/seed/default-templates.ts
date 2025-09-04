import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding default agent and task templates...')

  // Create Agent Templates
  const agentTemplates = [
    {
      name: 'research_analyst',
      displayName: 'Research Analyst',
      description: 'Specializes in gathering, analyzing, and synthesizing information from various sources',
      type: 'Research Specialist',
      capabilities: ['Web Search', 'Data Analysis', 'Report Generation', 'Information Synthesis', 'Critical Thinking'],
      model: 'Local LLaMA 3',
      category: 'Research',
      tags: ['analysis', 'research', 'data', 'reports'],
      isSystem: true
    },
    {
      name: 'code_developer',
      displayName: 'Code Developer',
      description: 'Expert in software development, programming, and technical problem-solving',
      type: 'Developer',
      capabilities: ['Code Generation', 'Debugging', 'Code Review', 'Documentation', 'Testing'],
      model: 'Local Code Llama',
      category: 'Development',
      tags: ['coding', 'programming', 'software', 'technical'],
      isSystem: true
    },
    {
      name: 'content_creator',
      displayName: 'Content Creator',
      description: 'Generates creative content, marketing materials, and strategic communications',
      type: 'Content Specialist',
      capabilities: ['Creative Writing', 'Content Strategy', 'Marketing Copy', 'Storytelling', 'Brand Voice'],
      model: 'Local Mistral',
      category: 'Content',
      tags: ['writing', 'creative', 'marketing', 'content'],
      isSystem: true
    },
    {
      name: 'data_analyst',
      displayName: 'Data Analyst',
      description: 'Specializes in data processing, statistical analysis, and business intelligence',
      type: 'Analytics Specialist',
      capabilities: ['Data Processing', 'Statistical Analysis', 'Visualization', 'Business Intelligence', 'Pattern Recognition'],
      model: 'Local LLaMA 3',
      category: 'Analytics',
      tags: ['data', 'analytics', 'statistics', 'business'],
      isSystem: true
    },
    {
      name: 'customer_support',
      displayName: 'Customer Support',
      description: 'Handles customer inquiries, support tickets, and customer service tasks',
      type: 'Support Specialist',
      capabilities: ['Customer Communication', 'Problem Solving', 'Empathy', 'Technical Support', 'Documentation'],
      model: 'Local Mistral',
      category: 'Support',
      tags: ['customer', 'support', 'service', 'communication'],
      isSystem: true
    },
    {
      name: 'project_manager',
      displayName: 'Project Manager',
      description: 'Manages project workflows, task coordination, and team collaboration',
      type: 'Management Specialist',
      capabilities: ['Project Planning', 'Task Coordination', 'Team Management', 'Risk Assessment', 'Progress Tracking'],
      model: 'Local LLaMA 3',
      category: 'Management',
      tags: ['project', 'management', 'coordination', 'planning'],
      isSystem: true
    }
  ]

  for (const template of agentTemplates) {
    await prisma.agentTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: {
        ...template,
        capabilities: JSON.stringify(template.capabilities),
        tags: JSON.stringify(template.tags)
      }
    })
  }

  // Create Task Templates
  const taskTemplates = [
    {
      name: 'market_research',
      displayName: 'Market Research',
      description: 'Conduct comprehensive market research and analysis',
      type: 'Research',
      priority: 'HIGH',
      category: 'Research',
      tags: ['market', 'research', 'analysis', 'business'],
      isSystem: true
    },
    {
      name: 'code_review',
      displayName: 'Code Review',
      description: 'Review and provide feedback on code quality and best practices',
      type: 'Development',
      priority: 'MEDIUM',
      category: 'Development',
      tags: ['code', 'review', 'quality', 'feedback'],
      isSystem: true
    },
    {
      name: 'content_generation',
      displayName: 'Content Generation',
      description: 'Generate creative content for various purposes',
      type: 'Content',
      priority: 'MEDIUM',
      category: 'Content',
      tags: ['content', 'writing', 'creative', 'generation'],
      isSystem: true
    },
    {
      name: 'data_analysis',
      displayName: 'Data Analysis',
      description: 'Analyze datasets and provide insights',
      type: 'Analytics',
      priority: 'HIGH',
      category: 'Analytics',
      tags: ['data', 'analysis', 'insights', 'statistics'],
      isSystem: true
    },
    {
      name: 'bug_fix',
      displayName: 'Bug Fix',
      description: 'Identify and fix software bugs',
      type: 'Development',
      priority: 'HIGH',
      category: 'Development',
      tags: ['bug', 'fix', 'debug', 'software'],
      isSystem: true
    },
    {
      name: 'report_generation',
      displayName: 'Report Generation',
      description: 'Generate comprehensive reports on various topics',
      type: 'Research',
      priority: 'MEDIUM',
      category: 'Research',
      tags: ['report', 'generation', 'documentation', 'analysis'],
      isSystem: true
    },
    {
      name: 'customer_inquiry',
      displayName: 'Customer Inquiry',
      description: 'Handle and respond to customer inquiries',
      type: 'Support',
      priority: 'MEDIUM',
      category: 'Support',
      tags: ['customer', 'inquiry', 'support', 'response'],
      isSystem: true
    },
    {
      name: 'project_planning',
      displayName: 'Project Planning',
      description: 'Plan and organize project tasks and timelines',
      type: 'Management',
      priority: 'HIGH',
      category: 'Management',
      tags: ['project', 'planning', 'organization', 'timeline'],
      isSystem: true
    }
  ]

  for (const template of taskTemplates) {
    await prisma.taskTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: {
        ...template,
        tags: JSON.stringify(template.tags)
      }
    })
  }

  console.log('✅ Default templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })