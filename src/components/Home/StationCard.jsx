import { FaPlay, FaMusic } from 'react-icons/fa';
import styled from 'styled-components';
import StationLogo from '../StationLogo';
import { getCountryFlag, getCountryName } from '../../lib/stationUtils';
import { useLanguage } from '../../context/LanguageContext';

const Card = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.accent : theme.colors.border)};
  border-radius: 0.85rem;
  padding: 0.75rem;
  position: relative;
  height: 100%;
  @media (max-width: 640px) {
    padding: 0.5rem 0.65rem;
  }
`;
const StationButton = styled.button`
  width: 100%;
  min-width: 0;
  min-height: 64px;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  gap: 0.75rem;
  text-align: left;
  padding-right: 2.75rem;
  @media (max-width: 640px) {
    min-height: 52px;
    flex-direction: row;
    justify-content: start;
    gap: 0.65rem;
    text-align: left;
    padding-right: 2.75rem;
  }
`;
const Logo = styled(StationLogo)`
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  margin: 0;
  flex-shrink: 0;
  object-fit: contain;
  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
    margin: 0;
    flex-shrink: 0;
  }
`;
const LogoFrame = styled.span`
  display: block;
  position: relative;
  flex-shrink: 0;
  > span {
    svg {
      width: 8px;
      height: 8px;
    }
    position: absolute;
    bottom: -3px;
    right: -3px;
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 9px;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.onAccent};
  }
`;
const Info = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;
`;
const Name = styled.h2`
  margin: 0 0 0.2rem;
  font-size: 0.95rem;
`;
const ActionText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;
const Meta = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const FavoriteButton = styled.button`
  width: 44px;
  height: 44px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0.5rem;
  background: transparent;
  border: 0;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  @media (max-width: 640px) {
    top: 50%;
    transform: translateY(-50%);
  }
`;
export default function StationCard({
  station,
  isActive,
  isSelected,
  playbackStatus,
  isFavorite,
  onPlay,
  onFavorite,
}) {
  const { t } = useLanguage();
  const status = isActive
    ? t('station.playing')
    : {
        idle: t('station.selected'),
        connecting: t('station.connecting'),
        playing: t('station.playing'),
        buffering: t('station.buffering'),
        paused: t('station.paused'),
        error: t('station.unavailable'),
      }[playbackStatus];
  return (
    <Card $selected={isSelected}>
      <StationButton
        type="button"
        onClick={onPlay}
        data-station-id={station.id}
        aria-current={isSelected ? 'true' : undefined}
      >
        <ActionText>{t('station.play')} </ActionText>
        <LogoFrame aria-hidden="true">
          <Logo station={station} sizes="(max-width: 640px) 40px, 48px" />
          <span>{isActive ? <FaMusic /> : <FaPlay />}</span>
        </LogoFrame>
        <Info>
          <Name data-station-title>{station.name}</Name>
          <Meta>
            <span
              role="img"
              aria-label={t(
                `country.${station.countryCode}`,
                {},
                getCountryName(station.countryCode),
              )}
            >
              {getCountryFlag(station.countryCode)}
            </span>{' '}
            · {station.genres.map((genre) => t(`genre.${genre}`, {}, genre)).join(', ')}
          </Meta>
          {isSelected && <Meta>{status}</Meta>}
        </Info>
      </StationButton>
      <FavoriteButton
        type="button"
        onClick={onFavorite}
        aria-label={t(isFavorite ? 'station.removeFavorite' : 'station.addFavorite', {
          station: station.name,
        })}
        aria-pressed={isFavorite}
      >
        {isFavorite ? '♥' : '♡'}
      </FavoriteButton>
    </Card>
  );
}
