import styled from 'styled-components';
import { getCountryFlag, getCountryName } from '../../lib/stationUtils';

const Card = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.accent : theme.colors.border};
  border-radius: 1rem; padding: 1.25rem 1rem; position: relative; height: 100%;
  @media (max-width: 640px) { padding: 0.85rem; }
`;
const StationButton = styled.button`
  width: 100%; min-width: 0; min-height: 172px; padding: 0; border: 0;
  border-radius: 0.5rem; background: transparent;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
  @media (max-width: 640px) {
    min-height: 60px; flex-direction: row; justify-content: start; gap: 0.85rem;
    text-align: left; padding-right: 2.75rem;
  }
`;
const Logo = styled.img`
  width: 80px; height: 80px; border-radius: 0.75rem; margin-bottom: 1rem; object-fit: contain;
  @media (max-width: 640px) { width: 54px; height: 54px; margin: 0; flex-shrink: 0; }
`;
const Info = styled.div`min-width: 0; overflow-wrap: anywhere;`;
const Name = styled.h3`margin: 0 0 0.35rem; font-size: 1rem;`;
const Meta = styled.p`margin: 0; font-size: 0.875rem; color: ${({ theme }) => theme.colors.muted};`;
const FavoriteButton = styled.button`
  width: 44px; height: 44px; position: absolute; top: 0.5rem; right: 0.5rem;
  background: transparent; border: 0; border-radius: 0.5rem; font-size: 1.6rem;
  @media (max-width: 640px) { top: 50%; transform: translateY(-50%); }
`;
export default function StationCard({ station, isActive, isSelected, playbackStatus, isFavorite, onPlay, onFavorite }) {
  const status = isActive ? 'Playing' : ({ idle: 'Selected', connecting: 'Connecting…', playing: 'Playing', buffering: 'Buffering…', paused: 'Paused', error: 'Unavailable' })[playbackStatus];
  return <Card $selected={isSelected}>
    <StationButton type='button' onClick={onPlay} aria-label={`Play ${station.name}`} aria-current={isSelected ? 'true' : undefined}>
      <Logo src={station.logo} alt='' width='80' height='80' loading='lazy' decoding='async' />
      <Info><Name>{station.name}</Name><Meta><span role='img' aria-label={getCountryName(station.countryCode)}>{getCountryFlag(station.countryCode)}</span> · {station.genres.join(', ')}</Meta>
        {isSelected && <Meta>{status}</Meta>}
      </Info>
    </StationButton>
    <FavoriteButton type='button' onClick={onFavorite} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${station.name} ${isFavorite ? 'from' : 'to'} favorites`} aria-pressed={isFavorite}>{isFavorite ? '♥' : '♡'}</FavoriteButton>
  </Card>;
}
