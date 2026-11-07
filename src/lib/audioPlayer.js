export function createInitialPlayerState(stations, options = {}) {
  const selected =
    stations.find((station) => station.id === options.initialStationId) || stations[0];
  return {
    selectedStationId: selected?.id || null,
    playingStationId: null,
    status: 'idle',
    wantsToPlay: false,
    error: null,
    retryAttempt: 0,
    volume: Number.isFinite(options.initialVolume)
      ? Math.min(1, Math.max(0, options.initialVolume))
      : 1,
    muted: options.initialMuted === true,
    canChangeVolume: true,
    online: options.initialOnline !== false,
  };
}

function playbackError(error) {
  if (error?.name === 'NotAllowedError') {
    return {
      code: 'blocked',
      message: 'Playback was blocked. Press Play to start the station.',
      recoverable: false,
    };
  }
  if (error?.name === 'NotSupportedError' || error?.code === 4) {
    return {
      code: 'unsupported',
      message: 'This stream is unavailable or its format is not supported.',
      recoverable: false,
    };
  }
  if (error?.code === 3) {
    return {
      code: 'decode',
      message: 'This stream could not be decoded. Try another station.',
      recoverable: false,
    };
  }
  return {
    code: error?.code === 'timeout' ? 'timeout' : 'network',
    message:
      error?.code === 'timeout'
        ? 'The station took too long to connect.'
        : 'The connection to the station was interrupted.',
    recoverable: true,
  };
}

