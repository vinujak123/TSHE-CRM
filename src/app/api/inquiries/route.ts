import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { logUserActivity } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    // Pass request to requireAuth to get the actual logged-in user
    const _user = await requireAuth(request)
    
    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }
    
    // Build where clause based on user role
    // Only ADMIN/ADMINISTRATOR can see all inquiries
    // Other users can only see inquiries they created
    const where: any = {}
    
    if (_user.role !== 'ADMIN' && _user.role !== 'ADMINISTRATOR') {
      // Non-admin users can only see inquiries they created
      where.createdById = _user.id
    }
    
    // Use transaction to fetch data and count in parallel for better performance
    const [seekers, totalInquiries] = await prisma.$transaction([
      prisma.seeker.findMany({
        where,
        include: {
          programInterest: true,
          preferredPrograms: {
            include: {
              program: true,
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
          campaigns: {
            include: {
              campaign: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.seeker.count({ where }),
    ])

    const totalPages = Math.ceil(totalInquiries / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      inquiries: seekers,
      pagination: {
        total: totalInquiries,
        page,
        limit,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error('❌ ERROR in /api/inquiries:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return proper JSON error response
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message,
          details: error.stack,
          route: '/api/inquiries'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch seekers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pass request to requireAuth to get the actual logged-in user, not fallback admin
    const _user = await requireAuth(request)
    
    const body = await request.json()
    console.log('Received body:', body)

    // Check for duplicate phone number
    const existingSeeker = await prisma.seeker.findUnique({
      where: {
        phone: body.phone,
      },
    })

    if (existingSeeker) {
      return NextResponse.json(
        { error: 'An inquiry with this phone number already exists' },
        { status: 400 }
      )
    }

    console.log('Creating seeker with data:', {
      ...body,
      createdById: _user.id,
    })
    
    const seeker = await prisma.seeker.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        whatsapp: body.whatsapp || false,
        whatsappNumber: body.whatsappNumber || null,
        email: body.email || null,
        city: body.city || null,
        ageBand: body.ageBand || null,
        guardianPhone: body.guardianPhone || null,
        programInterestId: body.programInterestId || null, // Keep for backward compatibility
        marketingSource: body.marketingSource,
        campaignId: body.campaignId || null,
        preferredContactTime: body.preferredContactTime || null,
        preferredStatus: body.preferredStatus || null,
        followUpAgain: body.followUpAgain || false,
        followUpDate: body.followUpDate || null,
        followUpTime: body.followUpTime || null,
        description: body.description || null,
        consent: body.consent || false,
        createdById: _user.id,
        // Create many-to-many relationships for preferred programs
        preferredPrograms: {
          create: (body.preferredProgramIds || []).map((programId: string) => ({
            programId: programId,
          })),
        },
      },
      include: {
        programInterest: true,
        preferredPrograms: {
          include: {
            program: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })
    
    console.log('Seeker created successfully:', seeker)

    // Log activity: Inquiry created by user
    try {
      await logUserActivity({
        userId: _user.id,
        activityType: 'CREATE_INQUIRY',
        request,
        isSuccessful: true,
        metadata: {
          seekerId: seeker.id,
          seekerName: seeker.fullName,
          seekerPhone: seeker.phone,
        },
      })
    } catch (logError) {
      console.error('Error logging inquiry creation activity:', logError)
      // Don't fail the inquiry creation if logging fails
    }

    // Automatically create 2 follow-up tasks for new inquiries
    try {
      const now = new Date()
      
      // First follow-up: 3 days from now
      const firstDueDate = new Date(now)
      firstDueDate.setDate(firstDueDate.getDate() + 3)
      firstDueDate.setHours(10, 0, 0, 0) // Set to 10 AM
      
      // Second follow-up: 7 days from now
      const secondDueDate = new Date(now)
      secondDueDate.setDate(secondDueDate.getDate() + 7)
      secondDueDate.setHours(10, 0, 0, 0) // Set to 10 AM
      
      // Create first follow-up task
      const firstFollowUpTask = await prisma.followUpTask.create({
        data: {
          seekerId: seeker.id,
          assignedTo: _user.id,
          dueAt: firstDueDate,
          purpose: 'CALLBACK',
          notes: `Automatic follow-up #1: Initial contact follow-up for inquiry - ${seeker.fullName} (${seeker.phone})`,
          status: 'OPEN',
        },
      })
      
      // Create second follow-up task
      const secondFollowUpTask = await prisma.followUpTask.create({
        data: {
          seekerId: seeker.id,
          assignedTo: _user.id,
          dueAt: secondDueDate,
          purpose: 'CALLBACK',
          notes: `Automatic follow-up #2: Secondary follow-up for inquiry - ${seeker.fullName} (${seeker.phone})`,
          status: 'OPEN',
        },
      })
      
      // Create initial action history entries
      await Promise.all([
        prisma.taskActionHistory.create({
          data: {
            taskId: firstFollowUpTask.id,
            fromStatus: null,
            toStatus: 'OPEN',
            actionBy: _user.id,
            notes: 'Task created automatically from new inquiry - First follow-up (3 days)',
          },
        }),
        prisma.taskActionHistory.create({
          data: {
            taskId: secondFollowUpTask.id,
            fromStatus: null,
            toStatus: 'OPEN',
            actionBy: _user.id,
            notes: 'Task created automatically from new inquiry - Second follow-up (7 days)',
          },
        }),
      ])
      
      console.log('Automatic follow-up tasks created:', {
        first: firstFollowUpTask.id,
        second: secondFollowUpTask.id,
      })
    } catch (taskError) {
      console.error('Error creating automatic follow-up tasks:', taskError)
      // Don't fail the inquiry creation if task creation fails
    }

    return NextResponse.json(seeker, { status: 201 })
  } catch (error) {
    console.error('Error creating inquiry:', error)
    
    // Return proper JSON error response
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}