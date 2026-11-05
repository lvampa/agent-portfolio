import '@testing-library/jest-dom';

import { EVENTS } from '@terminal/repl/constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InputForm } from '../InputForm';

const emit = jest.fn();
const PROMPT = 'C:\\Users\\unknown >';

jest.mock('@terminal/repl/EventBusContext', () => ({
  useEventBus: () => ({ emit }),
}));

describe('ReplInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Given the input is visible', () => {
    test('Then it focuses the prompt on first render', () => {
      render(<InputForm isVisible={true} prompt={PROMPT} />);

      const input = screen.getByLabelText('Input Prompt');
      expect(input).toHaveFocus();
    });

    test('When the user clicks elsewhere, Then focus returns to the prompt', async () => {
      render(<InputForm isVisible={true} prompt={PROMPT} />);
      const user = userEvent.setup();
      const input = screen.getByLabelText('Input Prompt');

      await user.click(document.body);
      expect(input).toHaveFocus();
    });

    test('When the user submits text, Then it emits a submit event and clears the input', async () => {
      render(<InputForm isVisible={true} prompt={PROMPT} />);
      const user = userEvent.setup();
      const input = screen.getByLabelText('Input Prompt');

      await user.type(input, 'hello{enter}');

      expect(emit).toHaveBeenCalledWith(EVENTS.SUBMIT, 'hello');
      expect(input).toHaveValue('');
    });
  });

  describe('Given the input is not visible', () => {
    test('Then it does not render the prompt', () => {
      render(<InputForm isVisible={false} prompt={PROMPT} />);
      expect(screen.queryByLabelText('Input Prompt')).not.toBeInTheDocument();
    });
  });
});
