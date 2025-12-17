import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth()
    const { id } = await params
    
    const tasks = await prisma.followUpTask.findMany({
      where: {
        seekerId: id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueAt: 'asc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
