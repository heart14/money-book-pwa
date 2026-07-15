<template>
  <div class="page-placeholder">
    <van-nav-bar title="账户详情" left-arrow @click-left="$router.back()" />
    <div class="placeholder-content">
      <van-icon name="balance-o" size="64" color="#ccc" />
      <p>账户详情（规划中）</p>
    </div>
  </div>
</template>

<style scoped>
.page-placeholder { min-height: 100%; background: #f7f8fa; }
.placeholder-content { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; gap: 12px; color: #999; }
</style>