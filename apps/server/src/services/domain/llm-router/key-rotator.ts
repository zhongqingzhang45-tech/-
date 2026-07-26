export interface KeyRotator {
  rotateIfNeeded(modelName: string): Promise<void>
  getCurrentKey(modelName: string): Promise<string | null>
}

export function createKeyRotator(_opts: any): KeyRotator {
  async function rotateIfNeeded(_modelName: string): Promise<void> {
  }

  async function getCurrentKey(_modelName: string): Promise<string | null> {
    return null
  }

  return { rotateIfNeeded, getCurrentKey }
}
