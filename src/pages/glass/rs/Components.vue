<template>
  <!-- 组件与状态库：把真实业务会用到的部件全部按「墨色账本」风格画出来，
       证明整套系统是自洽的，也作为后续落地业务页的视觉参照。 -->
  <div class="cg">
    <!-- ① 设计令牌 -->
    <section class="cg-sec">
      <div class="cg-title">设计令牌</div>
      <div class="cg-swatches">
        <div v-for="s in swatches" :key="s.n" class="cg-swatch">
          <span class="cg-swatch-chip" :style="{ background: s.c }"></span>
          <span class="cg-swatch-name">{{ s.n }}</span>
          <span class="cg-swatch-hex">{{ s.c }}</span>
        </div>
      </div>
      <div class="cg-note">原则：<b>全身唯一彩色 = 金额</b>（支出红 / 收入绿），其余全是墨与灰。少边框、少卡片，留白即分隔。</div>
    </section>

    <!-- ② 锁屏 -->
    <section class="cg-sec">
      <div class="cg-title">锁屏 PIN</div>
      <div class="cg-lock">
        <div class="cg-lock-badge">🔒</div>
        <div class="cg-lock-sub">已锁定 · 钱书</div>
        <div class="cg-lock-dots">
          <span v-for="i in 6" :key="i" class="cg-lock-dot" :class="{ f: i <= 3 }"></span>
        </div>
        <div class="cg-keypad">
          <button v-for="k in [1,2,3,4,5,6,7,8,9]" :key="k" class="cg-key">{{ k }}</button>
          <button class="cg-key cg-key--blank"></button>
          <button class="cg-key">0</button>
          <button class="cg-key cg-key--del">⌫</button>
        </div>
      </div>
    </section>

    <!-- ③ 弹窗 -->
    <section class="cg-sec">
      <div class="cg-title">弹窗</div>
      <div class="cg-two">
        <div class="cg-dialog">
          <div class="cg-dialog-title">确认删除这条记录？</div>
          <div class="cg-dialog-body num">餐饮 · 午餐　<em class="c-exp">−¥25.00</em></div>
          <div class="cg-dialog-actions">
            <button class="cg-btn cg-btn--ghost">取消</button>
            <button class="cg-btn">删除</button>
          </div>
        </div>
        <div class="cg-dialog">
          <div class="cg-dialog-title">命名快记模板</div>
          <input class="cg-input" placeholder="请输入模板名称" />
          <div class="cg-dialog-actions">
            <button class="cg-btn cg-btn--ghost">取消</button>
            <button class="cg-btn">保存</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ④ 底部面板 -->
    <section class="cg-sec">
      <div class="cg-title">底部面板</div>
      <div class="cg-sheet">
        <div class="cg-sheet-handle"></div>
        <div class="cg-sheet-title">选择日期</div>
        <div class="cg-sheet-rows">
          <div v-for="d in dates" :key="d" class="cg-sheet-row" :class="{ on: d === '今天' }">
            <span>{{ d }}</span><span class="cg-sheet-check">✓</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ⑤ 按钮 / 输入 / Chips -->
    <section class="cg-sec">
      <div class="cg-title">按钮 · 输入 · 筛选</div>
      <div class="cg-controls">
        <button class="cg-btn">主要操作</button>
        <button class="cg-btn cg-btn--ghost">次要操作</button>
        <button class="cg-btn cg-btn--danger c-exp">危险操作</button>
      </div>
      <input class="cg-input" placeholder="下划线输入框（标题/备注）" />
      <div class="cg-chips">
        <button class="cg-chip on">全部</button><button class="cg-chip">支出</button><button class="cg-chip">收入</button><button class="cg-chip">餐饮</button>
      </div>
    </section>

    <!-- ⑥ 空状态 -->
    <section class="cg-sec">
      <div class="cg-title">空状态</div>
      <div class="cg-empty">
        <span class="cg-empty-icon">🌤</span>
        <span class="cg-empty-t">还没有记录</span>
        <span class="cg-empty-s">点下方中央按钮，记下今天的第一笔</span>
      </div>
    </section>

    <!-- ⑦ 数据行 -->
    <section class="cg-sec">
      <div class="cg-title">数据行</div>
      <div class="cg-rows">
        <div v-for="(r, i) in rows" :key="i" class="cg-row">
          <span class="cg-row-icon">{{ r.icon }}</span>
          <div class="cg-row-mid"><b>{{ r.n }}</b><s>{{ r.s }}</s></div>
          <span class="num" :class="r.inc ? 'c-inc' : 'c-exp'">{{ r.inc ? '+' : '−' }}¥{{ r.a }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const swatches = [
  { n: '纸底', c: '#f3f4f5' },
  { n: '表面', c: '#ffffff' },
  { n: '墨', c: '#16181c' },
  { n: '次级墨', c: '#5d6570' },
  { n: '淡墨', c: '#9aa3ac' },
  { n: '分隔线', c: 'rgba(22,24,28,.09)' },
  { n: '收入绿', c: '#17a065' },
  { n: '支出红', c: '#d5503c' },
]
const dates = ['今天', '昨天', '本周', '本月']
const rows = [
  { icon: '🍱', n: '午餐', s: '餐饮 · 11:20', a: '25.00', inc: false },
  { icon: '💼', n: '工资', s: '工资奖金 · 09:00', a: '8000.00', inc: true },
]
</script>

<style scoped>
.cg { padding: 20px 24px 40px; }
.cg-sec { margin-bottom: 34px; }
.cg-title { font-size: 12px; font-weight: 700; color: var(--ink2); letter-spacing: 1px; margin-bottom: 14px; }
.cg-note { font-size: 13px; color: var(--ink2); line-height: 1.7; margin-top: 12px; }
.cg-note b { color: var(--ink); }

/* swatches */
.cg-swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.cg-swatch { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 84px; }
.cg-swatch-chip { width: 100%; height: 52px; border-radius: 12px; border: 1px solid var(--line); }
.cg-swatch-name { font-size: 12px; color: var(--ink); font-weight: 600; }
.cg-swatch-hex { font-size: 10px; color: var(--ink3); }

/* lock */
.cg-lock { display: flex; flex-direction: column; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: 22px; padding: 30px 24px 24px; }
.cg-lock-badge { font-size: 30px; }
.cg-lock-sub { font-size: 13px; color: var(--ink2); margin: 8px 0 20px; }
.cg-lock-dots { display: flex; gap: 14px; margin-bottom: 26px; }
.cg-lock-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink3); }
.cg-lock-dot.f { background: var(--ink); border-color: var(--ink); }
.cg-keypad { display: grid; grid-template-columns: repeat(3, 62px); gap: 14px 12px; justify-content: center; }
.cg-key { height: 62px; border-radius: 50%; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font-size: 24px; font-weight: 600; }
.cg-key--blank { border: none; background: none; }
.cg-key--del { font-size: 18px; color: var(--ink2); }

