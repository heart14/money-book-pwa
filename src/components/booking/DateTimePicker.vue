<template>
  <Teleport to="body">
    <div v-if="visible" class="dt-mask" @click.self="onCancel">
      <div class="dt-box">
        <!-- Tab: 日期 | 时间 -->
        <div class="dt-tabs">
          <button class="dt-tab" :class="{'dt-tab--on':tab==='d'}" @click="tab='d'">日期</button>
          <button class="dt-tab" :class="{'dt-tab--on':tab==='t'}" @click="tab='t'">时间</button>
        </div>

        <!-- 日期面板 -->
        <div v-show="tab==='d'" class="dt-pane">
          <div class="dt-mbar">
            <button class="dt-ar" @click="prevMonth">‹</button>
            <span class="dt-mtxt">{{ navYear }}.{{ String(navMonth).padStart(2,'0') }}</span>
            <button class="dt-ar" @click="nextMonth">›</button>
          </div>
          <div class="dt-wk"><span v-for="w in wds" :key="w">{{ w }}</span></div>
          <div class="dt-g">
            <div v-for="(c,i) in cells" :key="i" class="dt-c" :class="c.cls" @click="c.cb">
              <span v-if="c.l" class="dt-cn">{{ c.l }}</span>
            </div>
          </div>
        </div>

        <!-- 时间面板 -->
        <div v-show="tab==='t'" class="dt-pane dt-pane--t">
          <div class="dt-tsel">
            <!-- 时 -->
            <div class="dt-tcol">
              <button class="dt-up" @click="adh(1)">
                <svg width="14" height="8" viewBox="0 0 14 8"><path d="M1 7L7 1L13 7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
              </button>
              <div class="dt-tnum">{{ String(localHour).padStart(2,'0') }}</div>
              <button class="dt-up" @click="adh(-1)">
                <svg width="14" height="8" viewBox="0 0 14 8"><path d="M1 1L7 7L13 1" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
              </button>
            </div>
            <span class="dt-colon">:</span>
            <!-- 分 -->
            <div class="dt-tcol">
              <button class="dt-up" @click="adm(1)">
                <svg width="14" height="8" viewBox="0 0 14 8"><path d="M1 7L7 1L13 7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
              </button>
              <div class="dt-tnum">{{ String(localMinute).padStart(2,'0') }}</div>
              <button class="dt-up" @click="adm(-1)">
                <svg width="14" height="8" viewBox="0 0 14 8"><path d="M1 1L7 7L13 1" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="dt-ft">
          <span class="dt-preview">{{ displayPreview }}</span>
          <button class="dt-go" @click="onConfirm">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toDateString, formatDate } from '@/utils/format'

const props = defineProps<{ date:string; time:string; visible:boolean }>()
const emit = defineEmits<{ (e:'update:date',v:string):void; (e:'update:time',v:string):void; (e:'close'):void }>()

const localDate = ref(props.date)
const localHour = ref(0)
const localMinute = ref(0)
const navYear = ref(0)
const navMonth = ref(0)
const tab = ref<'d'|'t'>('d')
const wds = ['一','二','三','四','五','六','日']

const displayPreview = computed(() => {
  const dl = formatDate(localDate.value)
  const tm = `${String(localHour.value).padStart(2,'0')}:${String(localMinute.value).padStart(2,'0')}`
  return `${dl} ${tm}`
})

