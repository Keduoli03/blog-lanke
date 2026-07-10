export interface PostStats {
  words: number
  readingMinutes: number
}

export function countPostWords(body: string) {
  const plainText = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[\[[^\]]+\]\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[\[[^\]]+\]\]/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const cjkChars =
    plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length ?? 0
  const latinWords =
    plainText
      .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
      .match(/[A-Za-z0-9_]+/g)?.length ?? 0

  return cjkChars + latinWords
}

export function getPostStats(body: string): PostStats {
  const words = countPostWords(body)
  return {
    words,
    readingMinutes: Math.max(1, Math.ceil(words / 300)),
  }
}
