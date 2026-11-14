import { useEffect } from 'react';
export default function AmbientBackground() {
  useEffect(() => {
    const update = () => {
      document.documentElement.dataset.pageVisible = String(!document.hidden);
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      delete document.documentElement.dataset.pageVisible;
    };
  }, []);
  return (
    <div className="ambient-background" aria-hidden="true">
      {[0, 1].map((layer) => (
        <svg
          key={layer}
          className={`ambient-wave ambient-wave-${layer}`}
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M-120 680C220 130 420 940 800 430S1320 130 1610 520V1040H-120Z"
            fill="currentColor"
            opacity=".08"
          />
          <path d="M-120 680C220 130 420 940 800 430S1320 130 1610 520" />
          <path d="M-120 720C220 170 420 980 800 470S1320 170 1610 560" opacity=".6" />
          <path d="M-120 760C220 210 420 1020 800 510S1320 210 1610 600" opacity=".3" />
        </svg>
      ))}
    </div>
  );
}
