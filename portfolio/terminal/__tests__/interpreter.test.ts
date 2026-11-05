import { CHAT_ERROR_MESSAGE, QUESTION_IDS } from '../constants';
import { createInterpreter } from '../interpreter';
import type { Ports } from '../ports';
import type { ChatReply } from '../types';
import { ask, chat, clearScreen, printText, setName } from '../utils';

function fakePorts(reply: ChatReply[] | null = []) {
  const calls: string[] = [];
  const ports: Ports = {
    history: {
      append: jest.fn((item) => calls.push(`append ${JSON.stringify(item)}`)),
      clear: jest.fn(() => calls.push('clear')),
    },
    session: {
      setName: jest.fn((name) => calls.push(`setName ${name}`)),
      setMode: jest.fn((mode) => calls.push(`setMode ${mode.type}`)),
      newConversation: jest.fn(() => calls.push('newConversation')),
    },
    chat: { send: jest.fn(async () => reply) },
  };
  return { ports, calls };
}

describe('createInterpreter', () => {
  test('applies effects in order, starting in command mode', async () => {
    const { ports, calls } = fakePorts();
    await createInterpreter(ports).apply([printText('a'), clearScreen(), setName('connor')]);

    expect(calls).toEqual([
      'setMode command',
      `append ${JSON.stringify({ type: 'text', text: 'a' })}`,
      'clear',
      'setName connor',
    ]);
  });

  test('an ask parks the rest in then and stops', async () => {
    const { ports } = fakePorts();
    const rest = [printText('after'), chat('hi')];
    await createInterpreter(ports).apply([ask(QUESTION_IDS.IDENTIFY), ...rest]);

    expect(ports.session.setMode).toHaveBeenLastCalledWith({
      type: 'awaiting',
      questionId: QUESTION_IDS.IDENTIFY,
      then: rest,
    });
    expect(ports.history.append).not.toHaveBeenCalled();
    expect(ports.chat.send).not.toHaveBeenCalled();
  });

  test('a failed chat appends an error item', async () => {
    const { ports } = fakePorts(null);
    await createInterpreter(ports).apply([chat('hi')]);

    expect(ports.history.append).toHaveBeenCalledWith({ type: 'error', text: CHAT_ERROR_MESSAGE });
  });
});
