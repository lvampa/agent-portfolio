import { CommandPrompt } from '@components/ui/command-prompt';
import { Input } from '@components/ui/input';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import React, { useEffect, useRef, useState } from 'react';

export function InputForm({ isVisible, prompt }: { isVisible: boolean; prompt: string }) {
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

    eventBus.emit(EVENTS.SUBMIT, value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <CommandPrompt prompt={prompt}>
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
