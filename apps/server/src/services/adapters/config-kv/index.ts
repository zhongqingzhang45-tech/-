import Redis from 'ioredis'

export interface ConfigKVService {
  get(key: string): Promise<any>
  getOptional(key: string): Promise<any | null>
  getOrThrow(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
}

const PREFIX = 'config:'

export function createConfigKVService(redis: Redis): ConfigKVService {
  const prefixedKey = (key: string) => `${PREFIX}${key}`

  return {
    async get(key: string) {
      const value = await redis.get(prefixedKey(key))
      return value ? JSON.parse(value) : undefined
    },

    async getOptional(key: string) {
      const value = await redis.get(prefixedKey(key))
      return value ? JSON.parse(value) : null
    },

    async getOrThrow(key: string) {
      const value = await redis.get(prefixedKey(key))
      if (!value) {
        throw new Error(`Config key "${key}" is not set`)
      }
      return JSON.parse(value)
    },

    async set(key: string, value: any) {
      await redis.set(prefixedKey(key), JSON.stringify(value))
    },
  }
}
