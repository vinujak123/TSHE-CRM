import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN or ADMINISTRATOR, only show user's own messages
    if (user.role !== 'ADMIN' && user.role !== 'ADMINISTRATOR') {
      where.userId = user.id
    }
    
    // Fetch WhatsApp message history with related data
    const messages = await prisma.whatsAppMessage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipients: {
          include: {
            seeker: {
              select: {
                id: true,
                fullName: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching WhatsApp message history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    )
  }
}
