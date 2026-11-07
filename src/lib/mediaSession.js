function artworkFor(station) {
  if (station.artwork) return station.artwork;
  if (!station.logo) return [];
  const extension = station.logo.match(/\.([a-z0-9]+)(?:[?#].*)?$/i)?.[1]?.toLowerCase();
  const type = {
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
  }[extension];
  return [{ src: station.logo, ...(type ? { type } : {}) }];
}

export function bindMediaSession(player, options = {}) {
  const session =
    options.session === undefined
      ? typeof navigator !== 'undefined'
        ? navigator.mediaSession
        : null
      : options.session;
  const Metadata =
    options.Metadata === undefined
      ? typeof window !== 'undefined'
        ? window.MediaMetadata
        : null
      : options.Metadata;
  if (!session || typeof session.setActionHandler !== 'function') return () => {};

  let lastStationId;
  let ownsMetadata = false;
  const sync = (snapshot) => {
    const station = player.getStation();
    if (
      snapshot.status !== 'idle' &&
      station &&
      station.id !== lastStationId &&
      typeof Metadata === 'function'
    ) {
      try {
        session.metadata = new Metadata({
          title: station.name,
          artist: 'Online Radio',
          album: 'Live Stream',
          artwork: artworkFor(station),
        });
        lastStationId = station.id;
        ownsMetadata = true;
      } catch {
        /* Metadata support varies independently from audio support. */
      }
    }
    try {
      session.playbackState =
        snapshot.status === 'playing' ? 'playing' : snapshot.status === 'idle' ? 'none' : 'paused';
    } catch {
      /* Optional property. */
    }
  };
  const actions = {
    play: player.play,
    pause: () => player.pause({ retainSource: true }),
    nexttrack: player.nextStation,
    previoustrack: player.prevStation,
  };
  const installed = [];
  Object.entries(actions).forEach(([name, action]) => {
    try {
      session.setActionHandler(name, () => {
        const result = action();
        return result?.catch ? result.catch(() => false) : result;
      });
      installed.push(name);
    } catch {
      /* One unsupported action must not prevent the remaining controls. */
    }
  });
  const unsubscribe = player.subscribe(sync);
  sync(player.getSnapshot());
  return () => {
    unsubscribe();
    installed.forEach((name) => {
      try {
        session.setActionHandler(name, null);
      } catch {
        /* Optional action. */
      }
    });
    try {
      session.playbackState = 'none';
      if (ownsMetadata) session.metadata = null;
    } catch {
      /* Optional properties. */
    }
  };
}
