import { act } from 'react';
import { createRoot } from 'react-dom/client';

const mounted = new Set();
export function render(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  const instance = {
    container,
    rerender(next) {
      act(() => root.render(next));
    },
    click(selector) {
      const target = container.querySelector(selector);
      if (!target) throw new Error(`Missing test target: ${selector}`);
      act(() => target.click());
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
      mounted.delete(instance);
    },
  };
  mounted.add(instance);
  return instance;
}
afterEach(() => {
  for (const instance of [...mounted]) instance.unmount();
});
