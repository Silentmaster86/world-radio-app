import ErrorBoundary from './ErrorBoundary';
import { render } from '../test/render';

test('renders healthy children', () => {
  const page = render(
    <ErrorBoundary>
      <p>Radio is ready</p>
    </ErrorBoundary>,
  );
  expect(page.container.textContent).toBe('Radio is ready');
});

test('recovers a child failure without relying on providers or deleting data', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.setItem('favorites', '[{"name":"Capital Dance"}]');
  function BrokenProvider() {
    throw new Error('Provider failed');
  }
  try {
    const page = render(
      <ErrorBoundary>
        <BrokenProvider />
      </ErrorBoundary>,
    );
    expect(page.container.querySelector('[role=alert]').textContent).toContain("couldn't open");
    expect(page.container.querySelector('button').textContent).toContain('Reload app');
    expect(localStorage.getItem('favorites')).toBe('[{"name":"Capital Dance"}]');
    expect(page.container.textContent).not.toContain('Provider failed');
  } finally {
    log.mockRestore();
    localStorage.clear();
  }
});

test('a local feature fallback leaves surrounding application content mounted', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  function BrokenFeature() {
    throw new Error('Chunk unavailable');
  }
  try {
    const page = render(
      <>
        <p>Radio keeps playing</p>
        <ErrorBoundary fallback={<p role="alert">Backup unavailable</p>}>
          <BrokenFeature />
        </ErrorBoundary>
      </>,
    );
    expect(page.container.textContent).toBe('Radio keeps playingBackup unavailable');
    expect(page.container.querySelector('main')).toBeNull();
  } finally {
    log.mockRestore();
  }
});
