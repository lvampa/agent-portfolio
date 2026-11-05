import { createEventBus } from '../eventBus';
import type { CallbackFn } from '../types';

describe('createEventBus', () => {
  let bus: ReturnType<typeof createEventBus<Record<string, unknown>>>;

  beforeEach(() => {
    bus = createEventBus();
  });

  test('registers the same handler only once, and its unregister still works', () => {
    const handler = jest.fn();
    bus.on('submit', handler);
    const unregister = bus.on('submit', handler);

    bus.emit('submit', {});
    unregister();
    bus.emit('submit', {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('a handler removed during an emit still runs for that emit', () => {
    const second: CallbackFn = jest.fn();
    const first: CallbackFn = jest.fn(() => bus.off('submit', second));
    bus.on('submit', first);
    bus.on('submit', second);

    bus.emit('submit', {});

    expect(second).toHaveBeenCalledTimes(1);
  });
});
