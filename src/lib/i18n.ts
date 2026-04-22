import { NextRequest } from "next/server";

export async function getLocaleFromRequest(req: NextRequest) {
  // 1. Check NEXT_LOCALE cookie
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && ["en", "ml", "hi"].includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const acceptLang = req.headers.get("accept-language");
  if (acceptLang) {
    if (acceptLang.includes("ml")) return "ml";
    if (acceptLang.includes("hi")) return "hi";
  }

  return "en"; // Default
}

// Simple backend translator
export async function getBackendTranslations(locale: string) {
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return messages;
  } catch {
    return (await import(`../../messages/en.json`)).default;
  }
}
