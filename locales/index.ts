import en from "./en.json"
import my from "./my.json"

export const translations: Record<string, any> = { en, my }

function get(obj: any, path: string): string {
  const result = path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    // Handle numeric keys for arrays
    const numKey = Number(key)
    if (!isNaN(numKey) && Array.isArray(acc)) {
      return acc[numKey]
    }
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