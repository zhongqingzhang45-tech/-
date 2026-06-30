export { DigitalLifeAgent } from "./digital-life";
export type { ResponseResult } from "./digital-life";

export {
  EventUnderstandingLayer,
  BodilySystem,
  InstinctSystem,
  EmotionSystem,
  DecisionEngine,
  PersonaMatrixSystem,
  MemorySystem,
  StateEngine,
  CausalSystem,
  AutonomousDecisionEngine,
  GrowthEvolutionEngine,
  SkillSystem,
  GiftSystem,
  ImageRecognition,
  ContextService,
  DeviceFingerprint,
} from "./digital-life";

export type {
  CausalEvent,
  CausalChain,
  DecisionContext,
  AutonomousDecision,
  PersonalityVector,
  GrowthMetric,
  GrowthSnapshot,
  Skill,
  SkillResult,
  Gift,
  UserGift,
  WishListItem,
  GiftRequest,
  GiftHistoryEntry,
  GiftCategory,
  GiftRarity,
} from "./digital-life";

export {
  FEMALE_CHARACTERS,
  MALE_CHARACTERS,
  DEFAULT_LIFE_STATE,
  MOOD_CONFIG,
  PERSONA_MODE_LABELS,
  BIG_FIVE_PERSONALITY,
  DEFAULT_PERSONA_MATRIX,
  DEFAULT_MEMORY_BUFFER,
  generateName,
  generateNickname,
} from "./digital-life";

export type {
  Gender,
  MoodType,
  PersonaMode,
  BehaviorTag,
  MemoryType,
  RelationshipType,
  EmotionState,
  BodilyState,
  InstinctState,
  PersonaMatrix,
  PersonalityTrait,
  ValueSystem,
  RelationshipState,
  GrowthState,
  MemoryBuffer,
  MemoryEntry,
  MoodLogEntry,
  CharacterProfile,
  ChatMessage,
  ConversationContext,
  LifeState,
  DecisionResult,
  TriggerState,
} from "./digital-life";

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
