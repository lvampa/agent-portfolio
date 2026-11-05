import '@testing-library/jest-dom';

import { AnimationProvider } from '@app/contexts/AnimationContext';
import { EventBusProvider } from '@app/contexts/EventBusContext';
import { HistoryProvider } from '@app/contexts/HistoryContext';
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
  storage: { load: jest.fn(() => []), append: jest.fn() },
}));

const mockedPost = chatClient.post as jest.Mock;

async function submitCommand(command: string) {
  render(
    <EventBusProvider>
      <HistoryProvider>
        <AnimationProvider>
          <Repl isReady />
        </AnimationProvider>
      </HistoryProvider>
    </EventBusProvider>,
  );
  const user = userEvent.setup();
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
  });

  test('shows an error item on a network error', async () => {
    mockedPost.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    await submitCommand('hello');

    expect(await screen.findByText(CHAT_ERROR_MESSAGE)).toBeInTheDocument();
  });

  test('shows an error item on a timeout', async () => {
    mockedPost.mockRejectedValue(new AxiosError('timeout of 30000ms exceeded', 'ECONNABORTED'));
    await submitCommand('hello');

    expect(await screen.findByText(CHAT_ERROR_MESSAGE)).toBeInTheDocument();
  });

  test('shows an error item when the reply fails validation', async () => {
    mockedPost.mockResolvedValue({ data: { unexpected: true } });
    await submitCommand('hello');

    expect(await screen.findByText(CHAT_ERROR_MESSAGE)).toBeInTheDocument();
  });
});
