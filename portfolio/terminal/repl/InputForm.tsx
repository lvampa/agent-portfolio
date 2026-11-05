import { CommandPrompt } from '@components/ui/command-prompt';
import { Input } from '@components/ui/input';
import { HISTORY_ITEM_TYPES } from '@terminal/history';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import React, { useEffect, useRef, useState } from 'react';

export function InputForm({ isVisible }: { isVisible: boolean }) {
  const eventBus = useEventBus();
  const [value, setValue] = useState('');
  const inputElementRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOnPage() {
      inputElementRef.current?.focus();
    }
    document.addEventListener('click', handleClickOnPage);
    return () => document.removeEventListener('click', handleClickOnPage);
  }, []);

  if (!isVisible) {
    return;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValue('');

    eventBus.emit(EVENTS.SUBMIT, { value, type: HISTORY_ITEM_TYPES.COMMAND });
  }

  return (
    <form onSubmit={handleSubmit}>
      <CommandPrompt>
        <label htmlFor="input-prompt" className="sr-only">
          Input Prompt
        </label>
        <Input
          id="input-prompt"
          ref={inputElementRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="off"
        />
      </CommandPrompt>
    </form>
  );
}
