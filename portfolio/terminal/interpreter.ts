import { CHAT_ERROR_MESSAGE, COMMAND_MODE } from './constants';
import type { Ports } from './ports';
import type { Effect, EffectContext, EffectHandlers, EffectOf, EffectType } from './types';

const effectHandlers: EffectHandlers = {
  print: ({ item }, { ports }) => {
    ports.history.append(item);
    return 'continue';
  },
  clear: (_effect, { ports }) => {
    ports.history.clear();
    return 'continue';
  },
  setName: ({ name }, { ports }) => {
    ports.session.setName(name);
    return 'continue';
  },
  ask: ({ questionId }, { ports, rest }) => {
    ports.session.setMode({ type: 'awaiting', questionId, then: rest });
    return 'stop';
  },
  chat: async ({ message }, { ports }): Promise<'continue'> => {
    const replies = await ports.chat.send(message);
    if (!replies) {
      ports.history.append({ type: 'error', text: CHAT_ERROR_MESSAGE });
    } else {
      replies.forEach((reply) => ports.history.append({ type: 'message', text: reply.output }));
    }
    return 'continue';
  },
};

function dispatch<K extends EffectType>(type: K, effect: EffectOf<K>, context: EffectContext) {
  const handler = effectHandlers[type];
  return handler(effect, context);
}

/**
 * Each apply starts in command mode, and an ask stops the walk with the rest parked in the mode.
 * Effects before the first chat apply in the same tick, which the startup relies on to land before paint.
 */
export function createInterpreter(ports: Ports): { apply(effects: Effect[]): Promise<void> } {
  async function apply(effects: Effect[]): Promise<void> {
    ports.session.setMode(COMMAND_MODE);

    for (const [index, effect] of effects.entries()) {
      const pending = dispatch(effect.type, effect, { ports, rest: effects.slice(index + 1) });
      // Awaiting a plain value would still yield a tick, so only real promises are awaited.
      const outcome = typeof pending === 'string' ? pending : await pending;
      if (outcome === 'stop') return;
    }
  }

  return { apply };
}
