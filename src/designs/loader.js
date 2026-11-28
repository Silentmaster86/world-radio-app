const loaders = {
  orbit: () => import('./orbit'),
  pulse: () => import('./pulse'),
  analog: () => import('./analog'),
  signal: () => import('./signal'),
};
export const loadDesign = (id) =>
  loaders[id] ? loaders[id]() : Promise.reject(new Error('Unknown design'));
