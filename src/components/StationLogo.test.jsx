import StationLogo from './StationLogo';
import { stations } from '../data/stations';
import { render } from '../test/render';

test('stations without artwork have a sized, decorative local monogram and keep existing logos intact', () => {
  const page = render(<StationLogo station={{ name: 'SomaFM · Groove Salad' }} size={54} />);
  const monogram = page.container.querySelector('svg');
  expect(monogram.getAttribute('aria-hidden')).toBe('true');
  expect(monogram.getAttribute('width')).toBe('54');
  expect(monogram.textContent).toBe('GS');
  expect(page.container.querySelector('img')).toBeNull();
  page.rerender(<StationLogo station={stations[0]} />);
  expect(page.container.querySelector('img').getAttribute('src')).toBe(stations[0].logo);
  expect(page.container.querySelector('img').getAttribute('srcset')).toBe(stations[0].logoSrcSet);
  expect(page.container.querySelector('img').getAttribute('alt')).toBe('');
});
