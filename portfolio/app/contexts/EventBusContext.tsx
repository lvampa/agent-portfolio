'use client';

import { type EventMap } from '@app/types/events';
import { createEventBus } from '@lib/event-bus';
import React, { createContext, useContext, useState } from 'react';

type EventBusInstance = ReturnType<typeof createEventBus<EventMap>>;

const EventBusContext = createContext<EventBusInstance | null>(null);

export function EventBusProvider({ children }: { children: React.ReactNode }) {
  const [bus] = useState<EventBusInstance>(() => createEventBus<EventMap>());

  return <EventBusContext.Provider value={bus}>{children}</EventBusContext.Provider>;
}

export function useEventBus(): EventBusInstance {
  const ctx = useContext(EventBusContext);
  if (!ctx) throw new Error('useEventBus must be used within EventBusProvider');
  return ctx;
}
