import styled from 'styled-components';
import { FaGlobeEurope } from 'react-icons/fa';

const HeaderWrapper = styled.div`
	text-align: center;
	margin-bottom: 1.5rem;
`;

const Title = styled.h1`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.75rem;

	margin: 0;

	font-size: 2rem;
	font-weight: 700;

	color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.p`
	margin-top: 0.5rem;

	color: ${({ theme }) => theme.colors.muted};

	font-size: 0.95rem;
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
