import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../../darkTheme';
import { useAudio } from '../../context/AudioContext';
import PlayerStatus from './PlayerStatus';
import { render } from '../../test/render';

jest.mock('../../context/AudioContext', () => ({ useAudio: jest.fn() }));

test.each([
  ['idle', 'Ready to play'],
  ['connecting', 'Connecting'],
  ['playing', 'Playing live'],
  ['buffering', 'Buffering'],
  ['paused', 'Paused'],
])('announces the actual %s state', (status, label) => {
  useAudio.mockReturnValue({ status, online: true, retryAttempt: 0 });
  const page = render(
    <ThemeProvider theme={darkTheme}>
      <PlayerStatus />
    </ThemeProvider>,
  );
  expect(page.container.querySelector('[role=status]').textContent).toContain(label);
});

test('labels active backup playback without exposing server URLs', () => {
  useAudio.mockReturnValue({
    status: 'playing',
    online: true,
    streamSourceIndex: 1,
  });
  const page = render(
    <ThemeProvider theme={darkTheme}>
      <PlayerStatus />
    </ThemeProvider>,
  );
  expect(page.container.textContent).toContain('backup stream');
});

test('explains a failure and retries through the shared controller', () => {
  const retry = jest.fn();
  useAudio.mockReturnValue({
    status: 'error',
    online: true,
    error: { message: 'The station took too long to connect.' },
    retry,
  });
  const page = render(
    <ThemeProvider theme={darkTheme}>
      <PlayerStatus />
    </ThemeProvider>,
  );
  expect(page.container.textContent).toContain('too long');
  page.click('button');
  expect(retry).toHaveBeenCalledTimes(1);
});

test('shows waiting for the network only while the user still wants playback', () => {
  useAudio.mockReturnValue({ status: 'buffering', online: false, wantsToPlay: true });
  const page = render(
    <ThemeProvider theme={darkTheme}>
      <PlayerStatus />
    </ThemeProvider>,
  );
  expect(page.container.textContent).toContain('Waiting for a connection');
});
