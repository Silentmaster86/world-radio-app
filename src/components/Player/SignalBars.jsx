export default function SignalBars({ playing = false }) {
  return (
    <span className="signal-bars" data-playing={playing} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
