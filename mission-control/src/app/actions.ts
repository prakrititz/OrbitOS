'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export async function getMessages(workspaceId: string) {
  const messages = await prisma.message.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { name: true, image: true }
      }
    }
  });

  return messages.map(msg => ({
    id: msg.id,
    sender: msg.user.name || 'Unknown',
    role: 'operator',
    text: msg.content,
    time: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
}

export async function sendMessage(workspaceId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error('Not authenticated');

  const userId = (session.user as any).id;

  // Ensure workspace exists in DB (since we are creating them in localStorage, we must sync them)
  const existingWs = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!existingWs) {
    await prisma.workspace.create({
      data: {
        id: workspaceId,
        name: workspaceId.substring(0, 2).toUpperCase(),
        full: workspaceId,
      }
    });
  }

  const msg = await prisma.message.create({
    data: {
      content,
      workspaceId,
      userId,
    },
    include: {
      user: { select: { name: true, image: true } }
    }
  });

  return {
    id: msg.id,
    sender: msg.user.name || 'Unknown',
    role: 'operator',
    text: msg.content,
    time: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
