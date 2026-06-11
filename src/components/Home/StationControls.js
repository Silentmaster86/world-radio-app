import { FaSun, FaMoon } from 'react-icons/fa';
import styled from 'styled-components';

const ControlsWrapper = styled.div`
	margin-bottom: ${({ theme }) => theme.spacing.md};
	display: flex;
	flex-direction: column;
	gap: 0.9rem;

	@media (max-width: 480px) {
		gap: 0.75rem;
	}
`;

const FilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.7rem;
	justify-content: center;

	@media (max-width: 480px) {
		gap: 0.55rem;
	}
`;

const SearchRow = styled.div`
	display: flex;
	justify-content: center;
`;

const FilterButton = styled.button`
	padding: 0.45rem 0.8rem;
	border-radius: ${({ theme }) => theme.borderRadius.full};

	background: ${({ $active, theme }) =>
		$active
			? theme.colors.accent
			: theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.1)'
				: 'rgba(0,0,0,0.08)'};

	color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text)};

	border: 1px solid
		${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.08)'
				: 'rgba(0,0,0,0.08)'};

	font-size: 0.8rem;
	font-weight: 700;
	cursor: pointer;

	transition: 0.25s ease;

	&:hover {
		transform: translateY(-1px);
	}
`;

const ToggleButton = styled.button`
	padding: 0.45rem 0.8rem;
	border: 1px solid
		${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.12)'
				: 'rgba(0,0,0,0.2)'};

	border-radius: ${({ theme }) => theme.borderRadius.full};

	background: ${({ theme }) =>
		theme.colors.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff'};

	color: ${({ theme }) => theme.colors.text};

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
	width: min(100%, 280px);
	padding: 0.65rem 0.9rem;

	border-radius: ${({ theme }) => theme.borderRadius.md};

	border: 1px solid
		${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.1)'
				: 'rgba(0,0,0,0.18)'};

	outline: none;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#ffffff'};

	color: ${({ theme }) => theme.colors.text};

	box-shadow: ${({ theme }) =>
		theme.colors.mode === 'dark' ? 'none' : '0 6px 18px rgba(0,0,0,0.08)'};

	&::placeholder {
		color: ${({ theme }) =>
			theme.colors.mode === 'dark'
				? 'rgba(255,255,255,0.55)'
				: 'rgba(0,0,0,0.45)'};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.accent};
		box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.18);
	}
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
		</ControlsWrapper>
	);
}
