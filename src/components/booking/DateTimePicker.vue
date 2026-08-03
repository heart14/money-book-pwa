<template>
  <Teleport to="body">
    <div v-if="visible" class="dt-mask" @click.self="onCancel">
      <div class="dt-box">
        <!-- 月份 -->
        <div class="dt-row dt-row--m">
          <button class="dt-ar" @click="prevMonth">‹</button>
          <span class="dt-ml">{{ navYear }}.{{ String(navMonth).padStart(2,'0') }}</span>
          <button class="dt-ar" @click="nextMonth">›</button>
        </div>

        <!-- 星期 -->
        <div class="dt-row dt-row--w">
          <span v-for="w in wds" :key="w">{{ w }}</span>
        </div>

        <!-- 网格 -->
        <div class="dt-grid">
          <div v-for="(c,i) in cells" :key="i" class="dt-gc" :class="c.cls" @click="c.cb">
            <span v-if="c.l" class="dt-gn">{{ c.l }}</span>
          </div>
        </div>

        <!-- 时间 -->
        <div class="dt-row dt-row--t">
          <button class="dt-tb2" @click="adh(1)">▲</button>
          <span class="dt-tv">{{ String(localHour).padStart(2,'0') }}</span>
          <button class="dt-tb2" @click="adh(-1)">▼</button>
          <span class="dt-tsep">:</span>
          <button class="dt-tb2" @click="adm(1)">▲</button>
          <span class="dt-tv">{{ String(localMinute).padStart(2,'0') }}</span>
          <button class="dt-tb2" @click="adm(-1)">▼</button>
        </div>

        <!-- 操作 -->
        <div class="dt-acts">
          <button class="dt-act" @click="onCancel">取消</button>
          <button class="dt-act dt-act--p" @click="onConfirm">确定</button>
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
  const [h,m]=props.time.split(':').map(Number)
  localHour.value=h; localMinute.value=m
  const d=p(props.date)
  navYear.value=d.getFullYear(); navMonth.value=d.getMonth()+1
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
    const cls: string[]=[]
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
.dt-box{width:300px;background:var(--color-surface);border-radius:14px;padding:16px 16px 12px;box-shadow:0 8px 40px rgba(0,0,0,.15)}
.dt-row{display:flex;align-items:center;justify-content:center}
.dt-row--m{gap:12px;margin-bottom:8px}
.dt-ar{width:26px;height:26px;border:none;border-radius:50%;background:var(--color-separator);font-size:15px;color:var(--color-secondary-text);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.dt-ml{font-size:14px;font-weight:600;color:var(--color-text);min-width:80px;text-align:center;font-variant-numeric:tabular-nums}
.dt-row--w{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:2px}
.dt-row--w span{text-align:center;font-size:10px;font-weight:500;color:var(--color-secondary-text);padding:2px 0}
.dt-grid{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:8px}
.dt-gc{aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none}
.dt-gc:active:not(.dt-e):not(.dt-f){transform:scale(.88)}
.dt-e{cursor:default}
.dt-f{cursor:not-allowed}
.dt-gn{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:13px;color:var(--color-text);transition:all.1s}
.dt-t .dt-gn{color:var(--color-primary);font-weight:600}
.dt-s .dt-gn{background:var(--color-primary);color:#fff;font-weight:600}
.dt-f .dt-gn{color:var(--color-separator-heavy)}
.dt-row--t{gap:2px;padding:8px 0 10px;border-top:1px solid var(--color-separator)}
.dt-tb2{width:28px;height:28px;border:none;border-radius:6px;background:transparent;cursor:pointer;font-size:9px;color:var(--color-secondary-text);display:flex;align-items:center;justify-content:center;font-family:inherit}
.dt-tb2:active{background:var(--color-separator)}
.dt-tv{font-size:20px;font-weight:700;color:var(--color-text);font-variant-numeric:tabular-nums;min-width:36px;text-align:center;line-height:1}
.dt-tsep{font-size:18px;font-weight:600;color:var(--color-secondary-text);margin:0 4px}
.dt-acts{display:flex;gap:8px}
.dt-act{flex:1;height:36px;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
.dt-act:active{opacity:.7}
.dt-act{background:var(--color-separator);color:var(--color-secondary-text)}
.dt-act--p{background:var(--color-primary);color:#fff;font-weight:600}
</style>