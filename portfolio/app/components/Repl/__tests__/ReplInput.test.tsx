import '@testing-library/jest-dom';

import { HISTORY_ITEM_TYPES } from '@app/components/History';
import { EVENTS } from '@app/constants/events';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InputForm } from '../InputForm';

const emit = jest.fn();

jest.mock('@app/contexts/EventBusContext', () => ({
  useEventBus: () => ({ emit }),
}));

describe('ReplInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Given the input is visible', () => {
    test('Then it focuses the prompt on first render', () => {
      render(<InputForm isVisible={true} />);

      const input = screen.getByLabelText('Input Prompt');
      expect(input).toHaveFocus();
    });

    test('When the user clicks elsewhere, Then focus returns to the prompt', async () => {
      render(<InputForm isVisible={true} />);
      const user = userEvent.setup();
      const input = screen.getByLabelText('Input Prompt');

      await user.click(document.body);
      expect(input).toHaveFocus();
    });

    test('When the user submits text, Then it emits a submit event and clears the input', async () => {
      render(<InputForm isVisible={true} />);
      const user = userEvent.setup();
      const input = screen.getByLabelText('Input Prompt');

      await user.type(input, 'hello{enter}');

      expect(emit).toHaveBeenCalledWith(EVENTS.SUBMIT, {
        value: 'hello',
        type: HISTORY_ITEM_TYPES.COMMAND,
      });
      expect(input).toHaveValue('');
    });
  });

  describe('Given the input is not visible', () => {
    test('Then it does not render the prompt', () => {
      render(<InputForm isVisible={false} />);
      expect(screen.queryByLabelText('Input Prompt')).not.toBeInTheDocument();
    });
  });
});
