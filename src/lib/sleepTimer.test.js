import { createSleepTimer } from './sleepTimer';

let expire;
let timer;
beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  expire = jest.fn();
  timer = createSleepTimer({ onExpire: expire });
});
afterEach(() => {
  timer.dispose();
  jest.useRealTimers();
});

test('expires once at the deadline, including when the callback is checked again', () => {
  timer.start(15);
  jest.advanceTimersByTime(899_999);
  expect(expire).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  timer.check();
  expect(expire).toHaveBeenCalledTimes(1);
  expect(timer.getDeadline()).toBeNull();
});

test('replacing a timer cancels the old deadline', () => {
  timer.start(15);
  jest.advanceTimersByTime(60_000);
  timer.start(30);
  jest.advanceTimersByTime(14 * 60_000);
  expect(expire).not.toHaveBeenCalled();
  jest.advanceTimersByTime(16 * 60_000);
  expect(expire).toHaveBeenCalledTimes(1);
});

test('cancellation clears the deadline and notifies subscribers', () => {
  const changed = jest.fn();
  const unsubscribe = timer.subscribe(changed);
  timer.start(30);
  timer.cancel();
  expect(changed).toHaveBeenLastCalledWith(null);
  jest.advanceTimersByTime(60 * 60_000);
  expect(expire).not.toHaveBeenCalled();
  unsubscribe();
  timer.start(15);
  expect(changed).toHaveBeenCalledTimes(2);
});

test('checks overdue wall-clock deadlines after suspended execution', () => {
  timer.start(15);
  jest.setSystemTime(Date.now() + 20 * 60_000);
  timer.check();
  expect(expire).toHaveBeenCalledTimes(1);
  expect(timer.getDeadline()).toBeNull();
});

test.each([0, -1, '15', NaN, Infinity, 2.5, 121])(
  'rejects invalid duration %s without replacing a timer',
  (minutes) => {
    timer.start(30);
    const deadline = timer.getDeadline();
    expect(timer.start(minutes)).toBe(false);
    expect(timer.getDeadline()).toBe(deadline);
  },
);

test('disposing cancels work and prevents a restart', () => {
  timer.start(15);
  timer.dispose();
  jest.advanceTimersByTime(30 * 60_000);
  expect(expire).not.toHaveBeenCalled();
  expect(timer.start(15)).toBe(false);
});