function init() {
  localDate.value = props.date
  const [h,m]=props.time.split(':').map(Number)
  localHour.value=h; localMinute.value=m
  const d=p(props.date)
  navYear.value=d.getFullYear(); navMonth.value=d.getMonth()+1
  tab.value='d'
}
function p(s:string){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function s(y:number,m:number,d:number){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}

const cells=computed(()=>{
  const y=navYear.value,m=navMonth.value,cnt=new Date(y,m,0).getDate()
  const fd=new Date(y,m-1,1).getDay(),off=fd===0?6:fd-1
  const ts=toDateString(new Date()),n=new Date(),td=new Date(n.getFullYear(),n.getMonth(),n.getDate())
  type C={l:number|'';cls:string[];cb:()=>void};const r:C[]=[]
  for(let i=0;i<off;i++) r.push({l:'',cls:['dt-e'],cb:()=>{}})
  for(let d=1;d<=cnt;d++){
    const ds=s(y,m,d),ob=new Date(y,m-1,d),today=ds===ts,future=ob>td,sel=ds===localDate.value
    const cls:string[]=[]
    if(sel) cls.push('dt-s')
    else if(today) cls.push('dt-t')
    if(future) cls.push('dt-f')
    r.push({l:d,cls,cb:()=>{if(!future)localDate.value=ds}})
  }
  return r
})

function prevMonth(){if(navMonth.value===1){navYear.value--;navMonth.value=12}else navMonth.value--;adj()}
function nextMonth(){if(navMonth.value===12){navYear.value++;navMonth.value=1}else navMonth.value++;adj()}
function adj(){const ld=new Date(navYear.value,navMonth.value,0).getDate(),cd=p(localDate.value).getDate();if(cd>ld)localDate.value=s(navYear.value,navMonth.value,ld)}
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
.dt-mask{position:fixed;inset:0;background:var(--color-overlay);z-index:1000;display:flex;align-items:center;justify-content:center}
.dt-box{width:280px;background:var(--color-surface);border-radius:16px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.18)}

/* Tabs */
.dt-tabs{display:flex;border-bottom:1px solid var(--color-separator)}
.dt-tab{flex:1;height:40px;border:none;background:transparent;font-size:14px;font-weight:500;color:var(--color-secondary-text);cursor:pointer;font-family:inherit;position:relative}
.dt-tab--on{color:var(--color-primary);font-weight:600}
.dt-tab--on::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:32px;height:2.5px;border-radius:2px;background:var(--color-primary)}

/* 面板 */
.dt-pane{padding:14px 16px 10px;min-height:224px}
.dt-pane--t{min-height:0;padding:24px 16px 28px;display:flex;align-items:center;justify-content:center}

/* 月份 */
.dt-mbar{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px}
.dt-ar{width:24px;height:24px;border:none;border-radius:50%;background:var(--color-separator);font-size:14px;color:var(--color-secondary-text);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.dt-mtxt{font-size:14px;font-weight:600;color:var(--color-text);font-variant-numeric:tabular-nums}

/* 星期 */
.dt-wk{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:2px}
.dt-wk span{text-align:center;font-size:10px;font-weight:500;color:var(--color-secondary-text);padding:2px 0}

/* 网格 */
.dt-g{display:grid;grid-template-columns:repeat(7,1fr)}
.dt-c{aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none}
.dt-c:active:not(.dt-e):not(.dt-f){transform:scale(.85)}
.dt-e{cursor:default}
.dt-f{cursor:not-allowed}
.dt-cn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:13px;color:var(--color-text);transition:all.1s}
.dt-t .dt-cn{color:var(--color-primary);font-weight:600}
.dt-s .dt-cn{background:var(--color-primary);color:#fff;font-weight:600}
.dt-f .dt-cn{color:var(--color-separator-heavy)}

/* 时间面板 */
.dt-tsel{display:flex;align-items:center;gap:6px}
.dt-tcol{display:flex;flex-direction:column;align-items:center;gap:4px}
.dt-up{width:44px;height:36px;border:none;border-radius:8px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-secondary-text);font-family:inherit;transition:background.12s}
.dt-up:active{background:var(--color-separator)}
.dt-tnum{font-size:38px;font-weight:700;color:var(--color-text);font-variant-numeric:tabular-nums;text-align:center;min-width:60px;line-height:1.1;padding:2px 0}
.dt-colon{font-size:32px;font-weight:700;color:var(--color-secondary-text);margin-bottom:36px}

/* 底部 */
.dt-ft{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 14px;border-top:1px solid var(--color-separator)}
.dt-preview{font-size:13px;font-weight:500;color:var(--color-secondary-text)}
.dt-go{height:34px;padding:0 20px;border:none;border-radius:17px;background:var(--color-primary);color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
.dt-go:active{opacity:.8}
</style>