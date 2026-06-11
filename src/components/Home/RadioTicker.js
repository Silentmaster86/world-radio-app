import styled from 'styled-components';

const TickerWrapper = styled.div`
	margin-top: 2rem;
	overflow: hidden;
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'rgba(255,255,255,0.05)'
			: 'rgba(0,0,0,0.05)'};
`;

const TickerTrack = styled.div`
	display: inline-flex;
	white-space: nowrap;
	padding: 0.9rem 0;
	width: 100%;

	animation: scrollText 18s linear infinite;

	@keyframes scrollText {
		from {
			transform: translateX(100%);
		}

		to {
			transform: translateX(-100%);
		}
	}
`;

const TickerText = styled.span`
	padding-right: 3rem;
	font-size: 0.85rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.muted};
`;

export default function RadioTicker({ currentStation }) {
	const tickerText =
		currentStation?.ticker ||
		`LIVE • Now playing: ${currentStation?.name || 'World Radio App'} • ${
			currentStation?.genre || 'Live Radio'
		}`;

	return (
		<TickerWrapper>
			<TickerTrack key={currentStation?.name || 'default'}>
				<TickerText>{tickerText}</TickerText>
			</TickerTrack>
		</TickerWrapper>
	);
}
