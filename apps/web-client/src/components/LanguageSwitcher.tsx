import { useTranslation } from '../i18n';
import { LOCALE_LABELS, type Locale } from '../i18n/types';

const FLAG_EMOJI: Record<Locale, string> = {
  en: '🇬🇧',
  ar: '🇸🇦',
  pt: '🇧🇷',
  fa: '🇮🇷',
  tr: '🇹🇷',
  zh: '🇨🇳',
  hi: '🇮🇳',
  ru: '🇷🇺',
  de: '🇩🇪',
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="language-switcher">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="Select language"
        className="lang-select"
      >
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((key) => (
          <option key={key} value={key}>
            {FLAG_EMOJI[key]} {LOCALE_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}