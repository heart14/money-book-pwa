import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TARGET = join(__dirname, '..', 'src', 'assets', 'twemoji')
const BASE = 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg'

// 所有需要覆盖的 emoji codepoint
const EMOJIS = [
  '1f4b3',                   // 💳
  '1f3e6',                   // 🏦
  '1f3e0',                   // 🏠
  '1f374',                   // 🍽️
  '1f697',                   // 🚗
  '1f6cd',                   // 🛍️
  '1f3ad',                   // 🎭
  '1f468-200d-1f469-200d-1f467', // 👨‍👩‍👧
  '1f91d',                   // 🤝
  '1f9ee',                   // 🧮
  '1f4bc',                   // 💼
  '1f4b0',                   // 💰
  '1f381',                   // 🎁
  '1f4c8',                   // 📈
  '1f3e1',                   // 🏡
  '1f4c1',                   // 📁
  '1f4cb',                   // 📋
  '1f4b8',                   // 💸
  '1f504',                   // 🔄
  '26a1',                    // ⚡
  '1f3f7',                   // 🏷️
  '1f4c2',                   // 📂
]

mkdirSync(TARGET, { recursive: true })

for (const cp of EMOJIS) {
  const url = `${BASE}/${cp}.svg`
  const dest = join(TARGET, `${cp}.svg`)
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const svg = await resp.text()
    writeFileSync(dest, svg, 'utf-8')
    console.log(`✓ ${cp}`)
  } catch (e) {
    console.error(`✗ ${cp}: ${e.message}`)
  }
}