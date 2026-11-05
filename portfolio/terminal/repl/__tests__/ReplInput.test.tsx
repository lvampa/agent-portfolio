import '@testing-library/jest-dom';

import { EVENTS } from '@terminal/repl/constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';

import { InputForm } from '../InputForm';

const emit = jest.fn();
const PROMPT = 'C:\\Users\\unknown>';
const LABEL = 'Command or question';

function renderInput(props: Partial<React.ComponentProps<typeof InputForm>> = {}) {
  render(<InputForm isActive isAnswering={false} prompt={PROMPT} label={LABEL} {...props} />);
  return screen.getByLabelText(LABEL);
}

jest.mock('@terminal/repl/EventBusContext', () => ({
  useEventBus: () => ({ emit }),
}));

describe('ReplInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Given the input is active', () => {
    test('Then it focuses the prompt on first render', () => {
      const input = renderInput();
      expect(input).toHaveFocus();
    });

    test('When the user types, Then the drawn caret follows the text', async () => {
      const input = renderInput();
      const user = userEvent.setup();

      await user.type(input, 'abc');

      expect(screen.getByTestId('caret').style.left).toBe('calc(3ch - 0px)');
    });

    test('When the user moves left, Then the drawn caret moves with the cursor', async () => {
      const input = renderInput();
      const user = userEvent.setup();

      await user.type(input, 'abc{ArrowLeft}{ArrowLeft}');

      expect(screen.getByTestId('caret').style.left).toBe('calc(1ch - 0px)');
    });

    test('When the user clicks elsewhere, Then focus returns to the prompt', async () => {
      const input = renderInput();
      const user = userEvent.setup();

      await user.click(document.body);
      expect(input).toHaveFocus();
    });

    test('When the user submits text, Then it emits a submit event and clears the input', async () => {
      const input = renderInput();
      const user = userEvent.setup();

      await user.type(input, 'hello{enter}');

      expect(emit).toHaveBeenCalledWith(EVENTS.SUBMIT, 'hello');
      expect(input).toHaveValue('');
    });

    test('When the user presses up, Then the last command comes back, and down clears it', async () => {
      const input = renderInput();
      const user = userEvent.setup();

      await user.type(input, 'help{enter}{ArrowUp}');
      expect(input).toHaveValue('help');

      await user.type(input, '{ArrowDown}');
      expect(input).toHaveValue('');
    });

    test('When the user answers a question, Then up does not recall the answer', async () => {
      const input = renderInput({ isAnswering: true });
      const user = userEvent.setup();

      await user.type(input, 'connor{enter}{ArrowUp}');
      expect(input).toHaveValue('');
    });
  });

  describe('Given the input is not active', () => {
    test('Then it is hidden but keeps focus, buffers typing, and holds Enter', async () => {
      const input = renderInput({ isActive: false });
      const user = userEvent.setup();

      await user.type(input, 'help{enter}');

      expect(input).not.toBeVisible();
      expect(input).toHaveFocus();
      expect(input).toHaveValue('help');
      expect(emit).not.toHaveBeenCalled();
      expect(screen.queryByTestId('caret')).not.toBeInTheDocument();
    });
  });
});
