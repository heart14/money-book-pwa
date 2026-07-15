<script setup lang="ts">
import { useAccountStore } from '@/stores/accountStore'
import NetWorthCard from '@/components/accounts/NetWorthCard.vue'
import AccountGroup from '@/components/accounts/AccountGroup.vue'

const acctStore = useAccountStore()
</script>

<template>
  <div class="accounts-page">
    <van-nav-bar title="账户" />
    <NetWorthCard />
    <div class="account-list">
      <AccountGroup
        v-for="g in acctStore.groupedAccounts"
        :key="g.groupName"
        :group-name="g.groupName"
        :accounts="g.accounts"
      />
    </div>
  </div>
</template>

<style scoped>
.accounts-page {
  background: #f7f8fa;
  min-height: 100%;
}
.account-list {
  padding-bottom: 20px;
}
</style>