export function createAudioPlayer({
  stations,
  createAudio = () => new Audio(),
  connectionTimeoutMs = 15000,
  retryDelays = [1000, 2000, 4000],
  ...options
}) {
  const audio = createAudio();
  audio.preload = 'none';
  let state = createInitialPlayerState(stations, options);
  let disposed = false;
  let generation = 0;
  let active = null;
  let timeout = null;
  let retryTimer = null;
  let failures = 0;
  const listeners = new Set();

  function publish(patch) {
    if (disposed) return;
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  }

  // Probe before assigning a source; some mobile browsers ignore volume writes.
  try {
    const before = audio.volume;
    const probe = before === 0.5 ? 0.25 : 0.5;
    audio.volume = probe;
    state.canChangeVolume = Math.abs(audio.volume - probe) < 0.001;
    audio.volume = state.canChangeVolume ? state.volume : before;
    state.volume = audio.volume;
  } catch {
    state.canChangeVolume = false;
  }
  audio.muted = state.muted;

  function clearTimeouts() {
    clearTimeout(timeout);
    clearTimeout(retryTimer);
    timeout = null;
    retryTimer = null;
  }

  function invalidate() {
    generation += 1;
    clearTimeouts();
    if (active) {
      active.removeListeners();
      active.resolve(false);
      active = null;
    }
  }

  function releaseSource() {
    audio.pause();
    if (audio.getAttribute('src') !== null) {
      audio.removeAttribute('src');
      audio.load();
    }
  }

  function fail(attempt, error) {
    if (disposed || active !== attempt || !state.wantsToPlay) return;
    const problem = playbackError(error);
    invalidate();
    releaseSource();
    if (!state.online) {
      publish({ status: 'buffering', playingStationId: null, error: null });
      return;
    }
    if (problem.recoverable && failures < retryDelays.length) {
      const delay = retryDelays[failures];
      failures += 1;
      publish({
        status: 'connecting',
        playingStationId: null,
        retryAttempt: failures,
        error: null,
      });
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (state.wantsToPlay && !disposed) startAttempt();
      }, delay);
      return;
    }
    publish({ status: 'error', playingStationId: null, wantsToPlay: false, error: problem });
  }

  function armTimeout(attempt) {
    if (timeout !== null) return;
    timeout = setTimeout(() => {
      timeout = null;
      fail(attempt, { code: 'timeout' });
    }, connectionTimeoutMs);
  }

  function startAttempt() {
    invalidate();
    releaseSource();
    const station = stations.find((item) => item.id === state.selectedStationId);
    if (!station || disposed || !state.wantsToPlay) return Promise.resolve(false);
    if (!state.online) {
      publish({ status: 'buffering', playingStationId: null });
      return Promise.resolve(false);
    }

    let resolve;
    const result = new Promise((settle) => {
      resolve = settle;
    });
    const attempt = {
      generation,
      station,
      resolve,
      result,
      hasPlayed: false,
      removeListeners: () => {},
    };
    active = attempt;
    const isCurrent = () =>
      !disposed &&
      active === attempt &&
      generation === attempt.generation &&
      state.wantsToPlay &&
      state.selectedStationId === station.id &&
      (!audio.currentSrc || audio.currentSrc === station.url);
    const confirmPlaying = () => {
      if (!isCurrent() || audio.paused || audio.ended || audio.readyState < 3) return;
      clearTimeout(timeout);
      timeout = null;
      attempt.hasPlayed = true;
      publish({ status: 'playing', playingStationId: station.id, error: null });
      resolve(true);
    };
    const waitForData = () => {
      if (!isCurrent() || audio.paused || audio.readyState >= 3) return;
      publish({ status: attempt.hasPlayed ? 'buffering' : 'connecting' });
      if (state.online) armTimeout(attempt);
    };
    const events = {
      playing: confirmPlaying,
      waiting: waitForData,
      stalled: waitForData,
      error: () => {
        if (isCurrent() && audio.error) fail(attempt, audio.error);
      },
      ended: () => {
        if (isCurrent() && audio.ended) fail(attempt, { code: 'ended' });
      },
      pause: () => {
        if (isCurrent() && attempt.hasPlayed && audio.paused && !audio.ended && !audio.error)
          pause({ retainSource: true });
      },
    };
    Object.entries(events).forEach(([name, handler]) => audio.addEventListener(name, handler));
    attempt.removeListeners = () =>
      Object.entries(events).forEach(([name, handler]) => audio.removeEventListener(name, handler));
    publish({ status: 'connecting', playingStationId: null, error: null });
    armTimeout(attempt);
    try {
      audio.src = station.url;
      audio.load();
      Promise.resolve(audio.play())
        .then(confirmPlaying)
        .catch((error) => {
          if (active === attempt && generation === attempt.generation) fail(attempt, error);
        });
    } catch (error) {
      fail(attempt, error);
    }
    return result;
  }

  function play() {
    if (disposed) return Promise.resolve(false);
    if (state.wantsToPlay) return active?.result || Promise.resolve(state.status === 'playing');
    if (!state.selectedStationId) return Promise.resolve(false);
    failures = 0;
    publish({ wantsToPlay: true, retryAttempt: 0, error: null });
    return startAttempt();
  }

  function pause({ retainSource = false } = {}) {
    if (disposed) return;
    const hadPlayingSource = state.playingStationId !== null;
    invalidate();
    publish({
      wantsToPlay: false,
      status: 'paused',
      playingStationId: null,
      error: null,
      retryAttempt: 0,
    });
    // System media controls need the paused audio resource to stay available
    // for Android to potentially keep a resumable media notification.
    // An unconfirmed connection or ordinary app/timer pause still unloads it.
    if (retainSource && hadPlayingSource && audio.getAttribute('src') !== null) {
      audio.pause();
    } else {
      releaseSource();
    }
  }

  function selectStation(id) {
    if (disposed || !stations.some((station) => station.id === id)) return Promise.resolve(false);
    if (id === state.selectedStationId && state.wantsToPlay)
      return active?.result || Promise.resolve(state.status === 'playing');
    invalidate();
    failures = 0;
    publish({
      selectedStationId: id,
      playingStationId: null,
      status: state.online ? 'connecting' : 'buffering',
      wantsToPlay: true,
      retryAttempt: 0,
      error: null,
    });
    return startAttempt();
  }

  function step(offset) {
    if (!stations.length) return Promise.resolve(false);
    const index = stations.findIndex((station) => station.id === state.selectedStationId);
    return selectStation(stations[(index + offset + stations.length) % stations.length].id);
  }

  function setOnline(online) {
    if (disposed || state.online === online) return;
    publish({ online });
    if (!online) {
      clearTimeouts();
      if (state.wantsToPlay && state.status !== 'playing') publish({ status: 'buffering' });
    } else if (state.wantsToPlay && state.status !== 'playing') {
      startAttempt();
    }
  }

  function syncVolume() {
    publish({ volume: audio.volume, muted: audio.muted });
  }
  audio.addEventListener('volumechange', syncVolume);

  return {
    getSnapshot: () => state,
    getStation: () => stations.find((station) => station.id === state.selectedStationId),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    play,
    pause,
    selectStation,
    togglePlay: () => (state.wantsToPlay ? pause() : play()),
    nextStation: () => step(1),
    prevStation: () => step(-1),
    retry() {
      pause();
      return play();
    },
    setOnline,
    setVolume(value) {
      if (disposed || !Number.isFinite(value) || !state.canChangeVolume) return;
      const volume = Math.min(1, Math.max(0, value));
      try {
        audio.volume = volume;
        publish({ volume: audio.volume, canChangeVolume: Math.abs(audio.volume - volume) < 0.001 });
      } catch {
        publish({ canChangeVolume: false });
      }
    },
    toggleMute() {
      if (!disposed) {
        audio.muted = !audio.muted;
        syncVolume();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      invalidate();
      listeners.clear();
      audio.removeEventListener('volumechange', syncVolume);
      releaseSource();
    },
  };
}
