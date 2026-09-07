import { useTranslation, type Lang } from '../i18n/context';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hu', label: 'Magyar' },
  { value: 'de', label: 'Deutsch' },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  return (
    <select
      className="language-switcher"
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
