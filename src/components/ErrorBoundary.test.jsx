import ErrorBoundary from './ErrorBoundary';
import { render } from '../test/render';

test('renders healthy children', () => {
  const page = render(<ErrorBoundary><p>Radio is ready</p></ErrorBoundary>);
  expect(page.container.textContent).toBe('Radio is ready');
});

test('recovers a child failure without relying on providers or deleting data', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.setItem('favorites', '[{"name":"Capital Dance"}]');
  function BrokenProvider() { throw new Error('Provider failed'); }
  try {
    const page = render(<ErrorBoundary><BrokenProvider /></ErrorBoundary>);
    expect(page.container.querySelector('[role=alert]').textContent).toContain("couldn't open");
    expect(page.container.querySelector('button').textContent).toContain('Reload app');
    expect(localStorage.getItem('favorites')).toBe('[{"name":"Capital Dance"}]');
    expect(page.container.textContent).not.toContain('Provider failed');
  } finally {
    log.mockRestore();
    localStorage.clear();
  }
});
