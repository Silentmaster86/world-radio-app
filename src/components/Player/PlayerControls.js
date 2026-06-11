// src/components/Player/PlayerControls.js
import styled from 'styled-components';
import {
	FaPlay,
	FaPause,
	FaVolumeMute,
	FaVolumeUp,
	FaStepForward,
	FaStepBackward,
} from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';

const Controls = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${({ $compact }) => ($compact ? '0.5rem' : '1rem')};
`;

const HideOnMobile = styled.div`
	display: contents;

	@media (max-width: 480px) {
		display: ${({ $hide }) => ($hide ? 'none' : 'contents')};
	}
`;

const IconButton = styled.button`
	width: ${({ $compact }) => ($compact ? '36px' : '44px')};
	height: ${({ $compact }) => ($compact ? '36px' : '44px')};

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
	transition: 0.2s ease;

	&:hover {
		transform: scale(1.08);
		background: ${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.2)'
				: 'rgba(0,0,0,0.14)'};
	}
`;

const PlayButton = styled(IconButton)`
	background: ${({ theme }) => theme.colors.accent};
	color: #fff;
	border: none;

	&:hover {
		background: ${({ theme }) => theme.colors.accent};
	}
`;

const VolumeGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.55rem;

	@media (max-width: 480px) {
		width: 100%;
		justify-content: center;
	}
`;

const VolumeSlider = styled.input`
	width: ${({ $compact }) => ($compact ? '80px' : '120px')};

	@media (max-width: 480px) {
		width: 90px;
	}
`;

export default function PlayerControls({
	showVolume = true,
	compact = false,
	mobileMini = false,
}) {
	const {
		togglePlay,
		nextStation,
		prevStation,
		isPlaying,
		volume,
		changeVolume,
		muted,
		toggleMute,
	} = useAudio();

	return (
		<Controls $compact={compact}>
			<HideOnMobile $hide={mobileMini}>
				<IconButton $compact={compact} onClick={prevStation}>
					<FaStepBackward />
				</IconButton>
			</HideOnMobile>

			<PlayButton
				$main
				$compact={compact}
				onClick={togglePlay}
				aria-label='Play or pause'
			>
				{isPlaying ? <FaPause /> : <FaPlay />}
			</PlayButton>

			<HideOnMobile $hide={mobileMini}>
				<IconButton $compact={compact} onClick={nextStation}>
					<FaStepForward />
				</IconButton>
			</HideOnMobile>
		</Controls>
	);
}