/* dialogs */
.cg-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.cg-dialog { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 20px; }
.cg-dialog-title { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
.cg-dialog-body { font-size: 14px; color: var(--ink2); margin-bottom: 18px; }
.cg-dialog-body em { font-style: normal; font-size: 13px; margin-left: 8px; }
.cg-dialog-actions { display: flex; gap: 10px; margin-top: 16px; }
.cg-dialog-actions .cg-btn { flex: 1; }

/* sheet */
.cg-sheet { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 10px 20px 8px; }
.cg-sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--ink3); opacity: 0.5; margin: 4px auto 14px; }
.cg-sheet-title { font-size: 15px; font-weight: 600; text-align: center; color: var(--ink); margin-bottom: 10px; }
.cg-sheet-row { display: flex; justify-content: space-between; padding: 14px 2px; font-size: 15px; color: var(--ink); border-bottom: 1px solid var(--line); }
.cg-sheet-row:last-child { border-bottom: none; }
.cg-sheet-row.on { font-weight: 600; }
.cg-sheet-check { color: var(--ink); }

/* buttons / inputs / chips */
.cg-controls { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.cg-btn { height: 46px; padding: 0 22px; border: none; border-radius: 12px; background: var(--ink); color: var(--accent-fg); font-size: 15px; font-weight: 600; }
.cg-btn--ghost { background: none; border: 1px solid var(--line); color: var(--ink); }
.cg-btn--danger { background: none; border: 1px solid var(--line); color: var(--exp); }
.cg-input { width: 100%; padding: 14px 2px; border: none; border-bottom: 1px solid var(--line); background: none; font-size: 15px; color: var(--ink); outline: none; margin-bottom: 16px; }
.cg-input::placeholder { color: var(--ink3); }
.cg-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.cg-chip { padding: 8px 16px; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 13px; color: var(--ink2); }
.cg-chip.on { background: var(--ink); border-color: var(--ink); color: var(--accent-fg); }

/* empty */
.cg-empty { text-align: center; padding: 40px 20px; background: var(--surface); border: 1px dashed var(--line); border-radius: 18px; }
.cg-empty-icon { font-size: 40px; }
.cg-empty-t { display: block; font-size: 15px; font-weight: 600; color: var(--ink); margin: 12px 0 4px; }
.cg-empty-s { font-size: 13px; color: var(--ink3); }

/* data rows */
.cg-rows { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 4px 16px; }
.cg-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; }
.cg-row + .cg-row { border-top: 1px solid var(--line); }
.cg-row-icon { font-size: 20px; }
.cg-row-mid { flex: 1; min-width: 0; }
.cg-row-mid b { display: block; font-size: 15px; font-weight: 600; color: var(--ink); }
.cg-row-mid s { display: block; font-size: 11px; color: var(--ink3); text-decoration: none; margin-top: 1px; }

.c-inc { color: var(--inc); }
.c-exp { color: var(--exp); }
</style>