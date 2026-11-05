import styled from 'styled-components';
import { motion } from 'framer-motion';
import { getCountryFlag, getCountryName } from '../../lib/stationUtils';

const Card = styled.article`
	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'linear-gradient(135deg, rgba(93,12,255,0.15), rgba(155,0,250,0.1))'
			: theme.colors.surface};

	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: 1rem;
	position: relative;

	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;

	backdrop-filter: blur(12px);

	min-height: 150px;

	border: 2px solid ${({ $active, $selected }) =>
		$active ? '#ec4899' : $selected ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.08)'};

	box-shadow: ${({ $active }) =>
		$active
			? `
        0 0 5px #ec4899,
        0 0 15px #ec4899,
        0 0 30px #ec4899
      `
			: `
        0 0 12px rgba(0,255,255,0.05),
        0 0 18px rgba(255,0,255,0.05)
      `};

	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-5px);
	}

	@media (max-width: 480px) {
		min-height: 84px;
		padding: 0.75rem 0.9rem;

		flex-direction: row;
		align-items: center;
		text-align: left;
		gap: 0.85rem;
	}
`;

const StationButton = styled.button`
	width: 100%;
	min-width: 0;
	padding: 0;
	border: 0;
	border-radius: 0.5rem;
	background: transparent;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	font: inherit;
	@media (max-width: 480px) {
		flex-direction: row;
		gap: 0.85rem;
		text-align: left;
		padding-right: 2.5rem;
	}
`;

const Logo = styled.img`
	width: 80px;
	height: 80px;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	margin-bottom: ${({ theme }) => theme.spacing.sm};
	object-fit: cover;

	@media (max-width: 480px) {
		width: 54px;
		height: 54px;
		margin-bottom: 0;
		flex-shrink: 0;
	}
`;

const Info = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;

	@media (max-width: 480px) {
		align-items: flex-start;
	}
`;

const Name = styled.h3`
	color: ${({ theme }) => theme.colors.text};
	margin: 0 0 0.35rem;
	font-size: 1rem;

	@media (max-width: 480px) {
		font-size: 0.9rem;
		margin-bottom: 0.2rem;
	}
`;

const Meta = styled.p`
	margin: 0;
	font-size: 0.75rem;
	color: ${({ theme }) => theme.colors.muted};

	@media (max-width: 480px) {
		font-size: 0.7rem;
	}
`;

const FavoriteButton = styled.button`
	width: 44px;
	height: 44px;
	position: absolute;
	top: 0.75rem;
	right: 1rem;

	background: none;
	border: none;
	cursor: pointer;

	font-size: 1.6rem;
	color: ${({ theme }) => theme.colors.text};

	&:hover {
		transform: scale(1.1);
	}

	@media (max-width: 480px) {
		top: 50%;
		right: 0.9rem;
		transform: translateY(-50%);
		font-size: 1.25rem;

		&:hover {
			transform: translateY(-50%) scale(1.1);
		}
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
	return (
		<motion.div
			whileHover={{ scale: 1.03 }}
			whileTap={{ scale: 0.97 }}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<Card
				$active={isActive}
				$selected={isSelected}
			>
				<StationButton type='button' onClick={onPlay} aria-label={`Play ${station.name}`} aria-current={isSelected ? 'true' : undefined}>
				<Logo src={station.logo} alt={station.name} />

				<Info>
					<Name>{station.name}</Name>
					<Meta>
						<span role='img' aria-label={getCountryName(station.countryCode)}>
							{getCountryFlag(station.countryCode)}
						</span> • {station.genres.join(', ')}
					</Meta>
					{isSelected && <Meta>{({
						idle: 'Selected', connecting: 'Connecting…', playing: 'Playing',
						buffering: 'Buffering…', paused: 'Paused', error: 'Unavailable',
					})[playbackStatus]}</Meta>}
				</Info>
				</StationButton>

				<FavoriteButton
					type='button'
					onClick={onFavorite}
					aria-label={`${isFavorite ? 'Remove' : 'Add'} ${station.name} ${isFavorite ? 'from' : 'to'} favorites`}
					aria-pressed={isFavorite}
				>
					{isFavorite ? '♥' : '♡'}
				</FavoriteButton>
			</Card>
		</motion.div>
	);
}
