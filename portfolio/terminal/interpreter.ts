import { COMMAND_MODE } from './constants';
import type { Ports } from './ports';
import type { Effect, EffectContext, EffectHandlers, EffectOf, EffectType } from './types';
import { chatResultEffects } from './utils';

const effectHandlers: EffectHandlers = {
  print: ({ item }, { ports }) => {
    ports.history.append(item);
    return 'continue';
  },
  clear: (_effect, { ports }) => {
    ports.history.clear();
    return 'continue';
  },
  newConversation: (_effect, { ports }) => {
    ports.session.newConversation();
    return 'continue';
  },
  setName: ({ name }, { ports }) => {
    ports.session.setName(name);
    return 'continue';
  },
  ask: ({ questionId, subject }, { ports, rest }) => {
    ports.session.setMode({ type: 'awaiting', questionId, subject, then: rest });
    return 'stop';
  },
  chat: async ({ message }, { ports }) =>
    chatResultEffects(await ports.chat.send(message), message),
};

function dispatch<K extends EffectType>(type: K, effect: EffectOf<K>, context: EffectContext) {
  const handler = effectHandlers[type];
  return handler(effect, context);
}

/**
 * Each apply starts in command mode, and an ask stops the walk with the rest parked in the mode.
 * An async handler resolves to follow-up effects, which run next, before the rest.
 * Effects before the first chat apply in the same tick, which the startup relies on to land before paint.
 */
export function createInterpreter(ports: Ports): { apply(effects: Effect[]): Promise<void> } {
  async function apply(effects: Effect[]): Promise<void> {
    ports.session.setMode(COMMAND_MODE);
    const queue = [...effects];

    for (let effect = queue.shift(); effect; effect = queue.shift()) {
      const outcome = dispatch(effect.type, effect, { ports, rest: [...queue] });
      if (outcome === 'stop') return;
      // Awaiting a plain value would still yield a tick, so only real promises are awaited.
      if (outcome !== 'continue') queue.unshift(...(await outcome));
    }
  }

  return { apply };
}
