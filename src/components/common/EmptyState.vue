<script setup lang="ts">
defineProps<{
  description?: string
}>()
</script>

<template>
  <van-empty :description="description || '暂无数据'" />
</template>