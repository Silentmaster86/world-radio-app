export class FakeAudio extends EventTarget {
  constructor() {
    super();
    this._src = '';
    this.currentSrc = '';
    this._paused = true;
    this._time = 0;
    this._clock = Date.now();
    this.advanceTime = true;
    this.ended = false;
    this.error = null;
    this.readyState = 0;
    this.volume = 1;
    this.muted = false;
    this.preload = 'auto';
    this.play = jest.fn(() => {
      this.emit('play', { paused: false });
      this.emit('playing', { paused: false, readyState: 4, currentSrc: this._src });
      return Promise.resolve();
    });
    this.pause = jest.fn(() => {
      const changed = !this.paused;
      this.paused = true;
      if (changed) this.emit('pause');
    });
    this.load = jest.fn(() => {
      this.currentTime = 0;
      this.currentSrc = '';
      this.readyState = 0;
      this.error = null;
      this.ended = false;
    });
  }
  get src() {
    return this._src;
  }
  get currentTime() {
    return (
      this._time +
      (!this.paused && this.readyState >= 3 && this.advanceTime
        ? (Date.now() - this._clock) / 1000
        : 0)
    );
  }
  set currentTime(value) {
    this._time = value;
    this._clock = Date.now();
  }
  get paused() {
    return this._paused;
  }
  set paused(value) {
    this._time = this.currentTime;
    this._clock = Date.now();
    this._paused = value;
  }
  set src(value) {
    this._src = value;
    this.currentSrc = '';
    this.readyState = 0;
    this.error = null;
  }
  getAttribute(name) {
    return name === 'src' && this._src ? this._src : null;
  }
  removeAttribute(name) {
    if (name === 'src') {
      this._src = '';
      this.currentSrc = '';
    }
  }
  emit(name, properties = {}) {
    Object.assign(this, properties);
    this.dispatchEvent(new Event(name));
  }
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
