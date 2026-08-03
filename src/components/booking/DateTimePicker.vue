<template>
  <Teleport to="body">
    <div v-if="visible" class="dt-overlay" @click.self="onCancel">
      <div class="dt-panel">
        <!-- 头部 -->
        <div class="dt-hdr">
          <button class="dt-hdr-btn" @click="onCancel">取消</button>
          <span class="dt-hdr-time">{{ String(localHour).padStart(2,'0') }}:{{ String(localMinute).padStart(2,'0') }}</span>
          <button class="dt-hdr-btn dt-hdr-done" @click="onConfirm">完成</button>
        </div>

        <!-- 月份导航 -->
        <div class="dt-month">
          <button class="dt-m-btn" @click="prevMonth">‹</button>
          <span class="dt-m-txt">{{ navYear }}年{{ navMonth }}月</span>
          <button class="dt-m-btn" @click="nextMonth">›</button>
        </div>

        <!-- 星期 -->
        <div class="dt-wk">
          <span v-for="w in wds" :key="w" class="dt-wk-l">{{ w }}</span>
        </div>

        <!-- 日期网格 -->
        <div class="dt-g">
          <div v-for="(c,i) in cells" :key="i" class="dt-c" :class="c.cls" @click="c.cb">
            <span v-if="c.l" class="dt-c-n">{{ c.l }}</span>
          </div>
        </div>

        <!-- 时间 -->
        <div class="dt-t">
          <div class="dt-tc">
            <button class="dt-tb" @click="adh(1)"><span>▲</span></button>
            <span class="dt-tv">{{ String(localHour).padStart(2,'0') }}</span>
            <button class="dt-tb" @click="adh(-1)"><span>▼</span></button>
          </div>
          <span class="dt-tsep">:</span>
          <div class="dt-tc">
            <button class="dt-tb" @click="adm(1)"><span>▲</span></button>
            <span class="dt-tv">{{ String(localMinute).padStart(2,'0') }}</span>
            <button class="dt-tb" @click="adm(-1)"><span>▼</span></button>
          </div>
        </div>

        <!-- 底部 -->
        <div class="dt-ft">
          <button class="dt-now" @click="setToNow">回到今天</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toDateString } from '@/utils/format'

const props = defineProps<{ date: string; time: string; visible: boolean }>()
const emit = defineEmits<{ (e:'update:date',v:string):void; (e:'update:time',v:string):void; (e:'close'):void }>()

const localDate = ref(props.date)
const localHour = ref(0)
const localMinute = ref(0)
const navYear = ref(0)
const navMonth = ref(0)
const wds = ['一','二','三','四','五','六','日']

function init() {
  localDate.value = props.date
  const [h,m] = props.time.split(':').map(Number)
  localHour.value=h; localMinute.value=m
  const d = parseDate(props.date)
  navYear.value=d.getFullYear(); navMonth.value=d.getMonth()+1
}

function parseDate(s:string){const[y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d)}
function toStr(y:number,m:number,d:number){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}

const cells = computed(() => {
  const y=navYear.value,m=navMonth.value,cnt=new Date(y,m,0).getDate()
  const fd=new Date(y,m-1,1).getDay(),off=fd===0?6:fd-1
  const ts=toDateString(new Date()),now=new Date()
  const td=new Date(now.getFullYear(),now.getMonth(),now.getDate())
  type C={l:number|'';cls:string[];cb:()=>void};const r:C[]=[]
  for(let i=0;i<off;i++) r.push({l:'',cls:['dt-c--e'],cb:()=>{}})
  for(let d=1;d<=cnt;d++){
    const ds=toStr(y,m,d),ob=new Date(y,m-1,d)
    const today=ds===ts,future=ob>td,sel=ds===localDate.value
    const cls=['dt-c--d']
    if(sel) cls.push('dt-c--s')
    else if(today) cls.push('dt-c--t')
    if(future) cls.push('dt-c--f')
    r.push({l:d,cls,cb:()=>{if(!future)localDate.value=ds}})
  }
  return r
})

