<script setup lang="ts">
import { ref } from 'vue'
import { exportData, importData, destroyAllData } from '@/utils/export'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'

const importing = ref(false)
const fileInput = ref<HTMLInputElement>()

async function handleExport() {
  try {
    await exportData()
    showSuccessToast('导出成功')
  } catch {
    showFailToast('导出失败')
  }
}

async function handleImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    importing.value = true
    await importData(file)
    showSuccessToast('导入成功，页面将刷新')
    setTimeout(() => window.location.reload(), 1000)
  } catch (err) {
    showFailToast('导入失败：文件格式错误')
  } finally {
    importing.value = false
    target.value = ''
  }
}

async function handleDestroy() {
  await showConfirmDialog({
    title: '彻底销毁',
    message: '此操作将清空所有数据、注销 Service Worker、清除缓存。此操作不可撤销！',
    confirmButtonColor: '#ee0a24',
  })
  await showConfirmDialog({
    title: '再次确认',
    message: '真的要彻底销毁所有数据吗？',
    confirmButtonColor: '#ee0a24',
  })
  await destroyAllData()
}
</script>

<template>
  <div class="data-management">
    <van-cell-group title="数据管理">
      <van-cell title="导出备份" is-link @click="handleExport" />
      <van-cell title="导入备份" is-link @click="fileInput?.click()" />
      <van-cell
        title="彻底销毁"
        is-link
        @click="handleDestroy"
        title-style="color: #ee0a24"
      />
    </van-cell-group>
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      hidden
      @change="handleImport"
    />
  </div>
</template>