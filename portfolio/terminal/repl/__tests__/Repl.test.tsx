import '@testing-library/jest-dom';

import { chatClient } from '@lib/api';
import { AnimationProvider } from '@terminal/AnimationContext';
import {
  BANNER_LINES,
  COMMAND_INPUT_LABEL,
  GUIDANCE_LINE,
  QUESTION_IDS,
} from '@terminal/constants';
import { HistoryProvider } from '@terminal/history/HistoryContext';
import { identify } from '@terminal/questions';
import { EventBusProvider } from '@terminal/repl/EventBusContext';
import { SessionProvider } from '@terminal/SessionContext';
import { historyStore, sessionStore } from '@terminal/storage';
import type { Session } from '@terminal/types';
import { printText } from '@terminal/utils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Repl from '../Repl';

jest.mock('@lib/api', () => ({
  chatClient: { post: jest.fn() },
}));

jest.mock('@terminal/storage', () => ({
  ...jest.requireActual('@terminal/storage'),
  historyStore: { load: jest.fn(), append: jest.fn(), clear: jest.fn() },
  sessionStore: { loadValue: jest.fn(), save: jest.fn(), clear: jest.fn() },
}));

// jsdom does no layout, so it has no scrollIntoView.
Element.prototype.scrollIntoView = jest.fn();

const mockedPost = chatClient.post as jest.Mock;
const mockedLoadHistory = historyStore.load as jest.Mock;
const mockedLoadSession = sessionStore.loadValue as jest.Mock;
const mockedClearHistory = historyStore.clear as jest.Mock;
const mockedClearSession = sessionStore.clear as jest.Mock;

const VISITOR = {
  city: 'Seattle',
  country: 'US',
  organization: 'Acme ISP',
  browser: 'Chrome 120.0',
  os: 'Mac OS 14',
  device: 'desktop',
  referer: 'Direct',
  botRisk: 'low',
};
const SESSION_ID = '00000000-0000-4000-8000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const IDENTIFY_PROMPT = 'User unknown, please identify:';
const EARLIER_LINE = 'an earlier line';

// NODE_ENV is typed read-only, so tests write it through a widened view of process.env.
function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function renderRepl() {
  render(
    <EventBusProvider>
      <HistoryProvider>
        <SessionProvider>
          <AnimationProvider>
            <Repl clientInfo={null} isClientInfoLoading={false} visitor={VISITOR} />
          </AnimationProvider>
        </SessionProvider>
      </HistoryProvider>
    </EventBusProvider>,
  );
}

