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
	gap: ${({ $compact, $car }) => ($car ? '1.4rem' : $compact ? '0.5rem' : '1rem')};
	flex-wrap: wrap;
	@media (max-width: 480px) { gap: 0.5rem; }
`;

const HideOnMobile = styled.div`
	display: contents;

	@media (max-width: 640px) {
		display: ${({ $hide }) => ($hide ? 'none' : 'contents')};
	}
`;

const IconButton = styled.button`
	width: ${({ $car }) => ($car ? '64px' : '44px')};
	height: ${({ $car }) => ($car ? '64px' : '44px')};
	flex-shrink: 0;
	@media (max-width: 480px) {
		width: ${({ $car }) => ($car ? '58px' : '44px')};
		height: ${({ $car }) => ($car ? '58px' : '44px')};
	}

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
	width: ${({ $car }) => ($car ? '82px' : '44px')};
	height: ${({ $car }) => ($car ? '82px' : '44px')};
	@media (max-width: 480px) {
		width: ${({ $car }) => ($car ? '72px' : '44px')};
		height: ${({ $car }) => ($car ? '72px' : '44px')};
	}
	background: ${({ theme }) => theme.colors.accent};
	color: ${({ theme }) => theme.colors.onAccent};
	border: none;

	&:hover {
		background: ${({ theme }) => theme.colors.accent};
	}
`;

const VolumeGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.55rem;
	flex-basis: ${({ $mini }) => $mini ? 'auto' : '100%'};
	justify-content: center;

	@media (max-width: 640px) {
		display: ${({ $mini }) => $mini ? 'none' : 'flex'};
		width: 100%;
		justify-content: center;
	}
`;

const VolumeSlider = styled.input`
	width: ${({ $compact }) => ($compact ? '80px' : '120px')};
	min-height: 44px;

	@media (max-width: 480px) {
		width: 90px;
	}
`;

export default function PlayerControls({
	showVolume = true,
	compact = false,
	mobileMini = false,
	variant = 'default',
}) {
	const {
		togglePlay,
		nextStation,
		prevStation,
		wantsToPlay,
		status,
		volume,
		changeVolume,
		muted,
		toggleMute,
		canChangeVolume,
	} = useAudio();

	return (
		<Controls $compact={compact} $car={variant === 'car'} role='group' aria-label='Playback controls'>
			<HideOnMobile $hide={mobileMini}>
				<IconButton type='button' $car={variant === 'car'} onClick={prevStation} aria-label='Previous station'>
					<FaStepBackward aria-hidden='true' />
				</IconButton>
			</HideOnMobile>

			<PlayButton
				$main
				$compact={compact}
				$car={variant === 'car'}
				type='button'
				onClick={togglePlay}
				aria-label={wantsToPlay ? status === 'connecting' ? 'Cancel connection' : 'Pause' : 'Play'}
			>
				{wantsToPlay ? <FaPause aria-hidden='true' /> : <FaPlay aria-hidden='true' />}
			</PlayButton>

			<HideOnMobile $hide={mobileMini}>
				<IconButton type='button' $car={variant === 'car'} onClick={nextStation} aria-label='Next station'>
					<FaStepForward aria-hidden='true' />
				</IconButton>
			</HideOnMobile>
			{showVolume && <VolumeGroup $mini={mobileMini} role='group' aria-label='Volume controls'>
				<IconButton type='button' onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
					{muted ? <FaVolumeMute aria-hidden='true' /> : <FaVolumeUp aria-hidden='true' />}
				</IconButton>
				{canChangeVolume !== false ? <>
					<VolumeSlider type='range' min='0' max='1' step='0.01' value={volume} aria-label='Volume' aria-valuetext={`${Math.round(volume * 100)}%`} onChange={(event) => changeVolume(Number(event.target.value))} />
					<span aria-hidden='true'>{Math.round(volume * 100)}%</span>
				</> : <small>Use device volume controls</small>}
			</VolumeGroup>}
		</Controls>
	);
}
