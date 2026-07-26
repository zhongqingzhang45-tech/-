export interface UserDeletionHandler {
  name: string
  priority: number
  softDelete: (input: { userId: string }) => Promise<void>
}

export interface UserDeletionService {
  register(handler: UserDeletionHandler): void
  softDeleteAll(input: { userId: string; reason?: string }): Promise<void>
  listHandlers(): UserDeletionHandler[]
}

export function createUserDeletionService(): UserDeletionService {
  const handlers: UserDeletionHandler[] = []

  function register(handler: UserDeletionHandler) {
    handlers.push(handler)
    handlers.sort((a, b) => a.priority - b.priority)
  }

  async function softDeleteAll(input: { userId: string; reason?: string }) {
    const errors: Array<{ name: string; error: unknown }> = []

    for (const handler of handlers) {
      try {
        await handler.softDelete({ userId: input.userId })
      }
      catch (err) {
        errors.push({ name: handler.name, error: err })
      }
    }

    if (errors.length > 0) {
      console.error('[user-deletion] some handlers failed:', errors)
    }
  }

  function listHandlers(): UserDeletionHandler[] {
    return [...handlers]
  }

  return { register, softDeleteAll, listHandlers }
}
