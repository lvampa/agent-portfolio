import '@testing-library/jest-dom';

import { AnimationProvider } from '@terminal/AnimationContext';
import { BANNER_LINES, GUIDANCE_LINE, QUESTION_IDS } from '@terminal/constants';
import { HistoryProvider } from '@terminal/history/HistoryContext';
import { EventBusProvider } from '@terminal/repl/EventBusContext';
import { SessionProvider } from '@terminal/SessionContext';
import { historyStore, sessionStore } from '@terminal/storage';
import type { Session } from '@terminal/types';
import { printText } from '@terminal/utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Repl from '../Repl';

jest.mock('@lib/api', () => ({
  chatClient: { post: jest.fn() },
}));

jest.mock('@terminal/storage', () => ({
  historyStore: { load: jest.fn(), append: jest.fn(), clear: jest.fn() },
  sessionStore: { loadValue: jest.fn(), save: jest.fn() },
}));

const mockedLoadHistory = historyStore.load as jest.Mock;
const mockedLoadSession = sessionStore.loadValue as jest.Mock;

const IDENTIFY_PROMPT = 'Please Identify:';
const EARLIER_LINE = 'an earlier line';

function renderRepl() {
  render(
    <EventBusProvider>
      <HistoryProvider>
        <SessionProvider>
          <AnimationProvider>
            <Repl clientInfo={null} isClientInfoLoading={false} />
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

    await user.type(screen.getByLabelText('Input Prompt'), 'tester{enter}');

    expect(await screen.findByText(GUIDANCE_LINE)).toBeInTheDocument();
    expect(screen.getByText('C:\\Users\\tester >')).toBeInTheDocument();
  });

  test('restored history skips the startup', async () => {
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
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
        then: [printText(GUIDANCE_LINE)],
      },
    };
    mockedLoadHistory.mockReturnValue([{ type: 'text', text: EARLIER_LINE }]);
    mockedLoadSession.mockReturnValue(awaiting);
    renderRepl();
    const user = userEvent.setup();

    expect(await screen.findByText(IDENTIFY_PROMPT)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Input Prompt'), 'tester{enter}');

    expect(await screen.findByText(GUIDANCE_LINE)).toBeInTheDocument();
  });
});
