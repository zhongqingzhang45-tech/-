import { MoodType } from "./digital-life";
import { IDLE_ANIMATION_CONFIG, EYE_PARAMS, LIP_SYNC_PARAMS } from "./live2d-manager";

export interface Live2DModelLike {
  setParameterValueById(id: string, value: number): void;
  getParameterValueById(id: string): number;
}

export class EyeTrackingController {
  private model: Live2DModelLike | null = null;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private saccadeTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = true;

  setModel(model: Live2DModelLike | null): void {
    this.model = model;
  }

  setTarget(x: number, y: number): void {
    this.targetX = Math.max(-1, Math.min(1, x));
    this.targetY = Math.max(-1, Math.min(1, y));
  }

  update(dt: number): void {
    if (!this.model || !this.enabled) return;

    const smoothness = 5;
    this.currentX += (this.targetX - this.currentX) * Math.min(1, dt * smoothness);
    this.currentY += (this.targetY - this.currentY) * Math.min(1, dt * smoothness);

    this.model.setParameterValueById(EYE_PARAMS.eyeBallX, this.currentX);
    this.model.setParameterValueById(EYE_PARAMS.eyeBallY, this.currentY);
  }

  startSaccade(): void {
    this.scheduleNextSaccade();
  }

  stopSaccade(): void {
    if (this.saccadeTimer) {
      clearTimeout(this.saccadeTimer);
      this.saccadeTimer = null;
    }
  }

  private scheduleNextSaccade(): void {
    if (!this.enabled) return;
    const { min, max } = IDLE_ANIMATION_CONFIG.saccadeInterval;
    const delay = min + Math.random() * (max - min);

    this.saccadeTimer = setTimeout(() => {
      const range = IDLE_ANIMATION_CONFIG.saccadeRange;
      this.targetX += (Math.random() - 0.5) * range;
      this.targetY += (Math.random() - 0.5) * range;
      this.targetX = Math.max(-1, Math.min(1, this.targetX));
      this.targetY = Math.max(-1, Math.min(1, this.targetY));

      setTimeout(() => {
        this.targetX = 0;
        this.targetY = 0;
      }, 150 + Math.random() * 200);

      this.scheduleNextSaccade();
    }, delay);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.targetX = 0;
      this.targetY = 0;
    }
  }

  destroy(): void {
    this.stopSaccade();
    this.model = null;
  }
}

export class BlinkController {
  private model: Live2DModelLike | null = null;
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private isBlinking = false;
  private blinkProgress = 0;
  private enabled = true;

  setModel(model: Live2DModelLike | null): void {
    this.model = model;
  }

  start(): void {
    this.scheduleNextBlink();
  }

  stop(): void {
    if (this.blinkTimer) {
      clearTimeout(this.blinkTimer);
      this.blinkTimer = null;
    }
  }

  triggerBlink(): void {
    if (this.isBlinking || !this.enabled) return;
    this.isBlinking = true;
    this.blinkProgress = 0;
  }

  update(dt: number): void {
    if (!this.model || !this.enabled) return;

    if (this.isBlinking) {
      const duration = IDLE_ANIMATION_CONFIG.blinkDuration / 1000;
      this.blinkProgress += dt / duration;

      let eyeOpen = 1;
      if (this.blinkProgress < 0.5) {
        eyeOpen = 1 - this.blinkProgress * 2;
      } else {
        eyeOpen = (this.blinkProgress - 0.5) * 2;
      }

      this.model.setParameterValueById(EYE_PARAMS.eyeL, eyeOpen);
      this.model.setParameterValueById(EYE_PARAMS.eyeR, eyeOpen);

      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        this.model.setParameterValueById(EYE_PARAMS.eyeL, 1);
        this.model.setParameterValueById(EYE_PARAMS.eyeR, 1);
      }
    }
  }

  private scheduleNextBlink(): void {
    if (!this.enabled) return;
    const { min, max } = IDLE_ANIMATION_CONFIG.blinkInterval;
    const delay = min + Math.random() * (max - min);

    this.blinkTimer = setTimeout(() => {
      this.triggerBlink();
      this.scheduleNextBlink();
    }, delay);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    this.stop();
    this.model = null;
  }
}

export class BreathController {
  private model: Live2DModelLike | null = null;
  private time = 0;
  private enabled = true;

  setModel(model: Live2DModelLike | null): void {
    this.model = model;
  }

  update(dt: number): void {
    if (!this.model || !this.enabled) return;

    this.time += dt;
    const breath = Math.sin(this.time * Math.PI * 2 * IDLE_ANIMATION_CONFIG.breatheSpeed) *
      IDLE_ANIMATION_CONFIG.breatheAmplitude;

    this.model.setParameterValueById("ParamBreath", breath + 0.5);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    this.model = null;
  }
}

