import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface AuthUser extends User {
  token: string
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Verify JWT token
export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Get current user from token
export async function getCurrentUser(token?: string): Promise<User | null> {
  if (!token) {
    // In development mode, return a default admin user
    const defaultUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })
    return defaultUser
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id
    },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  })

  if (!user || !user.isActive) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }
}

// Require authentication
export async function requireAuth(request?: Request): Promise<User> {
  // Get user info from middleware headers
  if (request) {
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    const userRole = request.headers.get('x-user-role')
    
    if (userId && userEmail && userRole) {
      return {
        id: userId,
        name: '', // We'll need to fetch this if needed
        email: userEmail,
        role: userRole,
        isActive: true
      }
    }
  }
  
  // Fallback: return default admin user
  const defaultUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  })
  
  if (!defaultUser) {
    throw new Error('No admin user found')
  }
  
  return defaultUser
}

// Require specific role
export async function requireRole(role: string, request?: Request): Promise<User> {
  const user = await requireAuth(request)
  
  if (user.role !== role && user.role !== 'ADMIN' && user.role !== 'ADMINISTRATOR') {
    throw new Error(`Access denied. Required role: ${role}`)
  }
  
  return user
}

// Simple admin check based on the role set by middleware headers.
// Keep synchronous so it can be used in route guards without extra DB calls.
export function isAdmin(request?: Request): boolean {
  const role = request?.headers?.get('x-user-role') || ''
  return role === 'ADMIN' || role === 'ADMINISTRATOR'
}

// Login function
export async function login(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  })

  if (!user || !user.isActive) {
    return null
  }

  // For development, we'll skip password check if no password is set
  if (user.password) {
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return null
    }
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    token
  }
}

// Register function
export async function register(userData: {
  name: string
  email: string
  password: string
  role?: string
}): Promise<AuthUser | null> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: userData.email
    }
  })

  if (existingUser) {
    return null
  }

  const hashedPassword = await hashPassword(userData.password)

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: (userData.role as UserRole) || UserRole.ADMIN,
      isActive: true
    }
  })

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    token
  }
}