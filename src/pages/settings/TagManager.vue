<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon">🏷️</span><span class="row-label">管理标签</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="tags.length === 0" class="empty-hint">暂无标签</div>
      <div v-for="tag in tags" :key="tag" class="tag-item">
        <span class="tag-name">{{ tag }}</span>
        <button class="tag-delete" @click="confirmDelete(tag)">删除</button>
      </div>
      <div class="tag-add-row">
        <input v-model="newTag" class="tag-input" placeholder="输入新标签" maxlength="20" @keyup.enter="addTag" />
        <button class="tag-add-btn" :disabled="!newTag.trim()" @click="addTag">添加</button>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="tagToDelete" class="modal-overlay" @click.self="tagToDelete = ''">
      <div class="modal-content">
        <p class="modal-desc">确认删除标签「{{ tagToDelete }}」？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="tagToDelete = ''">取消</button>
          <button class="btn-danger" @click="handleDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { db } from '@/db'

const expanded = ref(false)

const tags = ref<string[]>([])
const newTag = ref('')
const tagToDelete = ref('')

async function loadTags() {
  const allTxs = await db.transactions.toArray()
  const tagSet = new Set<string>()
  for (const tx of allTxs) {
    for (const tag of tx.tags) tagSet.add(tag)
  }
  tags.value = Array.from(tagSet).sort()
}
watchEffect(() => { loadTags() })

function addTag() {
  const t = newTag.value.trim()
  if (!t || tags.value.includes(t)) return
  tags.value.push(t)
  tags.value.sort()
  newTag.value = ''
}

function confirmDelete(tag: string) {
  tagToDelete.value = tag
}

function handleDelete() {
  tags.value = tags.value.filter((t) => t !== tagToDelete.value)
  tagToDelete.value = ''
}
</script>

<style scoped>
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 15px;
  color: #1c1c1e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
  transition: background 0.1s;
}
.section-row:active { background: rgba(0,0,0,0.03); }

.row-left { display: flex; align-items: center; gap: 10px; }
.row-icon { font-size: 18px; line-height: 1; }
.row-label { font-size: 15px; color: #1c1c1e; }

.chevron { color: #c7c7cc; flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.expanded-content { padding: 4px 14px 12px; }
.empty-hint { text-align: center; padding: 12px; font-size: 14px; color: #8e8e93; }

.tag-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.tag-name { font-size: 14px; color: #1c1c1e; }
.tag-delete { border: none; background: none; color: #ff3b30; font-size: 12px; cursor: pointer; font-family: inherit; }
.tag-add-row { display: flex; gap: 8px; margin-top: 8px; }
.tag-input { flex: 1; height: 36px; border-radius: 8px; border: 1px solid #e5e5ea; padding: 0 10px; font-size: 14px; outline: none; font-family: inherit; box-sizing: border-box; }
.tag-add-btn { height: 36px; padding: 0 16px; border: none; border-radius: 8px; background: #007aff; color: #fff; font-size: 13px; cursor: pointer; font-family: inherit; }
.tag-add-btn:disabled { opacity: 0.4; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 280px; background: #fff; border-radius: 16px; padding: 24px; }
.modal-desc { font-size: 14px; color: #1c1c1e; text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.btn-cancel { flex: 1; height: 44px; border-radius: 10px; border: none; background: #f2f2f6; color: #1c1c1e; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: 10px; border: none; background: #ff3b30; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
</style>