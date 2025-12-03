import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";
import i18n from "./i18n";
import "./i18n";

export default function App() {
  // Start with "en" to match server render
  // useEffect will update if localStorage has a different language
  const [language, setLanguage] = useState("en");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on client to avoid hydration mismatch
    setIsClient(true);

    // Now safely set language from i18n (which detects localStorage/navigator)
    const detectedLanguage = i18n.language || "en";
    if (detectedLanguage !== "en") {
      setLanguage(detectedLanguage);
    }

    // Listen for language changes
    const handleLanguageChanged = () => {
      setLanguage(i18n.language || "en");
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@shopify/polaris@latest/build/esm/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
