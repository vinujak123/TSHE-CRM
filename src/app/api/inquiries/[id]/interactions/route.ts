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
    
    const interactions = await prisma.interaction.findMany({
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
        createdAt: 'desc',
      },
    })

    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth()
    const { id } = await params
    
    const body = await request.json()
    
    const interaction = await prisma.interaction.create({
      data: {
        ...body,
        seekerId: id,
        userId: _user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // Auto-create follow-up task based on outcome
    if (body.outcome === 'NO_ANSWER') {
      await prisma.followUpTask.create({
        data: {
          seekerId: id,
          assignedTo: _user.id,
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          purpose: 'CALLBACK',
          notes: 'Follow up on missed call',
        },
      })
    }

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}
