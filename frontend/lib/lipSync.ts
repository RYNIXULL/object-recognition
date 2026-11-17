import { VRMExpressionManager } from '@pixiv/three-vrm';

// Mapping from Edge TTS Viseme ID (0-21) to VRM blendshape names (A, I, U, E, O)
// Viseme IDs: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
const VISEME_TO_BLENDSHAPE: Record<string, string> = {
  '0': 'neutral',
  '1': 'a', // a
  '2': 'a', // aa
  '3': 'o', // O
  '4': 'e', // E
  '5': 'o', // er
  '6': 'i', // y
  '7': 'u', // u
  '8': 'o', // o
  '9': 'a', // ah
  '10': 'o', // oh
  '11': 'a', // aw
  '12': 'neutral', // consonant
  '13': 'o', // r
  '14': 'neutral', // l
  '15': 'neutral', // s, z
  '16': 'neutral', // sh, ch, j, zh
  '17': 'neutral', // th, dh
  '18': 'neutral', // f, v
  '19': 'neutral', // d, t, n, th
  '20': 'neutral', // k, g, ng
  '21': 'neutral', // p, b, m
};

export class LipSync {
  private expressionManager: VRMExpressionManager | null = null;
  private currentViseme: string = 'neutral';
  private targetViseme: string = 'neutral';
  private transitionTime: number = 0.1; // seconds
  private lastUpdateTime: number = 0;

  setExpressionManager(manager: VRMExpressionManager) {
    this.expressionManager = manager;
  }

  setViseme(phoneme: string) {
    // Map phoneme/viseme ID to blendshape
    const blendshape = VISEME_TO_BLENDSHAPE[phoneme] || 'neutral';
    this.targetViseme = blendshape;
  }

  update(delta: number) {
    if (!this.expressionManager) return;

    // Reset all lip blendshapes slightly
    const shapes = ['a', 'i', 'u', 'e', 'o'];
    
    // Animate towards target
    for (const shape of shapes) {
      const isTarget = (shape === this.targetViseme);
      const currentVal = this.expressionManager.getValue(shape) || 0;
      const targetVal = isTarget ? 1.0 : 0.0;
      
      // Lerp
      const newVal = currentVal + (targetVal - currentVal) * (delta / this.transitionTime);
      this.expressionManager.setValue(shape, Math.max(0, Math.min(1, newVal)));
    }
  }

  reset() {
    this.targetViseme = 'neutral';
  }
}
