import { usePwa } from '../../context/PwaContext';
import { useLanguage } from '../../context/LanguageContext';
export default function UpdateNotice() {
  const pwa = usePwa();
  const { t } = useLanguage();
  if (!pwa?.updateVisible) return null;
  return (
    <div className="update-notice" role="status">
      <p>{t('update.notice')}</p>
      <button type="button" onClick={pwa.dismissUpdate}>
        {t('update.later')}
      </button>
    </div>
  );
}
