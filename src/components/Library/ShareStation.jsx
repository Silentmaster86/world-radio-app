import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { shareStation, stationLink } from '../../lib/stationLinks';
import { libraryMessage } from './messages';
export default function ShareStation({ station }) {
  const { language } = useLanguage(),
    [result, setResult] = useState(''),
    input = useRef(null),
    request = useRef(0);
  const t = (key, params) => libraryMessage(language, key, params);
  useEffect(() => {
    setResult('');
    const pending = request;
    return () => {
      pending.current++;
    };
  }, [station.id]);
  useEffect(() => {
    if (result === 'manual') {
      input.current?.focus();
      input.current?.select();
    }
  }, [result]);
  return (
    <div className="share-station">
      <button
        type="button"
        data-share-station={station.id}
        onClick={async () => {
          const generation = ++request.current;
          const value = await shareStation(station);
          if (generation === request.current) setResult(value);
        }}
      >
        {t('share', { name: station.name })}
      </button>
      {result === 'manual' && (
        <label>
          {t('link')}
          <input
            ref={input}
            readOnly
            value={stationLink(station)}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
      {['shared', 'copied'].includes(result) && <p role="status">{t(result)}</p>}
    </div>
  );
}
