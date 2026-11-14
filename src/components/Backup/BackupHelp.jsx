import { useLanguage } from '../../context/LanguageContext';
import { backupMessage } from './messages';
export default function BackupHelp({ showHeading = true }) {
  const { language } = useLanguage();
  const t = (key) => backupMessage(language, key);
  return (
    <section className="backup-help" aria-label={t('faqTitle')} data-backup-help>
      {showHeading && <h4>{t('faqTitle')}</h4>}
      <details>
        <summary>{t('transferQ')}</summary>
        <ol>
          {[1, 2, 3, 4].map((step) => (
            <li key={step}>{t(`transfer${step}`)}</li>
          ))}
        </ol>
      </details>
      {['contents', 'recovery', 'offline'].map((topic) => (
        <details key={topic}>
          <summary>{t(`${topic}Q`)}</summary>
          <p>{t(`${topic}A`)}</p>
        </details>
      ))}
    </section>
  );
}
