import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      style={{
        padding: "6px 12px",
        border: "1px solid #c9cccf",
        borderRadius: "6px",
        fontSize: "14px",
        backgroundColor: "#fff",
        cursor: "pointer",
      }}
      aria-label="Select language"
    >
      <option value="en">🇬🇧 English</option>
      <option value="fr">🇫🇷 Français</option>
      <option value="de">🇩🇪 Deutsch</option>
      <option value="es">🇪🇸 Español</option>
    </select>
  );
}
