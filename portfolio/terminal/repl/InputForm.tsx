import { CommandPrompt } from '@components/ui/command-prompt';
import { Input } from '@components/ui/input';
import { EVENTS } from '@terminal/repl/constants';
import { useEventBus } from '@terminal/repl/EventBusContext';
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';

interface InputFormProps {
  /** False while lines type or a chat is in flight. The input stays mounted and focused, so typing buffers. */
  isActive: boolean;
  /** An answer to a question is not recalled with the up arrow. */
  isAnswering: boolean;
  prompt: string;
  label: string;
}

export function InputForm({ isActive, isAnswering, prompt, label }: InputFormProps) {
  const eventBus = useEventBus();
  const [value, setValue] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [hasPendingSubmit, setHasPendingSubmit] = useState(false);
  const inputElementRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caret, setCaret] = useState({ index: 0, scrollLeft: 0 });

  useEffect(() => {
    function handleClickOnPage() {
      // Refocusing would collapse the selection, so a visitor selecting text to copy keeps it.
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      inputElementRef.current?.focus();
    }
    document.addEventListener('click', handleClickOnPage);
    return () => document.removeEventListener('click', handleClickOnPage);
  }, []);

  function syncCaret() {
    const input = inputElementRef.current;
    if (!input) return;
    const caretIndex =
      input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;
    setCaret({ index: caretIndex ?? input.value.length, scrollLeft: input.scrollLeft });
  }

  function replaceValue(next: string) {
    setValue(next);
    setCaret({ index: next.length, scrollLeft: 0 });
    // The input scrolls to the new text only after the commit, so the drawn caret syncs a frame later.
    requestAnimationFrame(syncCaret);
  }

  function submit() {
    if (!isAnswering && value.trim()) setLastCommand(value);
    replaceValue('');
    eventBus.emit(EVENTS.SUBMIT, value);
  }

  // An effect event sees the latest value and mode when the pending line finally goes out.
  const submitPending = useEffectEvent(() => {
    setHasPendingSubmit(false);
    submit();
  });

  useEffect(() => {
    if (isActive && hasPendingSubmit) submitPending();
  }, [isActive, hasPendingSubmit]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp' && lastCommand !== null) {
      e.preventDefault();
      replaceValue(lastCommand);
    } else if (e.key === 'ArrowDown' && value === lastCommand) {
      // Only a recalled command goes away, so a typed draft is never lost.
      e.preventDefault();
      replaceValue('');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      replaceValue('');
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Like cmd, Enter while busy keeps the line and submits it once the terminal is ready again.
    if (isActive) submit();
    else setHasPendingSubmit(true);
  }

  return (
    // Opacity, not display or visibility, because those would drop focus and lose type-ahead.
    <form onSubmit={handleSubmit} style={{ opacity: isActive ? 1 : 0 }}>
      {/* The input is already focused, so its new label is not announced. This speaks the question once it goes live. */}
      <p role="status" className="sr-only">
        {isActive && isAnswering ? label : ''}
      </p>
      <CommandPrompt prompt={prompt}>
        <label htmlFor="input-prompt" className="sr-only">
          {label}
        </label>
        {/* The native caret can't be made thicker, so it is hidden and drawn. The DOS font is monospace, so 1ch is one character. */}
        <div className="relative min-w-[12ch] flex-1 text-base">
          <Input
            id="input-prompt"
            ref={inputElementRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              syncCaret();
            }}
            onKeyDown={handleKeyDown}
            onSelect={syncCaret}
            onScroll={syncCaret}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
            autoComplete="off"
            aria-disabled={!isActive}
          />
          {isFocused && isActive && (
            <span
              aria-hidden
              data-testid="caret"
              className="bg-terminal animate-caret-blink pointer-events-none absolute top-1/2 h-[1.1em] w-2 -translate-y-1/2 motion-reduce:animate-none"
              style={{ left: `calc(${caret.index}ch - ${caret.scrollLeft}px)` }}
            />
          )}
        </div>
      </CommandPrompt>
    </form>
  );
}
