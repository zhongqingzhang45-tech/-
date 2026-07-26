import type { IntentHandle, IntentOptions } from '@proj-airi/pipelines-audio'

import { nanoid } from 'nanoid'

/**
 * Life: 简化的 speech pipeline runtime stub。
 *
 * 真实实现在 @proj-airi/pipelines-audio 里，依赖 TTS/ASR/audio pipeline 完整初始化。
 * Life MVP 阶段只用到文本流（writeLiteral/writeSpecial/writeFlush），
 * 不需要真实音频播放，所以这里返回一个满足 IntentHandle 类型契约的空实现。
 *
 * Removal condition: 接入真实 TTS/ASR pipeline 后，删除此文件，
 * 改为从 @proj-airi/pipelines-audio 导入 createSpeechPipelineRuntime。
 */

function createNoopIntentHandle(_options?: IntentOptions): IntentHandle {
  const intentId = _options?.intentId ?? nanoid()
  const streamId = _options?.streamId ?? nanoid()
  const priority = typeof _options?.priority === 'number' ? _options.priority : 0

  return {
    turnId: _options?.turnId,
    intentId,
    streamId,
    priority,
    ownerId: _options?.ownerId,
    writeLiteral: () => {},
    writeSpecial: () => {},
    writeFlush: () => {},
    end: () => {},
    cancel: () => {},
    // Life: 返回一个已结束的空流，consume 时立刻 done
    stream: new ReadableStream({
      start(controller) {
        controller.close()
      },
    }),
  }
}

export function createSpeechPipelineRuntime() {
  return {
    openIntent: (options?: IntentOptions) => createNoopIntentHandle(options),
    // Life: 接受 pipeline 参数以匹配真实实现的类型契约；stub 下不使用
    registerHost: async (_pipeline: unknown) => {},
    isHost: () => false,
    dispose: async () => {},
  }
}
