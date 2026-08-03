<template>
  <Teleport to="body">
    <div v-if="visible" class="dt-overlay" @click.self="onCancel">
      <div class="dt-panel">
        <!-- 顶部操作栏 -->
        <div class="dt-hdr">
          <button class="dt-hdr-btn" @click="onCancel">取消</button>
          <div class="dt-hdr-selected">
            <span class="dt-hdr-date">{{ displayDate }}</span>
            <span class="dt-hdr-time">{{ displayTime }}</span>
          </div>
          <button class="dt-hdr-btn dt-hdr-done" @click="onConfirm">完成</button>
        </div>

        <!-- 主体 -->
        <div class="dt-body">
          <!-- ─── 日历 ─── -->
          <div class="dt-cal">
            <!-- 月份 -->
            <div class="dt-month">
              <button class="dt-arrow" @click="prevMonth">
                <svg width="9" height="14" viewBox="0 0 9 14"><path d="M7 12L2 7L7 2" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="dt-month-txt">
                <span class="dt-month-num">{{ navMonth }}</span>
                <span class="dt-month-unit">月</span>
                <span class="dt-month-num dt-month-num--yr">{{ navYear }}</span>
              </div>
              <button class="dt-arrow" @click="nextMonth">
                <svg width="9" height="14" viewBox="0 0 9 14"><path d="M2 12L7 7L2 2" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>

            <!-- 星期 -->
            <div class="dt-wk">
              <span v-for="w in weekdays" :key="w" class="dt-wk-lbl">{{ w }}</span>
            </div>

            <!-- 日期网格 -->
            <div class="dt-grd">
              <div v-for="(c, i) in calendarCells" :key="i" class="dt-cel" :class="c.cls" @click="c.cb">
                <template v-if="c.lb">
                  <span class="dt-cel-n">{{ c.lb }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- ─── 分隔 ─── -->
          <div class="dt-div">
            <div class="dt-div-line" />
            <div class="dt-div-dot" />
            <div class="dt-div-line" />
          </div>

          <!-- ─── 时间 ─── -->
          <div class="dt-tm">
            <!-- 小时 -->
            <div class="dt-tm-col">
              <span class="dt-tm-lbl">小时</span>
              <div class="dt-tm-strip">
                <button class="dt-tm-arrow" @click="adjustHour(1)" :class="{ 'dt-tm-arrow--d': localHour >= 23 }" :disabled="localHour >= 23">
                  <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 7L6 2L11 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                </button>
                <div class="dt-tm-context">
                  <span class="dt-tm-ctx dt-tm-ctx--prev">{{ String((localHour - 1 + 24) % 24).padStart(2, '0') }}</span>
                  <span class="dt-tm-val">{{ String(localHour).padStart(2, '0') }}</span>
                  <span class="dt-tm-ctx dt-tm-ctx--next">{{ String((localHour + 1) % 24).padStart(2, '0') }}</span>
                </div>
                <button class="dt-tm-arrow" @click="adjustHour(-1)" :class="{ 'dt-tm-arrow--d': localHour <= 0 }" :disabled="localHour <= 0">
                  <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>

            <span class="dt-tm-colon">:</span>

            <!-- 分钟 -->
            <div class="dt-tm-col">
              <span class="dt-tm-lbl">分钟</span>
              <div class="dt-tm-strip">
                <button class="dt-tm-arrow" @click="adjustMinute(1)" :class="{ 'dt-tm-arrow--d': localMinute >= 59 }" :disabled="localMinute >= 59">
                  <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 7L6 2L11 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                </button>
                <div class="dt-tm-context">
                  <span class="dt-tm-ctx dt-tm-ctx--prev">{{ String((localMinute - 1 + 60) % 60).padStart(2, '0') }}</span>
                  <span class="dt-tm-val">{{ String(localMinute).padStart(2, '0') }}</span>
                  <span class="dt-tm-ctx dt-tm-ctx--next">{{ String((localMinute + 1) % 60).padStart(2, '0') }}</span>
                </div>
                <button class="dt-tm-arrow" @click="adjustMinute(-1)" :class="{ 'dt-tm-arrow--d': localMinute <= 0 }" :disabled="localMinute <= 0">
                  <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="dt-foot">
          <button class="dt-now-btn" @click="setToNow">回到今天</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { toDateString, formatDate } from '@/utils/format'

const props = defineProps<{
  date: string
  time: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:date', value: string): void
  (e: 'update:time', value: string): void
  (e: 'close'): void
}>()

const localDate = ref(props.date)
const localHour = ref(0)
const localMinute = ref(0)
const navYear = ref(0)
const navMonth = ref(0)

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const displayDate = computed(() => {
  const d = formatDate(localDate.value)
  return d === '今天' ? '今天' : d === '昨天' ? '昨天' : d
})

const displayTime = computed(() => {
  return `${String(localHour.value).padStart(2, '0')}:${String(localMinute.value).padStart(2, '0')}`
})

function initLocal() {
  localDate.value = props.date
  const [h, m] = props.time.split(':').map(Number)
  localHour.value = h
  localMinute.value = m
  const d = pDate(props.date)
  navYear.value = d.getFullYear()
  navMonth.value = d.getMonth() + 1
}

function pDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function lds(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const calendarCells = computed(() => {
  const y = navYear.value, m = navMonth.value
  const cnt = new Date(y, m, 0).getDate()
  const fd = new Date(y, m - 1, 1).getDay()
  const off = fd === 0 ? 6 : fd - 1
  const ts = toDateString(new Date())
  const now = new Date()
  const td = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  type C = { lb: number | ''; cls: string[]; cb: () => void }
  const cells: C[] = []

  for (let i = 0; i < off; i++) cells.push({ lb: '', cls: ['dt-cel--e'], cb: () => {} })

  for (let d = 1; d <= cnt; d++) {
    const ds = lds(y, m, d)
    const ob = new Date(y, m - 1, d)
    const today = ds === ts
    const future = ob > td
    const sel = ds === localDate.value
    const wd = ob.getDay()
    const weekend = wd === 0 || wd === 6

    const cls = ['dt-cel--d']
    if (sel) cls.push('dt-cel--s')
    else if (today) cls.push('dt-cel--t')
    if (future) cls.push('dt-cel--f')
    if (weekend && !sel && !today) cls.push('dt-cel--w')

    cells.push({
      lb: d,
      cls,
      cb: () => { if (!future) localDate.value = ds },
    })
  }
  return cells
})

function prevMonth() {
  if (navMonth.value === 1) { navYear.value--; navMonth.value = 12 }
  else navMonth.value--
  adjDate()
}

function nextMonth() {
  if (navMonth.value === 12) { navYear.value++; navMonth.value = 1 }
  else navMonth.value++
  adjDate()
}

function adjDate() {
  const ld = new Date(navYear.value, navMonth.value, 0).getDate()
  const cd = pDate(localDate.value).getDate()
  if (cd > ld) localDate.value = lds(navYear.value, navMonth.value, ld)
}

function adjustHour(d: number) {
  const v = localHour.value + d
  if (v >= 0 && v <= 23) localHour.value = v
}

function adjustMinute(d: number) {
  const v = localMinute.value + d
  if (v >= 0 && v <= 59) localMinute.value = v
}

function setToNow() {
  const n = new Date()
  localDate.value = toDateString(n)
  localHour.value = n.getHours()
  localMinute.value = n.getMinutes()
  navYear.value = n.getFullYear()
  navMonth.value = n.getMonth() + 1
}

function onConfirm() {
  emit('update:date', localDate.value)
  emit('update:time', `${String(localHour.value).padStart(2, '0')}:${String(localMinute.value).padStart(2, '0')}`)
  emit('close')
}

function onCancel() { emit('close') }

watch(() => props.visible, (v) => { if (v) initLocal() }, { immediate: true })
watch(() => props.date, (v) => { if (!props.visible) localDate.value = v })
watch(() => props.time, (v) => {
  if (!props.visible) { const [h, m] = v.split(':').map(Number); localHour.value = h; localMinute.value = m }
})
</script>

<style scoped>
/* ============== 遮罩 ============== */
.dt-overlay {
  position: fixed; inset: 0;
  background: var(--color-overlay);
  z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
  animation: dtFade .2s;
}
@keyframes dtFade { from { opacity:0 } to { opacity:1 } }

/* ============== 面板 ============== */
.dt-panel {
  width: 100%; max-width: 480px;
  background: var(--color-surface);
  border-radius: 24px 24px 0 0;
  animation: dtUp .35s cubic-bezier(.32,.72,0,1);
  max-height: 88vh;
  display: flex; flex-direction: column;
}
@keyframes dtUp { from { transform:translateY(100%) } to { transform:translateY(0) } }

/* ============== 头部 ============== */
.dt-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px; flex-shrink: 0;
}
.dt-hdr-btn {
  border:none; background:transparent;
  font-size:16px; color:var(--color-secondary-text);
  cursor:pointer; font-family:inherit; padding:4px 0;
  -webkit-tap-highlight-color:transparent;
}
.dt-hdr-done { color:var(--color-primary); font-weight:600; }
.dt-hdr-selected {
  display:flex; flex-direction:column; align-items:center; gap:2px;
}
.dt-hdr-date { font-size:13px; font-weight:500; color:var(--color-secondary-text); }
.dt-hdr-time { font-size:15px; font-weight:700; color:var(--color-primary); letter-spacing:1px; font-variant-numeric:tabular-nums; }

/* ============== 主体 ============== */
.dt-body {
  flex:1; overflow-y:auto; padding:0 20px 0;
  -webkit-overflow-scrolling:touch;
}

/* ============== 日历 ============== */
.dt-cal { padding:0 0 8px; }

/* 月份 */
.dt-month {
  display:flex; align-items:center; justify-content:center; gap:28px;
  padding:6px 0 14px;
}
.dt-arrow {
  width:36px; height:36px; display:flex; align-items:center; justify-content:center;
  border:none; border-radius:50%; background:transparent;
  color:var(--color-secondary-text); cursor:pointer;
  transition:background .15s, color .15s;
  -webkit-tap-highlight-color:transparent; font-family:inherit;
}
.dt-arrow:active { background:var(--color-separator); color:var(--color-primary); }
.dt-month-txt { font-size:17px; font-weight:600; color:var(--color-text); min-width:120px; text-align:center; }
.dt-month-num--yr { font-weight:400; opacity:.45; margin-left:4px; }

/* 星期行 */
.dt-wk {
  display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:4px;
}
.dt-wk-lbl {
  text-align:center; font-size:11px; font-weight:500;
  color:var(--color-secondary-text); padding:4px 0; line-height:1.2;
}

/* 网格 */
.dt-grd {
  display:grid; grid-template-columns:repeat(7,1fr); gap:0;
}
.dt-cel {
  aspect-ratio:1; display:flex; align-items:center; justify-content:center;
  cursor:pointer; user-select:none;
  -webkit-tap-highlight-color:transparent; position:relative;
}
.dt-cel:active:not(.dt-cel--e):not(.dt-cel--f) { transform:scale(.88); }
.dt-cel--e { cursor:default; }
.dt-cel-n {
  width:38px; height:38px; display:flex; align-items:center; justify-content:center;
  border-radius:50%; font-size:15px; font-weight:400; color:var(--color-text);
  line-height:1; transition:all .15s;
}
.dt-cel--t .dt-cel-n { color:var(--color-primary); font-weight:600; background:rgba(0,122,255,.07); }
.dt-cel--s .dt-cel-n { background:var(--color-primary); color:#fff; font-weight:700; box-shadow:0 2px 8px rgba(0,122,255,.35); }
.dt-cel--f .dt-cel-n { color:var(--color-separator-heavy); }
.dt-cel--f { cursor:not-allowed; }
.dt-cel--w:not(.dt-cel--t):not(.dt-cel--s) .dt-cel-n { color:var(--color-secondary-text); }

/* ============== 分隔线 ============== */
.dt-div {
  display:flex; align-items:center; gap:8px;
  padding:6px 0 10px;
}
.dt-div-line { flex:1; height:1px; background:var(--color-separator); }
.dt-div-dot { width:3px; height:3px; border-radius:50%; background:var(--color-separator-heavy); opacity:.5; }

/* ============== 时间 ============== */
.dt-tm {
  display:flex; align-items:flex-start; justify-content:center;
  padding:4px 0 12px; gap:0;
}
.dt-tm-col { display:flex; flex-direction:column; align-items:center; flex:1; max-width:130px; }
.dt-tm-lbl { font-size:11px; font-weight:500; color:var(--color-secondary-text); letter-spacing:2px; margin-bottom:10px; }

.dt-tm-strip {
  display:flex; flex-direction:column; align-items:center; gap:4px;
}

.dt-tm-arrow {
  width:36px; height:36px; display:flex; align-items:center; justify-content:center;
  border:none; border-radius:50%; background:var(--color-card);
  color:var(--color-secondary-text); cursor:pointer;
  transition:all .15s;
  -webkit-tap-highlight-color:transparent; font-family:inherit;
}
.dt-tm-arrow:active:not(.dt-tm-arrow--d) {
  background:var(--color-primary); color:#fff;
}
.dt-tm-arrow--d { opacity:.2; cursor:not-allowed; }

.dt-tm-context {
  display:flex; flex-direction:column; align-items:center;
  padding:4px 0;
}
.dt-tm-ctx { font-size:13px; font-weight:400; color:var(--color-text); opacity:.35; line-height:1.6; }
.dt-tm-val {
  font-size:30px; font-weight:700; color:var(--color-primary);
  font-variant-numeric:tabular-nums; line-height:1.15;
  min-width:50px; text-align:center;
}
.dt-tm-colon {
  font-size:28px; font-weight:700; color:var(--color-primary);
  padding-top:54px; flex-shrink:0; line-height:1;
}

/* ============== 底部 ============== */
.dt-foot {
  padding:6px 20px 24px; display:flex; justify-content:center; flex-shrink:0;
}
.dt-now-btn {
  border:none; background:rgba(0,122,255,.08);
  color:var(--color-primary); font-size:14px; font-weight:600;
  padding:10px 28px; border-radius:22px; cursor:pointer;
  transition:all .15s;
  -webkit-tap-highlight-color:transparent; font-family:inherit;
}
.dt-now-btn:active { background:rgba(0,122,255,.18); transform:scale(.96); }
</style>