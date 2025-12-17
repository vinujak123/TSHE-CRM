import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only ADMIN and ADMINISTRATOR can view activity logs
    if (user.role !== 'ADMIN' && user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')
    const activityType = searchParams.get('activityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isSuccessful = searchParams.get('isSuccessful')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (activityType) {
      where.activityType = activityType
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }
    
    if (isSuccessful !== null && isSuccessful !== undefined) {
      where.isSuccessful = isSuccessful === 'true'
    }

    const [activityLogs, totalCount] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.userActivityLog.count({ where })
    ])

    return NextResponse.json({
      activityLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching user activity logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      activityType,
      ipAddress,
      userAgent,
      location,
      sessionId,
      deviceInfo,
      isSuccessful = true,
      failureReason,
      metadata
    } = body

    // Check if activity logging is enabled
    const loggingEnabled = await prisma.systemSettings.findUnique({
      where: { key: 'USER_ACTIVITY_LOGGING_ENABLED' }
    })

    if (!loggingEnabled || loggingEnabled.value !== 'true') {
      return NextResponse.json({ message: 'Activity logging is disabled' })
    }

    const activityLog = await prisma.userActivityLog.create({
      data: {
        userId,
        activityType,
        ipAddress,
        userAgent,
        location,
        sessionId,
        deviceInfo,
        isSuccessful,
        failureReason,
        metadata
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(activityLog)
  } catch (error) {
    console.error('Error creating user activity log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
