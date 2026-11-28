import { act } from 'react';
import { render } from '../test/render';
import { DesignProvider, useDesign, DESIGN_KEY } from './DesignContext';
import { loadDesign } from '../designs/loader';
jest.mock('../designs/loader', () => ({ loadDesign: jest.fn() }));
let settings;
function Probe() {
  settings = useDesign();
  return (
    <output>
      {settings.design}/{settings.error}
    </output>
  );
}
const mount = () =>
  render(
    <DesignProvider>
      <Probe />
    </DesignProvider>,
  );
beforeEach(() => {
  localStorage.clear();
  loadDesign.mockReset();
  loadDesign.mockResolvedValue({ palette: {} });
});
test('keeps Classic as the default without downloading other designs', () => {
  mount();
  expect(settings.design).toBe('classic');
  expect(loadDesign).not.toHaveBeenCalled();
});
test('restores a saved design and retains the last working one after a failed download', async () => {
  localStorage.setItem(DESIGN_KEY, JSON.stringify({ version: 1, design: 'orbit' }));
  await act(async () => mount());
  expect(settings.design).toBe('orbit');
  loadDesign.mockRejectedValueOnce(new Error('offline'));
  await act(async () => settings.setDesign('pulse'));
  expect(settings.design).toBe('orbit');
  expect(settings.error).toBe('load');
  expect(JSON.parse(localStorage.getItem(DESIGN_KEY)).design).toBe('orbit');
});
test('ignores a stale download when a newer choice has completed', async () => {
  mount();
  let resolve;
  loadDesign.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  let first;
  await act(async () => {
    first = settings.setDesign('orbit');
  });
  await act(async () => settings.setDesign('classic'));
  await act(async () => {
    resolve({ palette: {} });
    await first;
  });
  expect(settings.design).toBe('classic');
});
test('preserves newer settings and makes design changes session only', async () => {
  const raw = '{"version":7,"design":"future"}';
  localStorage.setItem(DESIGN_KEY, raw);
  mount();
  await act(async () => settings.setDesign('signal'));
  expect(localStorage.getItem(DESIGN_KEY)).toBe(raw);
  expect(settings.design).toBe('signal');
  expect(settings.error).toBe('session');
});

test('a blocked write still applies the design for the session and explains the failure', async () => {
  mount();
  const write = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Quota');
  });
  try {
    await act(async () => settings.setDesign('pulse'));
    expect(settings.design).toBe('pulse');
    expect(settings.error).toBe('session');
  } finally {
    write.mockRestore();
  }
});
