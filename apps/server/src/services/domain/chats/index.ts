import type { Database } from '../../../libs/db'

import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { chatMembers, chats, messages } from '../../../schemas/chats'

export interface ChatWithMembers {
  id: string
  type: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  members: ChatMember[]
}

export interface ChatMember {
  id: string
  chatId: string
  memberType: string
  userId: string | null
  characterId: string | null
}

export interface PullMessagesResult {
  messages: WireMessage[]
  more: boolean
}

export interface WireMessage {
  id: string
  chatId: string
  senderId: string | null
  role: string
  seq: number | null
  content: string
  mediaIds: string[]
  stickerIds: string[]
  replyToMessageId: string | null
  forwardFromMessageId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PushMessagesResult {
  fromSeq: number
  toSeq: number
  seq: number
}

export interface IncomingMessage {
  senderId?: string
  role: string
  content: string
  mediaIds?: string[]
  stickerIds?: string[]
  replyToMessageId?: string
  forwardFromMessageId?: string
}

export interface ChatService {
  createChat(userId: string, input: Record<string, any>): Promise<ChatWithMembers>
  listChats(userId: string): Promise<ChatWithMembers[]>
  getChat(userId: string, chatId: string): Promise<ChatWithMembers | null>
  updateChat(userId: string, chatId: string, input: Record<string, any>): Promise<ChatWithMembers | null>
  deleteChat(userId: string, chatId: string): Promise<{ success: boolean }>
  addMember(userId: string, chatId: string, input: Record<string, any>): Promise<{ success: boolean }>
  removeMember(userId: string, chatId: string, memberId: string): Promise<{ success: boolean }>
  pushMessages(userId: string, chatId: string, msgs: IncomingMessage[]): Promise<PushMessagesResult>
  pullMessages(userId: string, chatId: string, afterSeq: number, limit: number): Promise<PullMessagesResult>
  getMembers(chatId: string): Promise<ChatMember[]>
  deleteAllForUser(userId: string): Promise<void>
}

export function createChatService(db: Database, _engagementMetrics?: any, _productEventService?: any): ChatService {
  async function isMember(userId: string, chatId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(chatMembers)
      .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)))
      .limit(1)
    return rows.length > 0
  }

  async function getMembersInternal(chatId: string): Promise<ChatMember[]> {
    return db
      .select()
      .from(chatMembers)
      .where(eq(chatMembers.chatId, chatId))
  }

  async function toChatWithMembers(chat: typeof chats.$inferSelect): Promise<ChatWithMembers> {
    const members = await getMembersInternal(chat.id)
    return {
      id: chat.id,
      type: chat.type,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      members,
    }
  }

  async function createChat(userId: string, input: Record<string, any>): Promise<ChatWithMembers> {
    return db.transaction(async (tx) => {
      const [chat] = await tx
        .insert(chats)
        .values({
          type: input.type ?? 'private',
          title: input.title ?? null,
        })
        .returning()

      await tx.insert(chatMembers).values({
        chatId: chat.id,
        memberType: 'user',
        userId,
      })

      if (input.members?.length) {
        await tx.insert(chatMembers).values(
          input.members.map((m: any) => ({
            chatId: chat.id,
            memberType: m.type,
            userId: m.userId ?? null,
            characterId: m.characterId ?? null,
          })),
        )
      }

      return toChatWithMembers(chat)
    })
  }

  async function listChats(userId: string): Promise<ChatWithMembers[]> {
    const memberRows = await db
      .select({ chatId: chatMembers.chatId })
      .from(chatMembers)
      .where(and(eq(chatMembers.userId, userId), eq(chatMembers.memberType, 'user')))

    if (memberRows.length === 0) return []

    const chatIds = memberRows.map(r => r.chatId)
    const chatRows = await db
      .select()
      .from(chats)
      .where(and(inArray(chats.id, chatIds), isNull(chats.deletedAt)))
      .orderBy(desc(chats.updatedAt))

    return Promise.all(chatRows.map(toChatWithMembers))
  }

  async function getChat(userId: string, chatId: string): Promise<ChatWithMembers | null> {
    if (!(await isMember(userId, chatId))) return null

    const rows = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
      .limit(1)

    return rows[0] ? toChatWithMembers(rows[0]) : null
  }

  async function updateChat(userId: string, chatId: string, input: Record<string, any>): Promise<ChatWithMembers | null> {
    if (!(await isMember(userId, chatId))) return null

    const [updated] = await db
      .update(chats)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(chats.id, chatId))
      .returning()

    return updated ? toChatWithMembers(updated) : null
  }

  async function deleteChat(userId: string, chatId: string): Promise<{ success: boolean }> {
    if (!(await isMember(userId, chatId))) return { success: false }

    await db
      .update(chats)
      .set({ deletedAt: new Date() })
      .where(eq(chats.id, chatId))

    return { success: true }
  }

  async function addMember(userId: string, chatId: string, input: Record<string, any>): Promise<{ success: boolean }> {
    if (!(await isMember(userId, chatId))) return { success: false }

    await db.insert(chatMembers).values({
      chatId,
      memberType: input.type,
      userId: input.userId ?? null,
      characterId: input.characterId ?? null,
    })

    return { success: true }
  }

  async function removeMember(userId: string, chatId: string, memberId: string): Promise<{ success: boolean }> {
    if (!(await isMember(userId, chatId))) return { success: false }

    await db.delete(chatMembers).where(and(eq(chatMembers.id, memberId), eq(chatMembers.chatId, chatId)))

    return { success: true }
  }

  async function getMaxSeq(chatId: string): Promise<number> {
    const result = await db
      .select({ max: sql<number>`coalesce(max(seq), 0)`.mapWith(Number) })
      .from(messages)
      .where(eq(messages.chatId, chatId))

    return result[0]?.max ?? 0
  }

  async function pushMessages(userId: string, chatId: string, msgs: IncomingMessage[]): Promise<PushMessagesResult> {
    if (!(await isMember(userId, chatId))) {
      throw new Error('Not a member of this chat')
    }

    return db.transaction(async (tx) => {
      const currentMax = await getMaxSeq(chatId)
      const fromSeq = currentMax + 1

      const values = msgs.map((m, i) => ({
        chatId,
        senderId: m.senderId ?? userId,
        role: m.role,
        seq: currentMax + i + 1,
        content: m.content,
        mediaIds: m.mediaIds ?? [],
        stickerIds: m.stickerIds ?? [],
        replyToMessageId: m.replyToMessageId ?? null,
        forwardFromMessageId: m.forwardFromMessageId ?? null,
      }))

      await tx.insert(messages).values(values)

      const toSeq = currentMax + msgs.length
      return { fromSeq, toSeq, seq: toSeq }
    })
  }

  async function pullMessages(userId: string, chatId: string, afterSeq: number, limit: number): Promise<PullMessagesResult> {
    if (!(await isMember(userId, chatId))) {
      return { messages: [], more: false }
    }

    const rows = await db
      .select()
      .from(messages)
      .where(and(eq(messages.chatId, chatId), sql`seq > ${afterSeq}`, isNull(messages.deletedAt)))
      .orderBy(sql`seq asc`)
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows

    return {
      messages: items as WireMessage[],
      more: hasMore,
    }
  }

  async function getMembers(chatId: string): Promise<ChatMember[]> {
    return getMembersInternal(chatId)
  }

  async function deleteAllForUser(userId: string): Promise<void> {
    const memberRows = await db
      .select({ chatId: chatMembers.chatId })
      .from(chatMembers)
      .where(and(eq(chatMembers.userId, userId), eq(chatMembers.memberType, 'user')))

    if (memberRows.length === 0) return

    const chatIds = memberRows.map(r => r.chatId)
    await db
      .update(chats)
      .set({ deletedAt: new Date() })
      .where(inArray(chats.id, chatIds))
  }

  return {
    createChat,
    listChats,
    getChat,
    updateChat,
    deleteChat,
    addMember,
    removeMember,
    pushMessages,
    pullMessages,
    getMembers,
    deleteAllForUser,
  }
}