function prevMonth(){if(navMonth.value===1){navYear.value--;navMonth.value=12}else navMonth.value--;adj()}
function nextMonth(){if(navMonth.value===12){navYear.value++;navMonth.value=1}else navMonth.value++;adj()}
function adj(){const ld2=new Date(navYear.value,navMonth.value,0).getDate(),cd=parseDate(localDate.value).getDate();if(cd>ld2)localDate.value=toStr(navYear.value,navMonth.value,ld2)}
function adh(d:number){const v=localHour.value+d;if(v>=0&&v<=23)localHour.value=v}
function adm(d:number){const v=localMinute.value+d;if(v>=0&&v<=59)localMinute.value=v}
function setToNow(){const n=new Date();localDate.value=toDateString(n);localHour.value=n.getHours();localMinute.value=n.getMinutes();navYear.value=n.getFullYear();navMonth.value=n.getMonth()+1}
function onConfirm(){emit('update:date',localDate.value);emit('update:time',`${String(localHour.value).padStart(2,'0')}:${String(localMinute.value).padStart(2,'0')}`);emit('close')}
function onCancel(){emit('close')}
watch(()=>props.visible,v=>{if(v)init()},{immediate:true})
watch(()=>props.date,v=>{if(!props.visible)localDate.value=v})
watch(()=>props.time,v=>{if(!props.visible){const[h,m]=v.split(':').map(Number);localHour.value=h;localMinute.value=m}})
</script>

<style scoped>
.dt-overlay{position:fixed;inset:0;background:var(--color-overlay);z-index:1000;display:flex;align-items:flex-end;justify-content:center}
.dt-panel{width:100%;max-width:480px;background:var(--color-surface);border-radius:16px 16px 0 0;padding:12px 16px 20px;max-height:80vh;overflow-y:auto}

/* 头部 */
.dt-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.dt-hdr-btn{border:none;background:none;font-size:15px;color:var(--color-secondary-text);cursor:pointer;padding:4px 0;font-family:inherit}
.dt-hdr-done{color:var(--color-primary);font-weight:600}
.dt-hdr-time{font-size:14px;font-weight:700;color:var(--color-text);font-variant-numeric:tabular-nums;letter-spacing:.5px}

/* 月份 */
.dt-month{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:10px}
.dt-m-btn{width:28px;height:28px;border:none;border-radius:50%;background:var(--color-separator);font-size:16px;color:var(--color-secondary-text);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.dt-m-btn:active{background:var(--color-separator-heavy)}
.dt-m-txt{font-size:15px;font-weight:600;color:var(--color-text);min-width:100px;text-align:center}

/* 星期 */
.dt-wk{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:2px}
.dt-wk-l{text-align:center;font-size:11px;font-weight:500;color:var(--color-secondary-text);padding:4px 0}

/* 网格 */
.dt-g{display:grid;grid-template-columns:repeat(7,1fr)}
.dt-c{aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none}
.dt-c:active:not(.dt-c--e):not(.dt-c--f){transform:scale(.88)}
.dt-c--e{cursor:default}
.dt-c--f{cursor:not-allowed}
.dt-c-n{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:14px;color:var(--color-text);transition:all.12s}
.dt-c--t .dt-c-n{color:var(--color-primary);font-weight:600}
.dt-c--s .dt-c-n{background:var(--color-primary);color:#fff;font-weight:600}
.dt-c--f .dt-c-n{color:var(--color-separator-heavy)}

/* 时间 */
.dt-t{display:flex;align-items:center;justify-content:center;gap:4px;padding:12px 0 8px;margin-top:4px;border-top:1px solid var(--color-separator)}
.dt-tc{display:flex;flex-direction:column;align-items:center;gap:2px;width:72px}
.dt-tb{width:32px;height:32px;border:none;border-radius:50%;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.dt-tb span{font-size:11px;color:var(--color-secondary-text);line-height:1}
.dt-tb:active{background:var(--color-separator)}
.dt-tv{font-size:28px;font-weight:700;color:var(--color-text);font-variant-numeric:tabular-nums;text-align:center;line-height:1.2;padding:4px 0}
.dt-tsep{font-size:24px;font-weight:600;color:var(--color-secondary-text);margin-bottom:36px}

/* 底部 */
.dt-ft{display:flex;justify-content:center;padding:4px 0 0}
.dt-now{border:none;background:none;color:var(--color-primary);font-size:13px;font-weight:600;cursor:pointer;padding:6px 16px;font-family:inherit;opacity:.8}
.dt-now:active{opacity:1}
</style>