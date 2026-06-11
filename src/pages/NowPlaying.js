import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import {
	FaHome,
	FaPlay,
	FaPause,
	FaStepForward,
	FaStepBackward,
	FaCarSide,
} from 'react-icons/fa';

const Wrapper = styled.main`
	min-height: 100dvh;
	padding: 1rem;

	display: flex;
	align-items: center;
	justify-content: center;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'radial-gradient(circle at top, #2a0a3d, #050505 55%)'
			: 'linear-gradient(180deg, #ffffff, #f5f5f7)'};

	color: ${({ theme }) => theme.colors.text};
`;

const PlayerCard = styled.section`
	width: min(100%, 430px);
	min-height: 82dvh;

	padding: 1.5rem;

	border-radius: 2rem;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff'};

	border: 1px solid
		${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.1)'
				: 'rgba(0,0,0,0.08)'};

	box-shadow: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? '0 0 40px rgba(236,72,153,0.25)'
			: '0 20px 50px rgba(0,0,0,0.12)'};

	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
`;

const TopBar = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const IconButton = styled.button`
	width: 46px;
	height: 46px;

	border-radius: 50%;
	border: none;

	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'rgba(255,255,255,0.12)'
			: 'rgba(0,0,0,0.06)'};

	color: ${({ theme }) => theme.colors.text};

	transition: 0.2s ease;

	&:hover {
		transform: scale(1.08);
	}
`;

const CarBadge = styled.div`
	display: flex;
	align-items: center;
	gap: 0.4rem;

	padding: 0.45rem 0.75rem;

	border-radius: 999px;

	font-size: 0.8rem;
	font-weight: 700;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'rgba(236,72,153,0.18)'
			: 'rgba(236,72,153,0.12)'};

	color: ${({ theme }) => theme.colors.accent};
`;

const LogoWrapper = styled.div`
	margin: 3rem 0 1.5rem;

	padding: 1rem;

	border-radius: 2rem;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark' ? 'rgba(0,0,0,0.25)' : '#f4f4f5'};

	box-shadow: 0 18px 35px rgba(0, 0, 0, 0.25);
`;

const StationLogo = styled.img`
	width: 170px;
	height: 170px;

	border-radius: 1.5rem;

	object-fit: cover;

	@media (max-width: 480px) {
		width: 145px;
		height: 145px;
	}
`;

const StationName = styled.h1`
	margin: 0;

	font-size: 2rem;
	text-align: center;

	@media (max-width: 480px) {
		font-size: 1.6rem;
	}
`;

const Meta = styled.p`
	margin: 0.5rem 0 0;

	color: ${({ theme }) => theme.colors.muted};

	font-size: 0.95rem;
`;

const Status = styled.p`
	margin: 1.25rem 0 2rem;

	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;

	color: ${({ theme }) => theme.colors.accent};
`;

const Controls = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;

	gap: 1.4rem;

	margin-top: 0.5rem;
`;

const ControlButton = styled.button`
	width: 64px;
	height: 64px;

	border-radius: 50%;
	border: none;

	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'rgba(255,255,255,0.12)'
			: 'rgba(0,0,0,0.08)'};

	color: ${({ theme }) => theme.colors.text};

	font-size: 1.2rem;

	transition: 0.2s ease;

	&:hover {
		transform: scale(1.08);
	}

	@media (max-width: 480px) {
		width: 58px;
		height: 58px;
	}
`;

const MainPlayButton = styled(ControlButton)`
	width: 82px;
	height: 82px;

	background: ${({ theme }) => theme.colors.accent};
	color: #fff;

	font-size: 1.4rem;

	@media (max-width: 480px) {
		width: 72px;
		height: 72px;
	}
`;

const getFlag = (country) => {
	if (country === 'UK') return '🇬🇧';
	if (country === 'PL') return '🇵🇱';
	return '🌍';
};

export default function NowPlaying() {
	const navigate = useNavigate();

	const { currentStation, isPlaying, togglePlay, nextStation, prevStation } =
		useAudio();

	if (!currentStation?.name) {
		return (
			<Wrapper>
				<PlayerCard>
					<p>Loading station...</p>
				</PlayerCard>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			<PlayerCard>
				<TopBar>
					<IconButton onClick={() => navigate('/')} aria-label='Back to home'>
						<FaHome />
					</IconButton>

					<CarBadge>
						<FaCarSide />
						Car Mode
					</CarBadge>
				</TopBar>

				<LogoWrapper>
					<StationLogo src={currentStation.logo} alt={currentStation.name} />
				</LogoWrapper>

				<StationName>{currentStation.name}</StationName>

				<Meta>
					{getFlag(currentStation.country)} • {currentStation.genre}
				</Meta>

				<Status>Streaming Live</Status>

				<Controls>
					<ControlButton onClick={prevStation} aria-label='Previous station'>
						<FaStepBackward />
					</ControlButton>

					<MainPlayButton onClick={togglePlay} aria-label='Play or pause'>
						{isPlaying ? <FaPause /> : <FaPlay />}
					</MainPlayButton>

					<ControlButton onClick={nextStation} aria-label='Next station'>
						<FaStepForward />
					</ControlButton>
				</Controls>
			</PlayerCard>
		</Wrapper>
	);
}
