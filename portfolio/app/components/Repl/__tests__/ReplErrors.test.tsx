import '@testing-library/jest-dom';

import { AnimationProvider } from '@app/contexts/AnimationContext';
import { EventBusProvider } from '@app/contexts/EventBusContext';
import { HistoryProvider } from '@app/contexts/HistoryContext';
import { SessionProvider } from '@app/contexts/SessionContext';
import { GUIDANCE_LINE } from '@app/terminal';
import { chatClient } from '@lib/api';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';

import { CHAT_ERROR_MESSAGE } from '../constants';
import Repl from '../Repl';

jest.mock('@lib/api', () => ({
  chatClient: { post: jest.fn() },
}));

jest.mock('@lib/storage', () => ({
  ...jest.requireActual('@lib/storage'),
  storage: { load: jest.fn(() => []), append: jest.fn(), clear: jest.fn() },
  sessionStore: { loadValue: jest.fn(() => null), save: jest.fn(), clear: jest.fn() },
}));

const mockedPost = chatClient.post as jest.Mock;

// Answers the startup's identify question first, so the next line reaches the chat.
async function submitCommand(command: string) {
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
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Input Prompt'), 'tester{enter}');
  await screen.findByText(GUIDANCE_LINE);
  await user.type(screen.getByLabelText('Input Prompt'), `${command}{enter}`);
}

describe('Repl chat failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows a reply when the request succeeds', async () => {
    mockedPost.mockResolvedValue({ data: [{ output: 'hi there' }] });
    await submitCommand('hello');

    expect(await screen.findByText('hi there')).toBeInTheDocument();
    expect(screen.queryByText(CHAT_ERROR_MESSAGE)).not.toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledWith('webhooks', { chatInput: 'hello' });
  });

  test.each([
    [
      'a network error',
      () => mockedPost.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK')),
    ],
    [
      'a reply that fails validation',
      () => mockedPost.mockResolvedValue({ data: { unexpected: true } }),
    ],
  ])('shows an error item on %s', async (_case, arrange) => {
    arrange();
    await submitCommand('hello');

    expect(await screen.findByText(CHAT_ERROR_MESSAGE)).toBeInTheDocument();
  });
});
