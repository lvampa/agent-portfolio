import '@testing-library/jest-dom';

import { HISTORY_ITEM_TYPES } from '@app/components/History';
import { AnimationProvider } from '@app/contexts/AnimationContext';
import { EventBusProvider } from '@app/contexts/EventBusContext';
import { HistoryProvider } from '@app/contexts/HistoryContext';
import { SessionProvider } from '@app/contexts/SessionContext';
import { BANNER_LINES, GUIDANCE_LINE, printLine, QUESTION_IDS, type Session } from '@app/terminal';
import { sessionStore, storage } from '@lib/storage';
import type { UserInfo } from '@lib/utils/types';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Repl from '../Repl';

jest.mock('@lib/api', () => ({
  chatClient: { post: jest.fn() },
}));

jest.mock('@lib/storage', () => ({
  ...jest.requireActual('@lib/storage'),
  storage: { load: jest.fn(), append: jest.fn(), clear: jest.fn() },
  sessionStore: { loadValue: jest.fn(), save: jest.fn(), clear: jest.fn() },
}));

const mockedLoadHistory = storage.load as jest.Mock;
const mockedLoadSession = sessionStore.loadValue as jest.Mock;

const IDENTIFY_PROMPT = 'Please Identify:';
const EARLIER_LINE = 'an earlier line';

function renderRepl(clientInfo: UserInfo | null = null) {
  render(
    <EventBusProvider>
      <HistoryProvider>
        <SessionProvider>
          <AnimationProvider>
            <Repl clientInfo={clientInfo} isClientInfoLoading={false} />
          </AnimationProvider>
        </SessionProvider>
      </HistoryProvider>
    </EventBusProvider>,
  );
}

// Typing starts new timers on each render, so time moves in steps that let React commit between them.
async function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 50) {
    await act(async () => {
      jest.advanceTimersByTime(50);
    });
  }
}

describe('Repl sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadHistory.mockReturnValue([]);
    mockedLoadSession.mockReturnValue(null);
  });

  test('a first visit asks for a name, then prints the rest of the startup', async () => {
    renderRepl();
    const user = userEvent.setup();

    expect(await screen.findByText(IDENTIFY_PROMPT)).toBeInTheDocument();
    expect(screen.queryByText(GUIDANCE_LINE)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Input Prompt'), 'tester{enter}');

    expect(await screen.findByText(GUIDANCE_LINE)).toBeInTheDocument();
    expect(screen.getByText('C:\\Users\\tester >')).toBeInTheDocument();
  });

  test('restored history skips the startup', async () => {
    mockedLoadHistory.mockReturnValue([{ type: HISTORY_ITEM_TYPES.OUTPUT, value: EARLIER_LINE }]);
    mockedLoadSession.mockReturnValue({ name: 'tester', mode: { type: 'command' } });
    renderRepl();

    expect(await screen.findByLabelText('Input Prompt')).toBeInTheDocument();
    expect(screen.getByText(EARLIER_LINE)).toBeInTheDocument();
    expect(screen.queryByText(BANNER_LINES[0])).not.toBeInTheDocument();
  });

  test('a reload during a question asks it again and keeps what comes after', async () => {
    const awaiting: Session = {
      name: null,
      mode: {
        type: 'awaiting',
        questionId: QUESTION_IDS.IDENTIFY,
        then: [printLine(GUIDANCE_LINE)],
      },
    };
    mockedLoadHistory.mockReturnValue([{ type: HISTORY_ITEM_TYPES.OUTPUT, value: EARLIER_LINE }]);
    mockedLoadSession.mockReturnValue(awaiting);
    renderRepl();
    const user = userEvent.setup();

    expect(await screen.findByText(IDENTIFY_PROMPT)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Input Prompt'), 'tester{enter}');

    expect(await screen.findByText(GUIDANCE_LINE)).toBeInTheDocument();
  });

  describe('with client info typing', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('the prompt stays hidden until the typing ends', async () => {
      renderRepl([{ label: 'ip', value: '127.0.0.1' }]);

      await advance(1000);
      expect(screen.queryByLabelText('Input Prompt')).not.toBeInTheDocument();

      await advance(10_000);
      expect(screen.getByLabelText('Input Prompt')).toBeInTheDocument();
    });
  });
});
