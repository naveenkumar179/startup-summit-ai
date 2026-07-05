import { and, desc, eq, or } from "drizzle-orm";
import { db } from "./db";
import { conversations, messages, users, type User } from "./db/schema";

export async function getOrCreateConversation(
  founderId: string,
  investorId: string
): Promise<typeof conversations.$inferSelect> {
  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.founderId, founderId), eq(conversations.investorId, investorId)));

  if (existing) return existing;

  const [created] = await db
    .insert(conversations)
    .values({ founderId, investorId })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [fallback] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.founderId, founderId), eq(conversations.investorId, investorId)));

  return fallback;
}

export function isParticipant(conversation: { founderId: string; investorId: string }, userId: string) {
  return conversation.founderId === userId || conversation.investorId === userId;
}

export async function listConversationsForUser(userId: string, role: string) {
  const rows = await db
    .select()
    .from(conversations)
    .where(role === "founder" ? eq(conversations.founderId, userId) : eq(conversations.investorId, userId))
    .orderBy(desc(conversations.updatedAt));

  const otherIds = rows.map((c) => (role === "founder" ? c.investorId : c.founderId));
  const others = otherIds.length
    ? await db.select().from(users).where(or(...otherIds.map((id) => eq(users.id, id))))
    : [];
  const otherById = new Map<string, User>(others.map((u) => [u.id, u]));

  const lastMessages = await Promise.all(
    rows.map((c) =>
      db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, c.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)
    )
  );

  return rows.map((c, i) => ({
    conversation: c,
    otherUser: otherById.get(role === "founder" ? c.investorId : c.founderId) ?? null,
    lastMessage: lastMessages[i][0] ?? null,
  }));
}

export async function listMessages(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const [message] = await db
    .insert(messages)
    .values({ conversationId, senderId, content })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return message;
}

export async function getConversationById(id: string) {
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
  return conversation ?? null;
}
