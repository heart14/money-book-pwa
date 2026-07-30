const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Emoji → expected Iconify icon name mapping
const emojiList = {
  '💳': 'credit-card',                 // U+1F4B3
  '🏠': 'house',                       // U+1F3E0
  '🍽️': 'fork-and-knife-with-plate',  // U+1F37D U+FE0F
  '🚗': 'automobile',                  // U+1F697
  '🛍️': 'shopping-bags',              // U+1F6CD U+FE0F
  '🎭': 'performing-arts',             // U+1F3AD
  '👨‍👩‍👧': 'family-man-woman-girl',   // U+1F468 ZWJ U+1F469 ZWJ U+1F467
  '🤝': 'handshake',                   // U+1F91D
  '🧮': 'abacus',                      // U+1F9EE
  '💼': 'briefcase',                   // U+1F4BC
  '💰': 'money-bag',                   // U+1F4B0
  '🎁': 'wrapped-gift',                // U+1F381
  '🏦': 'bank',                        // U+1F3E6
  '📈': 'chart-increasing',            // U+1F4C8
  '🏡': 'house-with-garden',           // U+1F3E1
  '📋': 'clipboard',                   // U+1F4CB
  '📁': 'file-folder',                 // U+1F4C1
  '💸': 'money-with-wings',            // U+1F4B8
};

const iconsPath = path.join(ROOT, 'node_modules/@iconify-json/twemoji/icons.json');
const charsPath = path.join(ROOT, 'node_modules/@iconify-json/twemoji/chars.json');

const icons = JSON.parse(fs.readFileSync(iconsPath, 'utf-8'));
const chars = JSON.parse(fs.readFileSync(charsPath, 'utf-8'));

// Try to resolve icons that have variation selector or ZWJ
// by looking up codepoints in chars.json
function resolveIconName(emoji) {
  // Extract codepoints from emoji (handle surrogates, ZWJ, VS16)
  const cps = [];
  for (let i = 0; i < emoji.length; i++) {
    const cp = emoji.codePointAt(i);
    if (cp <= 0xFFFF) {
      cps.push(cp.toString(16));
    } else {
      cps.push(cp.toString(16));
      i++; // skip low surrogate
    }
  }
  // Try without fe0f suffix first, then with
  const keys = [cps.join('-')];
  if (cps[cps.length - 1] === 'fe0f') {
    keys.unshift(cps.slice(0, -1).join('-'));
  }
  for (const key of keys) {
    if (chars[key]) return chars[key];
  }
  return null;
}

const iconMap = {};   // emoji → iconify name
const bundleData = {}; // iconify name → { body, width, height }

Object.entries(emojiList).forEach(([emoji, expectedName]) => {
  let name = null;

  // 1) Try expected name directly
  if (icons.icons[expectedName]) {
    name = expectedName;
  }

  // 2) Try looking up by codepoint
  if (!name) {
    name = resolveIconName(emoji);
  }

  // 3) Try all aliases
  if (!name) {
    const allAliases = Object.keys(icons.aliases || {});
    name = allAliases.find(a => a === expectedName) || null;
    if (name && icons.aliases[name]?.parent) {
      name = icons.aliases[name].parent;
    }
  }

  if (name && icons.icons[name]) {
    iconMap[emoji] = name;
    const data = icons.icons[name];
    bundleData[name] = {
      body: data.body,
      width: data.width || icons.width,
      height: data.height || icons.height,
    };
    console.log(`✅ ${emoji} -> ${name}`);
  } else {
    console.log(`❌ ${emoji} -> NOT FOUND`);
  }
});

// Generate TS bundle file
const tsContent = `// Auto-generated from @iconify-json/twemoji — DO NOT EDIT
import type { IconifyIcon } from '@iconify/vue'

export type EmojiIconName = ${Object.values(bundleData).length > 0
  ? Object.keys(bundleData).map(n => `'${n}'`).join(' | ')
  : 'string'}

export const iconByName: Record<EmojiIconName, IconifyIcon> = ${JSON.stringify(bundleData, null, 2)}

export const emojiToName: Record<string, EmojiIconName> = ${JSON.stringify(iconMap, null, 2)}
`;

const outPath = path.join(ROOT, 'src/utils/twemoji-bundle.ts');
fs.writeFileSync(outPath, tsContent, 'utf-8');
console.log(`\n✅ Generated bundle: ${outPath}`);
console.log(`   Icons: ${Object.keys(bundleData).length}`);
console.log(`   Size: ${Buffer.byteLength(tsContent, 'utf-8')} bytes`);