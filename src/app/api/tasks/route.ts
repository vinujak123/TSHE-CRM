import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const _user = await requireAuth()
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN or ADMINISTRATOR, only show tasks assigned to the current user
    if (_user.role !== 'ADMIN' && _user.role !== 'ADMINISTRATOR') {
      where.assignedTo = _user.id
    }
    
    const tasks = await prisma.followUpTask.findMany({
      where,
      include: {
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdById: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        actionHistory: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            actionAt: 'desc',
          },
        },
      },
      orderBy: {
        dueAt: 'asc',
      },
    })

    // For non-admin users, filter to only show tasks for inquiries created by the current user
    const userTasks = _user.role === 'ADMIN' || _user.role === 'ADMINISTRATOR' 
      ? tasks 
      : tasks.filter(task => task.seeker.createdById === _user.id)

    return NextResponse.json(userTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