export class LipSyncController {
  private model: Live2DModelLike | null = null;
  private targetOpen = 0;
  private currentOpen = 0;
  private isSpeaking = false;
  private speechTimer: ReturnType<typeof setTimeout> | null = null;
  private textLength = 0;
  private charIndex = 0;
  private enabled = true;

  setModel(model: Live2DModelLike | null): void {
    this.model = model;
  }

  startSpeaking(text?: string): void {
    if (!this.enabled) return;
    this.isSpeaking = true;
    this.textLength = text?.length || 30;
    this.charIndex = 0;
    this.animateSpeech();
  }

  stopSpeaking(): void {
    this.isSpeaking = false;
    if (this.speechTimer) {
      clearTimeout(this.speechTimer);
      this.speechTimer = null;
    }
    this.targetOpen = 0;
  }

  private animateSpeech(): void {
    if (!this.isSpeaking || !this.enabled) return;

    const openDuration = 80 + Math.random() * 60;
    this.targetOpen = 0.3 + Math.random() * 0.7;

    this.speechTimer = setTimeout(() => {
      this.targetOpen = 0.05 + Math.random() * 0.1;

      const closeDuration = 50 + Math.random() * 50;
      this.speechTimer = setTimeout(() => {
        this.charIndex++;
        if (this.charIndex < this.textLength * 2) {
          this.animateSpeech();
        } else {
          this.targetOpen = 0;
          this.isSpeaking = false;
        }
      }, closeDuration);
    }, openDuration);
  }

  setMouthOpen(value: number): void {
    this.targetOpen = Math.max(0, Math.min(1, value));
  }

  update(dt: number): void {
    if (!this.model || !this.enabled) return;

    const smoothness = 15;
    this.currentOpen += (this.targetOpen - this.currentOpen) * Math.min(1, dt * smoothness);

    this.model.setParameterValueById(LIP_SYNC_PARAMS.mouthOpenY, this.currentOpen);

    if (this.currentOpen > 0.1) {
      this.model.setParameterValueById(LIP_SYNC_PARAMS.mouthForm, this.currentOpen * 0.3);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  destroy(): void {
    this.stopSpeaking();
    this.model = null;
  }
}

export class ExpressionTransitionController {
  private model: Live2DModelLike | null = null;
  private currentExpression: string = "neutral";
  private targetExpression: string = "neutral";
  private transitionProgress = 1;
  private transitionDuration = 0.5;
  private enabled = true;
  private expressionWeights: Record<string, number> = { neutral: 1 };

  setModel(model: Live2DModelLike | null): void {
    this.model = model;
  }

  setExpression(expressionId: string, duration?: number): void {
    if (this.targetExpression === expressionId) return;

    this.targetExpression = expressionId;
    this.transitionProgress = 0;
    this.transitionDuration = duration || 0.5;
  }

  update(dt: number): void {
    if (!this.enabled || this.transitionProgress >= 1) return;

    this.transitionProgress = Math.min(1, this.transitionProgress + dt / this.transitionDuration);

    const t = this.easeOutCubic(this.transitionProgress);

    this.expressionWeights[this.currentExpression] = 1 - t;
    this.expressionWeights[this.targetExpression] = t;

    if (this.transitionProgress >= 1) {
      this.currentExpression = this.targetExpression;
      this.expressionWeights = { [this.targetExpression]: 1 };
    }
  }

  getExpressionWeight(expressionId: string): number {
    return this.expressionWeights[expressionId] || 0;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    this.model = null;
  }
}

export class Live2DAnimationController {
  public eyeTracking: EyeTrackingController;
  public blink: BlinkController;
  public breath: BreathController;
  public lipSync: LipSyncController;
  public expression: ExpressionTransitionController;

  private rafId: number | null = null;
  private lastTime = 0;
  private isRunning = false;

  constructor() {
    this.eyeTracking = new EyeTrackingController();
    this.blink = new BlinkController();
    this.breath = new BreathController();
    this.lipSync = new LipSyncController();
    this.expression = new ExpressionTransitionController();
  }

  setModel(model: Live2DModelLike | null): void {
    this.eyeTracking.setModel(model);
    this.blink.setModel(model);
    this.breath.setModel(model);
    this.lipSync.setModel(model);
    this.expression.setModel(model);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.blink.start();
    this.eyeTracking.startSaccade();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.blink.stop();
    this.eyeTracking.stopSaccade();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);

    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dt: number): void {
    this.eyeTracking.update(dt);
    this.blink.update(dt);
    this.breath.update(dt);
    this.lipSync.update(dt);
    this.expression.update(dt);
  }

  setMood(mood: MoodType): void {
    if (mood === "sleepy") {
      this.blink.setEnabled(true);
    }
  }

  destroy(): void {
    this.stop();
    this.eyeTracking.destroy();
    this.blink.destroy();
    this.breath.destroy();
    this.lipSync.destroy();
    this.expression.destroy();
  }
}
