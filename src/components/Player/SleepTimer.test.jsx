import { act } from 'react';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../../darkTheme';
import { useAudio } from '../../context/AudioContext';
import { render } from '../../test/render';
import SleepTimer from './SleepTimer';

jest.mock('../../context/AudioContext', () => ({ useAudio: jest.fn() }));
let actions;
beforeEach(() => {
  actions = { setSleepTimer: jest.fn(), cancelSleepTimer: jest.fn() };
  useAudio.mockReturnValue({ ...actions, sleepTimerDeadline: null });
});
const mount = () =>
  render(
    <ThemeProvider theme={darkTheme}>
      <SleepTimer />
    </ThemeProvider>,
  );

test('opens a labelled dialog, starts the chosen duration and restores focus', () => {
  const page = mount();
  page.click('[data-sleep-timer]');
  const dialog = page.container.querySelector('dialog');
  expect(dialog.hasAttribute('open')).toBe(true);
  expect(dialog.getAttribute('aria-labelledby')).toBe(page.container.querySelector('h2').id);
  page.click('[data-sleep-minutes="30"]');
  expect(actions.setSleepTimer).toHaveBeenCalledWith(30);
  expect(dialog.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(page.container.querySelector('[data-sleep-timer]'));
});

test('Escape closes without starting a timer and restores focus', () => {
  const page = mount();
  page.click('[data-sleep-timer]');
  const dialog = page.container.querySelector('dialog');
  act(() => dialog.dispatchEvent(new Event('cancel', { cancelable: true })));
  expect(dialog.hasAttribute('open')).toBe(false);
  expect(actions.setSleepTimer).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(page.container.querySelector('[data-sleep-timer]'));
});

test('an active timer exposes cancellation and a countdown without live announcements each second', () => {
  useAudio.mockReturnValue({ ...actions, sleepTimerDeadline: Date.now() + 15 * 60_000 });
  const page = mount();
  expect(page.container.querySelector('[data-sleep-timer]').getAttribute('aria-pressed')).toBe(
    'true',
  );
  page.click('[data-sleep-timer]');
  expect(page.container.querySelector('[role=timer]').getAttribute('aria-live')).toBe('off');
  const cancel = [...page.container.querySelectorAll('button')].find(
    (b) => b.textContent === 'Cancel timer',
  );
  act(() => cancel.click());
  expect(actions.cancelSleepTimer).toHaveBeenCalledTimes(1);
});
