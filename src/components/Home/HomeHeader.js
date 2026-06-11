import styled from 'styled-components';
import { FaGlobeEurope } from 'react-icons/fa';

const HeaderWrapper = styled.header`
	text-align: center;
	margin-bottom: 1.25rem;

	@media (max-width: 480px) {
		margin-bottom: 0.9rem;
	}
`;

const Title = styled.h1`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.7rem;

	margin: 0;

	font-size: 2rem;
	font-weight: 700;
	line-height: 1.1;

	color: ${({ theme }) => theme.colors.text};

	@media (max-width: 480px) {
		font-size: 1.65rem;
		gap: 0.5rem;
	}
`;

const Subtitle = styled.p`
	margin: 0.45rem 0 0;

	color: ${({ theme }) => theme.colors.muted};

	font-size: 0.95rem;
	line-height: 1.4;

	@media (max-width: 480px) {
		font-size: 0.8rem;
		max-width: 240px;
		margin-left: auto;
		margin-right: auto;
	}
`;

export default function HomeHeader() {
	return (
		<HeaderWrapper>
			<Title>
				<FaGlobeEurope />
				World Radio App
			</Title>

			<Subtitle>Live radio stations from around the world</Subtitle>
		</HeaderWrapper>
	);
}
