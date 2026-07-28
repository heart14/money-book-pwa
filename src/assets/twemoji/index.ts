// 通过 Vite import.meta.glob 将 SVGs 作为内联字符串打包
const modules = import.meta.glob('./*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export const emojiMap: Record<string, string> = {}
for (const [path, content] of Object.entries(modules)) {
  const name = path.replace('./', '').replace('.svg', '')
  emojiMap[name] = content
}

/** 根据 codepoint 获取 SVG 字符串 */
export function getSvgContent(codepoint: string): string | null {
  return emojiMap[codepoint] ?? null
}

/** 检查 codepoint 是否存在于 asset map */
export function hasSvg(codepoint: string): boolean {
  return codepoint in emojiMap
}