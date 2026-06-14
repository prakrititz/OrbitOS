'use server';

import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function getMessages(workspaceId: string) {
  const client = await clientPromise;
  const db = client.db();

  const messages = await db.collection('messages')
    .find({ workspaceId })
    .sort({ createdAt: 1 })
    .toArray();

  const userIds = [...new Set(messages.map(msg => msg.userId))];
  const users = await db.collection('users')
    .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
    .toArray();
  const userMap = new Map(users.map(u => [u._id.toString(), u]));

  return messages.map(msg => ({
    id: msg._id.toString(),
    sender: userMap.get(msg.userId)?.name || 'Unknown',
    role: 'operator',
    text: msg.content,
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
}

export async function sendMessage(workspaceId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error('Not authenticated');

  const userId = (session.user as any).id;

  const client = await clientPromise;
  const db = client.db();

  // Ensure workspace exists in DB (since we are creating them in localStorage, we must sync them)
  const existingWs = await db.collection('workspaces').findOne({ _id: workspaceId } as any);
  if (!existingWs) {
    await db.collection('workspaces').insertOne({
      _id: workspaceId,
      name: workspaceId.substring(0, 2).toUpperCase(),
      full: workspaceId,
      createdAt: new Date(),
    } as any);
  }

  const createdAt = new Date();
  const result = await db.collection('messages').insertOne({
    content,
    workspaceId,
    userId,
    createdAt,
  });

  return {
    id: result.insertedId.toString(),
    sender: session.user.name || 'Unknown',
    role: 'operator',
    text: content,
    time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
