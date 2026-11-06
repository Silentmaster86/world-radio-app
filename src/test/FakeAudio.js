export class FakeAudio extends EventTarget {
  constructor() {
    super();
    this._src = '';
    this.currentSrc = '';
    this.paused = true;
    this.ended = false;
    this.error = null;
    this.readyState = 0;
    this.volume = 1;
    this.muted = false;
    this.preload = 'auto';
    this.play = jest.fn(() => {
      this.emit('playing', { paused: false, readyState: 4, currentSrc: this._src });
      return Promise.resolve();
    });
    this.pause = jest.fn(() => {
      const changed = !this.paused;
      this.paused = true;
      if (changed) this.emit('pause');
    });
    this.load = jest.fn(() => {
      this.currentSrc = '';
      this.readyState = 0;
      this.error = null;
      this.ended = false;
    });
  }
  get src() {
    return this._src;
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
