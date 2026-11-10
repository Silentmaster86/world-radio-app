import styled from 'styled-components';
import { usePwa } from '../../context/PwaContext';
import { useLanguage } from '../../context/LanguageContext';
const Notice = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
  p {
    flex: 1 1 220px;
    margin: 0;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.6rem;
  }
`;
export default function UpdateNotice() {
  const pwa = usePwa();
  const { t } = useLanguage();
  if (!pwa?.updateVisible) return null;
  return (
    <Notice role="status">
      <p>{t('update.notice')}</p>
      <button type="button" onClick={pwa.dismissUpdate}>
        {t('update.later')}
      </button>
    </Notice>
  );
}
