import HomeHeader from '../components/Home/HomeHeader';
import BackupHelp from '../components/Backup/BackupHelp';
import { useLanguage } from '../context/LanguageContext';
export default function Help() {
  const { t } = useLanguage();
  return (
    <main className="help-page">
      <HomeHeader back />
      <h1>{t('settings.help')}</h1>
      <BackupHelp showHeading={false} />
    </main>
  );
}
