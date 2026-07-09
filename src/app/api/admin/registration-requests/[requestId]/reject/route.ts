import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const staff = await getAuthenticatedStaff()
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : []
    if (staff.role !== 'ADMIN' && !modules.includes('requests')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to registration requests' }, { status: 403 })
    }

    const reviewedById = staff.id

    const { rejectionReason } = await req.json() ?? ""
    const { requestId } = await params

    const existingRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 })
    }

    if (staff.role !== 'ADMIN') {
      if (!staff.campusId) {
        return NextResponse.json({ error: 'Your account is not linked to any campus' }, { status: 403 })
      }
      if (existingRequest.campusId && existingRequest.campusId !== staff.campusId) {
        return NextResponse.json({ error: 'Forbidden: You can only reject requests for your assigned campus' }, { status: 403 })
      }
    }

    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This registration request has already been reviewed' },
        { status: 400 }
      )
    }

    const updatedRequest = await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedById,
        reviewedAt: new Date(),
      },
    })
    
    const { passwordHash, providerId, authProvider, ... resp} = updatedRequest
    return NextResponse.json({ message: 'Registration request rejected', request: resp })
  } catch (error) {
    console.error('[REJECT_REGISTRATION_REQUEST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
