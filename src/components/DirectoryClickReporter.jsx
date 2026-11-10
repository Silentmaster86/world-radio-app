import { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
export default function DirectoryClickReporter() {
  const { status, wantsToPlay, playingStation } = useAudio();
  const recorded = useRef(null);
  useEffect(() => {
    if (!wantsToPlay) {
      recorded.current = null;
      return;
    }
    const uuid = playingStation?.directoryId;
    if (status !== 'playing' || !uuid || recorded.current === uuid) return;
    recorded.current = uuid;
    // Radio Browser requests anonymous station click reports. Never block playback.
    fetch(`/.netlify/functions/radio-directory?click=${uuid}`, { method: 'POST' }).catch(() => {});
  }, [status, wantsToPlay, playingStation]);
  return null;
}
