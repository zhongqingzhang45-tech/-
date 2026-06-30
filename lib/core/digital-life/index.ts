export { DigitalLifeAgent } from './agent';
export type { ResponseResult } from './agent';

export {
  EventUnderstandingLayer,
  BodilySystem,
  InstinctSystem,
  EmotionSystem,
  DecisionEngine,
  PersonaMatrixSystem,
  MemorySystem,
  TriggerEngine,
} from './systems';

export { StateEngine } from './state-engine';

export { CausalSystem } from './causal-system';
export type { CausalEvent, CausalChain } from './causal-system';

export { AutonomousDecisionEngine } from './autonomous-decision-engine';
export type { DecisionContext, AutonomousDecision } from './autonomous-decision-engine';

export { GrowthEvolutionEngine } from './growth-engine';
export type {
  PersonalityVector,
  GrowthMetric,
  GrowthSnapshot,
} from './growth-engine';

export { SkillSystem } from './skills';
export type { Skill, SkillResult } from './skills';

export { GiftSystem } from './gift-system';
export type {
  Gift,
  UserGift,
  WishListItem,
  GiftRequest,
  GiftHistoryEntry,
  GiftCategory,
  GiftRarity,
} from './gift-system';

export { ImageRecognition } from './image-recognition';
export { ContextService } from './context-service';
export { DeviceFingerprint } from './device-binding';

export { generateName, generateNickname } from './name-generator';

export {
  createLLMProvider,
  buildCharacterSystemPrompt,
  loadLLMConfigFromStorage,
  saveLLMConfigToStorage,
  clearLLMConfigFromStorage,
} from '../llm';

export type {
  LLMConfig,
  LLMProvider,
  LLMProviderInterface,
  LLMResponse,
  ChatMessage as LLMChatMessage,
  CharacterPromptOptions,
} from '../llm/types';

export {
  FEMALE_CHARACTERS,
  MALE_CHARACTERS,
  DEFAULT_LIFE_STATE,
  MOOD_CONFIG,
  PERSONA_MODE_LABELS,
  BIG_FIVE_PERSONALITY,
  DEFAULT_PERSONA_MATRIX,
  DEFAULT_MEMORY_BUFFER,
} from './types';

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
} from './types';
