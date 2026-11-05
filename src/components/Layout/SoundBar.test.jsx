import { ThemeProvider } from 'styled-components';
import SoundBar from './SoundBar';
import { darkTheme } from '../../darkTheme';
import { stations } from '../../data/stations';
import { render } from '../../test/render';
import { act } from 'react';
jest.mock('../../context/AudioContext', () => ({ useAudio: () => ({ currentStation: require('../../data/stations').stations[0] }) }));
jest.mock('../../context/BrowsingContext', () => ({ usePlayerNavigation: () => ({ openPlayer: jest.fn() }) }));
jest.mock('../Player/PlayerControls', () => () => <button>Play</button>);
jest.mock('../Player/PlayerStatus', () => () => <p>Ready</p>);

test('the dock reports changed heights and releases its observer', () => {
  let measure, height = 120;
  const disconnect = jest.fn();
  const previous = global.ResizeObserver;
  global.ResizeObserver = class { constructor(callback) { measure = callback; } observe() {} disconnect() { disconnect(); } };
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ height }));
  const onHeightChange = jest.fn();
  try {
    const page = render(<ThemeProvider theme={darkTheme}><SoundBar onHeightChange={onHeightChange} /></ThemeProvider>);
    expect(page.container.querySelector('h2').textContent).toBe(stations[0].name);
    expect(onHeightChange).toHaveBeenLastCalledWith(120);
    height = 240;
    act(() => measure());
    expect(onHeightChange).toHaveBeenLastCalledWith(240);
    page.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  } finally { rect.mockRestore(); global.ResizeObserver = previous; }
});
