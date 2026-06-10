import styled from 'styled-components';
import { motion } from 'framer-motion';

const Card = styled.div`
	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'linear-gradient(135deg, rgba(93,12,255,0.15), rgba(155,0,250,0.1))'
			: theme.colors.surface};

	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: 1rem;
	text-align: center;
	position: relative;
	cursor: pointer;

	backdrop-filter: blur(12px);

	border: ${({ $active }) =>
		$active ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.08)'};

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
`;

const Logo = styled.img`
	width: 80px;
	height: 80px;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Name = styled.h3`
	color: ${({ theme }) => theme.colors.text};
	margin: 0 0 0.35rem;
	font-size: 1rem;
`;

const Meta = styled.p`
	margin: 0;
	font-size: 0.75rem;
	color: ${({ theme }) => theme.colors.muted};
`;

const FavoriteButton = styled.button`
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
`;

export default function StationCard({
	station,
	isActive,
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
				onClick={onPlay}
				aria-label={`Play ${station.name}`}
			>
				<Logo src={station.logo} alt={station.name} />

				<Name>{station.name}</Name>
				<Meta>{station.country === "UK" ? "🇬🇧" : "🇵🇱"} {station.country} • {station.genre}</Meta>

				<FavoriteButton
					onClick={(e) => {
						e.stopPropagation();
						onFavorite();
					}}
				>
					{isFavorite ? '♥' : '♡'}
				</FavoriteButton>
			</Card>
		</motion.div>
	);
}