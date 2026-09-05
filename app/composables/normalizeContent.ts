export function normalizeContent(html: string): string {
  if (!html) return ''
  let result = html.replace(
    /!\[([^\]]*)\]\(\s*(\/api\/media\/uploads\/[^\s)]+)\s*\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;">',
  )
  result = result.replace(
    /!\[\]\(\s*(\/api\/media\/uploads\/[^\s)]+)\s*\)/g,
    '<img src="$1" alt="" style="max-width:100%;">',
  )
  return result
}
