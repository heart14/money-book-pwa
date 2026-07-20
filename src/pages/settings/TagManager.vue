<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon">🏷️</span><span class="row-label">管理标签</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="tags.length === 0" class="empty-hint">暂无标签</div>
      <div v-for="tag in tags" :key="tag.id" class="tag-item">
        <span class="tag-name">{{ tag.name }}</span>
        <button class="tag-delete" @click="confirmDelete(tag)">删除</button>
      </div>
      <div class="tag-add-row">
        <input v-model="newTag" class="tag-input" placeholder="输入新标签" maxlength="20" @keyup.enter="addTag" />
        <button class="tag-add-btn" :disabled="!newTag.trim()" @click="addTag">添加</button>
      </div>
    </div>

    <!-- Delete confirm: also remove from transactions? -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-content">
          <p class="modal-desc">确认删除标签「{{ deleteTarget.name }}」？<br v-if="deleteUsageCount > 0"><span v-if="deleteUsageCount > 0" class="modal-hint">该标签用于 {{ deleteUsageCount }} 条交易记录</span></p>
          <div class="modal-actions-col">
            <button class="btn-block btn-danger" v-if="deleteUsageCount > 0" @click="handleDeleteRemovingFromTxs">删除并从交易记录移除</button>
            <button class="btn-block btn-cancel" @click="handleDeleteRegistryOnly">仅从标签列表删除</button>
            <button class="btn-block btn-cancel" @click="deleteTarget = null">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toastMsg" class="toast-msg" @click="toastMsg = ''">{{ toastMsg }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import type { Tag } from '@/types'

const expanded = ref(false)

// Live-query the tags table — reactive, persisted
const tags = useLiveQuery<Tag[]>(
  () => db.tags.orderBy('name').toArray(),
  [],
)

// ── Add ──
const newTag = ref('')

async function addTag() {
  const name = newTag.value.trim()
  if (!name) return
  // Prevent duplicate via unique index — Dexie will throw, catch gracefully
  try {
    await db.tags.add({ name })
    newTag.value = ''
  } catch (e) {
    toastMsg.value = `标签「${name}」已存在`
  }
}

// ── Delete ──
const deleteTarget = ref<Tag | null>(null)
const deleteUsageCount = ref(0)
const toastMsg = ref('')

async function confirmDelete(tag: Tag) {
  // Count usages in transactions
  const allTxs = await db.transactions.toArray()
  deleteUsageCount.value = allTxs.filter((tx) => tx.tags.includes(tag.name)).length
  deleteTarget.value = tag
}

/** Remove tag from registry AND from all transactions */
async function handleDeleteRemovingFromTxs() {
  const tag = deleteTarget.value
  if (!tag || tag.id == null) return
  const name = tag.name

  // Remove from transactions
  const txs = await db.transactions
    .filter((tx) => tx.tags.includes(name))
    .toArray()
  for (const tx of txs) {
    if (tx.id != null) {
      await db.transactions.update(tx.id, {
        tags: tx.tags.filter((t) => t !== name),
      })
    }
  }

  // Remove from registry
  await db.tags.delete(tag.id)

  deleteTarget.value = null
  toastMsg.value = `标签「${name}」已删除（已从 ${txs.length} 条记录中移除）`
}

/** Remove tag from registry only — leave transactions untouched */
async function handleDeleteRegistryOnly() {
  const tag = deleteTarget.value
  if (!tag || tag.id == null) return

  await db.tags.delete(tag.id)
  deleteTarget.value = null
  toastMsg.value = `标签「${tag.name}」已从标签列表删除`
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
.modal-content { width: 300px; background: #fff; border-radius: 16px; padding: 24px; }
.modal-desc { font-size: 14px; color: #1c1c1e; text-align: center; margin-bottom: 8px; }
.modal-hint { font-size: 12px; color: #8e8e93; }
.modal-actions-col { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }

.btn-block { width: 100%; height: 44px; border-radius: 10px; border: none; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-block:active { opacity: 0.7; }
.btn-danger { background: #ff3b30; color: #fff; }
.btn-cancel { background: #f2f2f6; color: #1c1c1e; }

/* Toast */
.toast-msg {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  background: #1c1c1e;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  z-index: 1100;
  cursor: pointer;
  animation: toastIn 0.25s ease;
  max-width: 80%;
  text-align: center;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>