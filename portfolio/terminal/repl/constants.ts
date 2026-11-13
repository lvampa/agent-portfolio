export const EVENTS = {
  SUBMIT: 'submit',
} as const;

export const SPINNER_FRAMES = ['|', '/', '-', '\\'] as const;
export const SPINNER_FRAME_MS = 120;
export const WAITING_LABEL = 'Waiting for the agent';

export const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);