describe('Repl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadHistory.mockReturnValue([]);
    mockedLoadSession.mockReturnValue(null);
  });

  test('a first visit asks for a name, then prints the guidance', async () => {
    renderRepl();
    const user = userEvent.setup();

    expect(await screen.findByText(IDENTIFY_PROMPT)).toBeInTheDocument();
    expect(screen.getByText(BANNER_LINES[0])).toBeInTheDocument();
    expect(screen.queryByText(GUIDANCE_LINE)).not.toBeInTheDocument();

    // The visible prompt is aria-hidden, so the input's name carries the question.
    const input = screen.getByRole('textbox', { name: identify.label });
    // The question shows as text before the input accepts lines.
    await waitFor(() => expect(input).toBeVisible());
    await user.type(input, 'tester{enter}');

    expect(await screen.findByText(GUIDANCE_LINE)).toBeInTheDocument();
    expect(screen.getByText('C:\\Users\\tester>')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: COMMAND_INPUT_LABEL })).toBeInTheDocument();
  });

  test('typing while a chat is in flight keeps focus and the typed text', async () => {
    mockedPost.mockReturnValue(new Promise(() => {}));
    mockedLoadSession.mockReturnValue({ name: 'tester', mode: { type: 'command' } });
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    renderRepl();
    const user = userEvent.setup();
    const input = await screen.findByRole('textbox', { name: COMMAND_INPUT_LABEL });

    await user.type(input, 'tell me about him{enter}');
    await user.type(input, 'next{enter}');

    expect(input).not.toBeVisible();
    expect(input).toHaveFocus();
    expect(input).toHaveValue('next');
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  test('Enter during a chat submits the buffered line once the reply lands', async () => {
    let replyToFirst: (body: { output: string }[]) => void = () => {};
    mockedPost
      .mockReturnValueOnce(new Promise((resolve) => (replyToFirst = resolve)))
      .mockResolvedValueOnce([{ output: 'second reply' }]);
    mockedLoadSession.mockReturnValue({ name: 'tester', mode: { type: 'command' } });
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    renderRepl();
    const user = userEvent.setup();
    const input = await screen.findByRole('textbox', { name: COMMAND_INPUT_LABEL });

    await user.type(input, 'first{enter}');
    await user.type(input, 'second{enter}');
    expect(mockedPost).toHaveBeenCalledTimes(1);

    replyToFirst([{ output: 'first reply' }]);

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(2));
    expect(mockedPost).toHaveBeenLastCalledWith(
      'webhooks',
      expect.objectContaining({ chatInput: 'second' }),
    );
  });

  test('a chat sends the session id, name, and visitor', async () => {
    mockedPost.mockResolvedValue([{ output: 'reply' }]);
    mockedLoadSession.mockReturnValue({
      name: 'tester',
      mode: { type: 'command' },
      sessionId: SESSION_ID,
    });
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    renderRepl();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText(COMMAND_INPUT_LABEL), 'hi{enter}');

    // toEqual on the whole body, so any extra field fails the test.
    expect(mockedPost).toHaveBeenCalledWith('webhooks', {
      chatInput: 'hi',
      sessionId: SESSION_ID,
      name: 'tester',
      client: VISITOR,
    });
  });

  test('cls starts a new conversation with a new session id', async () => {
    mockedPost.mockResolvedValue([{ output: 'reply' }]);
    mockedLoadSession.mockReturnValue({
      name: 'tester',
      mode: { type: 'command' },
      sessionId: SESSION_ID,
    });
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    renderRepl();
    const user = userEvent.setup();
    const input = await screen.findByLabelText(COMMAND_INPUT_LABEL);

    await user.type(input, 'cls{enter}');
    await user.type(input, 'hi{enter}');

    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    const { sessionId } = mockedPost.mock.calls[0][1];
    expect(sessionId).toMatch(UUID);
    expect(sessionId).not.toBe(SESSION_ID);
  });

  test('restored history skips the startup and is inside the log when it mounts', async () => {
    let logBeforeLoad: HTMLElement | null = null;
    mockedLoadHistory.mockImplementation(() => {
      logBeforeLoad = screen.queryByRole('log');
      return [{ type: 'text', text: EARLIER_LINE }];
    });
    mockedLoadSession.mockReturnValue({ name: 'tester', mode: { type: 'command' } });
    renderRepl();

    expect(await screen.findByLabelText(COMMAND_INPUT_LABEL)).toBeVisible();
    expect(logBeforeLoad).toBeNull();
    expect(screen.getByRole('log')).toHaveTextContent(EARLIER_LINE);
    expect(screen.queryByText(BANNER_LINES[0])).not.toBeInTheDocument();
  });

  test('restored client info shows in full at once and does not hold back the prompt', async () => {
    mockedLoadHistory.mockReturnValue([
      {
        type: 'clientInfo',
        info: [{ label: 'ip', value: '127.0.0.1' }],
        prompt: 'C:\\Users\\unknown>',
      },
    ]);
    mockedLoadSession.mockReturnValue({ name: 'tester', mode: { type: 'command' } });
    renderRepl();

    await screen.findByRole('log');

    expect(screen.getByLabelText(COMMAND_INPUT_LABEL)).toBeVisible();
    // An animating line starts with only its screen-reader copy filled in.
    expect(screen.getByText('127.0.0.1')).not.toHaveClass('sr-only');
  });

  test('NEXT_PUBLIC_NO_HISTORY clears both stores and replays the startup in development', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_NO_HISTORY = 'true';
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    mockedLoadSession.mockReturnValue({ name: 'tester', mode: { type: 'command' } });
    try {
      renderRepl();

      expect(await screen.findByText(IDENTIFY_PROMPT)).toBeInTheDocument();
      expect(screen.queryByText(EARLIER_LINE)).not.toBeInTheDocument();
      expect(mockedClearHistory).toHaveBeenCalled();
      expect(mockedClearSession).toHaveBeenCalled();
    } finally {
      delete process.env.NEXT_PUBLIC_NO_HISTORY;
      setNodeEnv(originalNodeEnv);
    }
  });

  test('a reload during a question asks it again and keeps what comes after', async () => {
    const awaiting: Session = {
      name: null,
      sessionId: SESSION_ID,
      mode: {
        type: 'awaiting',
        questionId: QUESTION_IDS.IDENTIFY,
        then: [printText(GUIDANCE_LINE)],
      },
    };
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    mockedLoadSession.mockReturnValue(awaiting);
    renderRepl();
    const user = userEvent.setup();

    expect(await screen.findByText(IDENTIFY_PROMPT)).toBeInTheDocument();
    const input = screen.getByLabelText(identify.label);
    await waitFor(() => expect(input).toBeVisible());
    await user.type(input, 'tester{enter}');

    expect(await screen.findByText(GUIDANCE_LINE)).toBeInTheDocument();
  });
});
