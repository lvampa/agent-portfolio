import { INTERRUPT_MARK, QUESTION_IDS } from '../constants';
import { interrupt } from '../interrupt';
import type { InputState, InterruptContext, Mode } from '../types';
import { ask, cancelChat, echoInterrupted, printText, stopReveal } from '../utils';

const commandMode: Mode = { type: 'command' };
const parked = [printText('guidance'), printText('')];
const awaitingIdentify: Mode = {
  type: 'awaiting',
  questionId: QUESTION_IDS.IDENTIFY,
  then: parked,
};

function context(overrides: Partial<InterruptContext> = {}): InterruptContext {
  return { line: 'half typed', prompt: 'C:\\Users\\unknown>', mode: commandMode, ...overrides };
}

const interruptMark = printText(INTERRUPT_MARK);

describe('interrupt', () => {
  test('does nothing while starting', () => {
    expect(interrupt('starting', context())).toEqual([]);
  });

  test('cancels the chat while busy, then prints ^C', () => {
    expect(interrupt('busy', context())).toEqual([cancelChat(), interruptMark, printText('')]);
  });

  test('stops the reveal, then prints ^C', () => {
    expect(interrupt('revealing', context())).toEqual([stopReveal(), interruptMark, printText('')]);
  });

  test('asks the startup question again when it was still pending while revealing', () => {
    expect(interrupt('revealing', context({ mode: awaitingIdentify }))).toEqual([
      stopReveal(),
      interruptMark,
      printText(''),
      ask(QUESTION_IDS.IDENTIFY, undefined),
      ...parked,
    ]);
  });

  test('dismisses a question by printing ^C and running what was parked after it', () => {
    expect(interrupt('awaiting', context({ mode: awaitingIdentify }))).toEqual([
      interruptMark,
      ...parked,
    ]);
  });

  test('ends a dismissed question with a blank line when nothing parked does', () => {
    const mode: Mode = { ...awaitingIdentify, then: [] };

    expect(interrupt('awaiting', context({ mode }))).toEqual([interruptMark, printText('')]);
  });

  test('echoes the typed line marked as interrupted when idle, and sends nothing', () => {
    expect(interrupt('idle', context())).toEqual([
      echoInterrupted('half typed', 'C:\\Users\\unknown>'),
    ]);
  });

  test('covers every input state', () => {
    const states: InputState[] = ['starting', 'busy', 'revealing', 'awaiting', 'idle'];

    states.forEach((inputState) => expect(() => interrupt(inputState, context())).not.toThrow());
  });
});
