<script setup lang="ts">
import { ref } from 'vue'
import SecurityLock from './SecurityLock.vue'
import DataManagement from './DataManagement.vue'

const currentSection = ref<'main' | 'security' | 'data'>('main')
</script>

<template>
  <div class="settings-page">
    <template v-if="currentSection === 'main'">
      <van-nav-bar title="设置" />
      <div class="settings-body">
        <van-cell-group title="安全">
          <van-cell
            title="安全锁"
            is-link
            @click="currentSection = 'security'"
          />
        </van-cell-group>
        <van-cell-group title="数据">
          <van-cell
            title="数据管理"
            is-link
            @click="currentSection = 'data'"
          />
        </van-cell-group>
      </div>
    </template>
    <SecurityLock
      v-else-if="currentSection === 'security'"
      @back="currentSection = 'main'"
    />
    <DataManagement
      v-else-if="currentSection === 'data'"
      @back="currentSection = 'main'"
    />
  </div>
</template>

<style scoped>
.settings-page {
  background: #f7f8fa;
  min-height: 100%;
}
.settings-body {
  padding: 16px 0;
}
</style>