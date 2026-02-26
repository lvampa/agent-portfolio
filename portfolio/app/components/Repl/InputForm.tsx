import { CommandPrompt } from "@/components/ui/command-prompt"
import { Input } from "@/components/ui/input"
import React, { useEffect, useRef, useState } from "react"
import { eventBus } from "@app/event-bus"
import { EVENTS } from "@app/constants/events"
import { HISTORY_ITEM_TYPES } from "@app/components/History"

// TODO - form validation
// @doc - Component emits submit event on form submit.
export function InputForm({isVisible}: {
  isVisible: boolean;
}) {
  const [value, setValue] = useState("")
  const inputElementRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.addEventListener("click", handleClickOnPage);
  }, []);

  if (!isVisible) {
    return;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValue("");

    eventBus.emit(EVENTS.SUBMIT, { value, type: HISTORY_ITEM_TYPES.COMMAND });
  }

  function handleClickOnPage() {
    inputElementRef.current?.focus();
  }

  return (
    <form onSubmit={ handleSubmit }>
      <CommandPrompt>
        <label htmlFor="input-prompt" className="sr-only">Input Prompt</label>
        <Input
          id="input-prompt"
          ref={ inputElementRef }
          value={ value }
          onChange={ (e) => setValue(e.target.value) }
          autoFocus
          autoComplete="off"
        />
      </CommandPrompt>
    </form>
  );
}
