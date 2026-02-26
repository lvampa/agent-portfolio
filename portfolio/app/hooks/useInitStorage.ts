'use client';
import { useEffect } from 'react';
import { eventBus } from '@lib/event-bus';
import { EVENTS } from '@app/constants/events';
import { storage } from '@lib/storage';
import { HistoryItem } from '@app/components/History';

export function useInitStorage() {
  useEffect(() => {
    const history = storage.load<HistoryItem>();

    if (history.length) {
      eventBus.emit(EVENTS.STORAGE_LOAD, history);
    }

    const unregisterSubmit = eventBus.on(EVENTS.SUBMIT, (item: HistoryItem) => {
      storage.append(item);
    });
    const unregisterResult = eventBus.on(EVENTS.CHAT_RESULT, (item: HistoryItem) => {
      storage.append(item);
    });

    return () => {
      unregisterSubmit();
      unregisterResult();
    };
  }, []);
}
