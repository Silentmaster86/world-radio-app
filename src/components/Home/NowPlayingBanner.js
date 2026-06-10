import styled from 'styled-components';
import { FaBroadcastTower } from 'react-icons/fa';

const Banner = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;

	padding: 1rem;

	margin-bottom: 1.5rem;

	border-radius: ${({ theme }) => theme.borderRadius.lg};

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'rgba(255,255,255,0.05)'
			: theme.colors.surface};

	backdrop-filter: blur(12px);

	border: 1px solid rgba(255, 255, 255, 0.08);

	box-shadow:
		0 0 10px rgba(236, 72, 153, 0.15),
		0 0 20px rgba(236, 72, 153, 0.1);
`;

const Logo = styled.img`
	width: 60px;
	height: 60px;
	border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Info = styled.div`
	flex: 1;
`;

const Label = styled.div`
	font-size: 0.75rem;
	opacity: 0.7;
	text-transform: uppercase;
`;

const Name = styled.div`
	font-size: 1.2rem;
	font-weight: 700;
`;

export default function NowPlayingBanner({ station }) {
	if (!station) return null;

	return (
		<Banner>
			<Logo src={station.logo} alt={station.name} />

			<Info>
				<Label>Now Playing</Label>
				<Name>{station.name}</Name>
			</Info>

			<FaBroadcastTower size={20} />
		</Banner>
	);
}
