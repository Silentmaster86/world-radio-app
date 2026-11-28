import { NavLink } from 'react-router-dom';
import {
  FaGlobe,
  FaCompass,
  FaHeart,
  FaHeadphones,
  FaQuestionCircle,
  FaPlay,
  FaPause,
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { designText } from './messages';
import './shared.css';
export function PlayGlyph({ paused }) {
  return paused ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />;
}
export function Navigation() {
  const { t } = useLanguage();
  return (
    <nav className="design-navigation" aria-label={t('nav.library')}>
      {[
        ['/', 'discover.back', FaGlobe],
        ['/discover', 'discover.title', FaCompass],
        ['/library', 'nav.library', FaHeart],
        ['/now-playing', 'player.car', FaHeadphones],
        ['/help', 'settings.help', FaQuestionCircle],
      ].map(([to, key, Icon]) => (
        <NavLink key={to} to={to} end={to === '/'} title={t(key)}>
          <Icon aria-hidden="true" />
          <span>{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
export function useHero() {
  const { language, t } = useLanguage();
  const { currentStation, status, togglePlay, wantsToPlay } = useAudio();
  return {
    currentStation,
    status,
    wantsToPlay,
    togglePlay,
    t,
    title: (index) => designText(language, index),
  };
}
export function HeroCopy({ title, t }) {
  return (
    <div className="design-copy">
      <p className="design-kicker">World Radio · {t('library.eyebrow')}</p>
      <h2>{title}</h2>
      <p>{t('library.description')}</p>
    </div>
  );
}
