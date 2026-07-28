/**
 * 将 Unicode emoji 转为 Twemoji codepoint 格式
 * '🏠' → '1f3e0'
 * '👨‍👩‍👧' → '1f468-200d-1f469-200d-1f467'
 * '🏷️' → '1f3f7' (FE0F 变体选择器被过滤)
 * '' → null
 * 'abc' → null
 */
export function emojiToCodepoint(emoji: string): string | null {
  if (!emoji) return null

  const parts: string[] = []
  for (const ch of emoji) {
    const cp = ch.codePointAt(0)
    if (cp === undefined) continue
    // 跳过变体选择器 U+FE0F (emoji presentation)
    if (cp === 0xFE0F) continue
    parts.push(cp.toString(16).toLowerCase())
  }

  return parts.length > 0 ? parts.join('-') : null
}