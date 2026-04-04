import en from "./en.json"
import my from "./my.json"
import ar from "./ar.json"
import de from "./de.json"
import es from "./es.json"
import ja from "./ja.json"
import ko from "./ko.json"
import ru from "./ru.json"
import th from "./th.json"
import vi from "./vi.json"

export const translations: Record<string, any> = { en, my, ar, de, es, ja, ko, ru, th, vi }

function get(obj: any, path: string): string {
  const result = path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    const numKey = Number(key)
    if (!isNaN(numKey) && Array.isArray(acc)) return acc[numKey]
    return acc[key]
  }, obj)
  if (result === undefined || result === null) return path
  return String(result)
}

export function useTranslation(language: string) {
  const lang = translations[language] ? language : "en"
  const t = (key: string): string => get(translations[lang], key)
  return { t, lang }
}

export function addLanguage(code: string, translations_obj: Record<string, any>) {
  translations[code] = translations_obj
}