import { CommandPrompt } from '@components/ui/command-prompt';
import { Input } from '@components/ui/input';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import React, { useEffect, useRef, useState } from 'react';

export function InputForm({ isVisible, prompt }: { isVisible: boolean; prompt: string }) {
  const eventBus = useEventBus();
  const [value, setValue] = useState('');
  const inputElementRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caret, setCaret] = useState({ index: 0, scrollLeft: 0 });

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

  function syncCaret() {
    const input = inputElementRef.current;
    if (!input) return;
    setCaret({ index: input.selectionStart ?? input.value.length, scrollLeft: input.scrollLeft });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValue('');
    setCaret({ index: 0, scrollLeft: 0 });

    eventBus.emit(EVENTS.SUBMIT, value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <CommandPrompt prompt={prompt}>
        <label htmlFor="input-prompt" className="sr-only">
          Input Prompt
        </label>
        {/* The native caret can't be made thicker, so it is hidden and drawn. The DOS font is monospace, so 1ch is one character. */}
        <div className="relative w-full min-w-0 text-base">
          <Input
            id="input-prompt"
            ref={inputElementRef}
            className="caret-transparent"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              syncCaret();
            }}
            onSelect={syncCaret}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            autoComplete="off"
          />
          {isFocused && (
            <span
              aria-hidden
              data-testid="caret"
              className="bg-terminal animate-caret-blink pointer-events-none absolute top-1/2 h-[1.1em] w-2 -translate-y-1/2"
              style={{ left: `calc(${caret.index}ch - ${caret.scrollLeft}px)` }}
            />
          )}
        </div>
      </CommandPrompt>
    </form>
  );
}
