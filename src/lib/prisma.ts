import { PrismaClient } from '@prisma/client' //it helps to avoid multiple instances of the PrismaClient in development
import type { Prisma } from '@prisma/client'

//Without this pattern, we might see: Too many database connections errors
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

export const db = prisma
