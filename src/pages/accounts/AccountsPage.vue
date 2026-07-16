<template>
  <div class="accounts-page">
    <!-- Page Header -->
    <div class="page-header">
      <span class="page-title">账户</span>
      <div class="header-actions">
        <button class="header-icon-btn" @click="showAddModal = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Net Worth Card -->
    <NetWorthCard
      :net-worth="accountStore.netWorth"
      :total-assets="accountStore.totalAssets"
      :total-liabilities="accountStore.totalLiabilities"
    />

    <!-- Account Groups -->
    <AccountGroup
      title="流动性资产"
      group-id="liquid"
      :accounts="accountStore.getAccountsByGroup('liquid')"
      :default-open="true"
    />
    <AccountGroup
      title="限制性资产"
      group-id="restricted"
      :accounts="accountStore.getAccountsByGroup('restricted')"
    />
    <AccountGroup
      title="债权"
      group-id="claim"
      :accounts="accountStore.getAccountsByGroup('claim')"
    />
    <AccountGroup
      title="负债"
      group-id="debt"
      :accounts="accountStore.getAccountsByGroup('debt')"
      :default-open="true"
    />

    <!-- Add Account Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-header">新增账户</div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="form.name" class="form-input" placeholder="账户名称" />
            </div>
            <div class="form-group">
              <label class="form-label">分组</label>
              <select v-model="form.groupId" class="form-input">
                <option value="liquid">流动性资产</option>
                <option value="restricted">限制性资产</option>
                <option value="claim">债权</option>
                <option value="debt">负债</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">图标</label>
              <input v-model="form.icon" class="form-input" placeholder="💳" maxlength="4" />
            </div>
            <div class="form-group">
              <label class="form-label">排序</label>
              <input v-model.number="form.sort" class="form-input" type="number" placeholder="0" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-cancel" @click="showAddModal = false">取消</button>
            <button class="btn btn-confirm" @click="handleAdd">确认</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import NetWorthCard from '@/components/accounts/NetWorthCard.vue'
import AccountGroup from '@/components/accounts/AccountGroup.vue'

const accountStore = useAccountStore()

const showAddModal = ref(false)

const form = reactive({
  name: '',
  groupId: 'liquid' as 'liquid' | 'restricted' | 'claim' | 'debt',
  icon: '💳',
  sort: 0,
})

async function handleAdd() {
  if (!form.name.trim()) return
  await accountStore.addAccount({
    name: form.name.trim(),
    groupId: form.groupId,
    icon: form.icon || '💳',
    balance: 0,
    sort: form.sort,
  })
  form.name = ''
  form.groupId = 'liquid'
  form.icon = '💳'
  form.sort = 0
  showAddModal.value = false
}
</script>

<style scoped>
.accounts-page {
  padding: 16px;
  background: var(--color-bg);
  min-height: 100%;
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.header-icon-btn:active {
  background: rgba(0, 122, 255, 0.1);
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  padding: 8px 24px 32px;
}

.modal-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
  margin: 0 auto 12px;
}

.modal-header {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: var(--color-text);
}

.modal-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary-text);
  margin-bottom: 6px;
}

.form-input,
.form-select {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-separator);
  background: #f2f2f6;
  padding: 0 12px;
  font-size: 15px;
  color: var(--color-text);
  outline: none;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.btn:active {
  opacity: 0.7;
}

.btn-cancel {
  background: #f2f2f6;
  color: var(--color-text);
}

.btn-confirm {
  background: #007aff;
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>