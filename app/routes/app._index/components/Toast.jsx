import { useTranslation } from "react-i18next";

export function Toast({ message, isError, onDismiss }) {
  const { t } = useTranslation();

  if (!message) return null;

  const tone = isError ? "critical" : "success";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        minWidth: "300px",
        maxWidth: "500px",
      }}
    >
      <s-banner
        heading={isError ? t("toast.error") : t("toast.success")}
        tone={tone}
        dismissible
        onDismiss={onDismiss}
      >
        {message}
      </s-banner>
    </div>
  );
}
