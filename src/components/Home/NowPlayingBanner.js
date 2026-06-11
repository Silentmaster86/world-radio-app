import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaCarSide } from 'react-icons/fa';
import PlayerControls from '../Player/PlayerControls';

const Banner = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;

	margin-bottom: ${({ theme }) => theme.spacing.sm};

	padding: 0.9rem 1rem;
	border-radius: 1.2rem;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(236, 72, 153, 0.25);

	@media (max-width: 480px) {
		padding: 0.75rem;
		gap: 0.5rem;
	}
`;

const LeftSide = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
`;

const Logo = styled.img`
	width: 48px;
	height: 48px;
	border-radius: 0.75rem;
	object-fit: cover;

	@media (max-width: 480px) {
		width: 32px;
		height: 32px;
	}
`;

const StationName = styled.h2`
	margin: 0;
	font-size: 1rem;
	line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

	@media (max-width: 480px) {
		font-size: 0.7rem;
	}
`;
const Label = styled.div`
	font-size: 0.75rem;
	opacity: 0.7;
	text-transform: uppercase;
`;

const RightSide = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CarButton = styled.button`
	width: 36px;
	height: 36px;

	border-radius: 50%;
	border: 1px solid
		${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.14)'
				: 'rgba(0,0,0,0.12)'};

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'rgba(255,255,255,0.12)'
			: 'rgba(0,0,0,0.08)'};

	color: ${({ theme }) => theme.colors.text};

	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;

	&:hover {
		transform: scale(1.08);
	}
`;

export default function NowPlayingBanner({ station }) {

	const navigate = useNavigate();

	if (!station) return null;

	return (
		<Banner>
			<LeftSide>
				<Logo src={station.logo} alt={station.name} />

				<div>
					<Label>NOW PLAYING</Label>
					<StationName>{station.name}</StationName>
				</div>
			</LeftSide>

			<RightSide>
			<PlayerControls showVolume={false} compact mobileMini />


				<CarButton
					onClick={() => navigate('/now-playing')}
					aria-label='Open car mode'
				>
					<FaCarSide />
				</CarButton>
			</RightSide>
		</Banner>
	);
}
