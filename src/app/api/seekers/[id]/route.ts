import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth()
    const { id } = await params
    
    const body = await request.json()
    
    const seeker = await prisma.seeker.update({
      where: {
        id: id,
      },
      data: body,
      include: {
        programInterest: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(seeker)
  } catch (error) {
    console.error('Error updating seeker:', error)
    return NextResponse.json(
      { error: 'Failed to update seeker' },
      { status: 500 }
    )
  }
}
