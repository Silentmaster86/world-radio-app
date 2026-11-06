import { act } from 'react';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../../darkTheme';
import { useAudio } from '../../context/AudioContext';
import { render } from '../../test/render';
import PlayerControls from './PlayerControls';

jest.mock('../../context/AudioContext', () => ({ useAudio: jest.fn() }));
let actions;
beforeEach(() => {
  actions = {
    togglePlay: jest.fn(),
    nextStation: jest.fn(),
    prevStation: jest.fn(),
    changeVolume: jest.fn(),
    toggleMute: jest.fn(),
  };
  useAudio.mockReturnValue({
    ...actions,
    status: 'idle',
    wantsToPlay: false,
    volume: 0.6,
    muted: false,
    canChangeVolume: true,
  });
});
const mount = (props = {}) =>
  render(
    <ThemeProvider theme={darkTheme}>
      <PlayerControls {...props} />
    </ThemeProvider>,
  );

test('names all transport buttons and delegates actions to the controller', () => {
  const page = mount();
  page.click('[aria-label="Previous station"]');
  page.click('[aria-label="Play"]');
  page.click('[aria-label="Next station"]');
  expect(actions.prevStation).toHaveBeenCalledTimes(1);
  expect(actions.togglePlay).toHaveBeenCalledTimes(1);
  expect(actions.nextStation).toHaveBeenCalledTimes(1);
});

test.each([
  ['playing', 'Pause'],
  ['buffering', 'Pause'],
  ['connecting', 'Cancel connection'],
])('offers %s cancellation with the label %s', (status, label) => {
  useAudio.mockReturnValue({ ...actions, wantsToPlay: true, status, volume: 1, muted: false });
  const page = mount();
  page.click(`[aria-label="${label}"]`);
  expect(actions.togglePlay).toHaveBeenCalledTimes(1);
});

test('volume changes are numeric and mute has an accessible state', () => {
  const page = mount();
  const input = page.container.querySelector('[aria-label=Volume]');
  expect(input.getAttribute('aria-valuetext')).toBe('60%');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '0.25');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(actions.changeVolume).toHaveBeenCalledWith(0.25);
  page.click('[aria-label=Mute]');
  expect(actions.toggleMute).toHaveBeenCalledTimes(1);
  expect(page.container.querySelector('[aria-label=Mute]').getAttribute('aria-pressed')).toBe(
    'false',
  );
});

test('showVolume=false hides the volume UI', () => {
  const page = mount({ showVolume: false });
  expect(page.container.querySelector('[aria-label="Volume controls"]')).toBeNull();
});

test('platforms without volume support receive device guidance instead of a false slider', () => {
  useAudio.mockReturnValue({
    ...actions,
    status: 'idle',
    volume: 1,
    muted: true,
    canChangeVolume: false,
  });
  const page = mount();
  expect(page.container.querySelector('input[type=range]')).toBeNull();
  expect(page.container.textContent).toContain('Use device volume controls');
  expect(page.container.querySelector('[aria-label=Unmute]').getAttribute('aria-pressed')).toBe(
    'true',
  );
});
