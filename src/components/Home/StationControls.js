import { FaSun, FaMoon } from 'react-icons/fa';
import styled from 'styled-components';

const ControlsWrapper = styled.div`
	margin-bottom: ${({ theme }) => theme.spacing.md};
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const LeftControls = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;

	@media (min-width: 660px) {
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}
`;

const FilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	justify-content: center;
`;

const SearchRow = styled.div`
	display: flex;
	justify-content: center;
`;

const FilterButton = styled.button`
	padding: 0.5rem 0.8rem;
	border-radius: ${({ theme }) => theme.borderRadius.full};

	background: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.1)')};

	color: ${({ $active }) => ($active ? '#000' : '#fff')};

	border: none;
	font-weight: 600;
	cursor: pointer;
`;

const ToggleButton = styled.button`
	padding: 0.5rem 1rem;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.full};

	background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.1)' : '#fff')};

	color: ${({ $dark }) => ($dark ? '#fff' : '#000')};

	cursor: pointer;
`;

const ToggleThumb = styled.div`
	width: 1rem;
	height: 1rem;

	border-radius: 50%;
	background: ${({ theme }) => theme.colors.accent};

	display: flex;
	align-items: center;
	justify-content: center;

	color: white;
`;

const SearchInput = styled.input`
	padding: 0.5rem 0.8rem;

	width: 250px;

	border: none;
	outline: none;

	border-radius: ${({ theme }) => theme.borderRadius.md};

	background: #2d2d2d;
	color: white;
`;

export default function StationControls({
	filters,
	filter,
	setFilter,
	query,
	setQuery,
	isDarkMode,
	toggleTheme,
}) {
	return (
		<ControlsWrapper>
			<LeftControls>
				<FilterRow>
					{filters.map((f) => (
						<FilterButton
							key={f}
							$active={filter === f}
							onClick={() => setFilter(f)}
						>
							{f}
						</FilterButton>
					))}

					<ToggleButton onClick={toggleTheme} $dark={isDarkMode}>
						<ToggleThumb>
							{isDarkMode ? <FaMoon size={12} /> : <FaSun size={12} />}
						</ToggleThumb>
					</ToggleButton>
				</FilterRow>

				<SearchRow>
					<SearchInput
						type='text'
						placeholder='🔍 Search stations...'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</SearchRow>
			</LeftControls>
		</ControlsWrapper>
	);
}
