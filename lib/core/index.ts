export * from "./types";
export { EmotionEngine } from "./emotion-engine";
export { MemorySystem } from "./memory-system";
export { RelationshipManager } from "./relationship-manager";
export { CharacterAgent } from "./character-agent";
export { DigitalLifeAgent } from "./digital-life/agent";
export type { ResponseResult as DigitalLifeResponseResult } from "./digital-life/agent";
export {
  EventUnderstandingLayer,
  BodilySystem,
  InstinctSystem,
  EmotionSystem as DigitalLifeEmotionSystem,
  DecisionEngine,
} from "./digital-life/systems";
export {
  FEMALE_CHARACTERS,
  MALE_CHARACTERS,
  DEFAULT_LIFE_STATE,
  MOOD_CONFIG as DIGITAL_LIFE_MOOD_CONFIG,
} from "./digital-life/types";
export type {
  Gender,
  MoodType as DigitalLifeMoodType,
  EmotionState as DigitalLifeEmotionState,
  BodilyState,
  InstinctState,
  PersonalityTrait as DigitalLifePersonalityTrait,
  ValueSystem,
  RelationshipState as DigitalLifeRelationshipState,
  GrowthState,
  MemoryEntry as DigitalLifeMemoryEntry,
  CharacterProfile as DigitalLifeCharacterProfile,
  ChatMessage as DigitalLifeChatMessage,
  ConversationContext,
  LifeState,
  DecisionResult,
} from "./digital-life/types";
export { SpeechPipeline, createSpeechPipeline } from "./speech-pipeline";
export type {
  TTSOptions,
  ASROptions,
  SpeechPipelineConfig,
  SpeechEvent,
  TTSProvider,
  ASRProvider,
} from "./speech-pipeline";
export {
  Live2DManager,
  createLive2DManager,
  BUILTIN_MODELS,
  DEFAULT_EMOTION_MAP,
} from "./live2d-manager";
export type {
  Live2DExpression,
  Live2DMotion,
  Live2DModelConfig,
} from "./live2d-manager";
