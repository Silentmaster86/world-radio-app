import styled from 'styled-components';
export const LibraryPage = styled.main.attrs({ className: 'library-page' })`
  max-width: 900px;
  margin: auto;
  padding: 1rem;
  h1 {
    font-size: clamp(1.4rem, 5vw, 2rem);
    overflow-wrap: anywhere;
  }
  h2 {
    font-size: 1.25rem;
    margin-top: 2rem;
  }
  h3 {
    font-size: 1rem;
    margin: 0;
    overflow-wrap: anywhere;
  }
  p {
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  ul {
    padding: 0;
    list-style: none;
  }
  li,
  .station-detail {
    padding: 1rem;
    margin: 0.75rem 0;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 1rem;
    background: ${({ theme }) => theme.colors.surface};
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: start;
    margin-top: 0.75rem;
  }
  button,
  select,
  input {
    font: inherit;
    color: inherit;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.muted};
    border-radius: 0.6rem;
    min-height: 44px;
    min-width: 44px;
    max-width: 100%;
    padding: 0.5rem 0.75rem;
  }
  button {
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  label {
    display: grid;
    gap: 0.5rem;
    margin: 0.75rem 0;
  }
  input,
  select {
    width: 100%;
  }
  .actions button {
    min-width: 44px;
  }
  .share-station {
    min-width: 0;
    max-width: 100%;
  }
  .share-station input {
    min-width: 0;
  }
  .confirmation {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin-top: 1rem;
    padding-top: 0.75rem;
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
`;
