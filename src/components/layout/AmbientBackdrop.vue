<template>
  <div class="ambient-bg" aria-hidden="true">
    <i class="amb b-a"></i>
    <i class="amb b-b"></i>
    <i class="amb b-c"></i>
    <i class="amb b-d"></i>
  </div>
</template>

<script setup lang="ts">
// 环境光背景层：fixed 全局一层，位于内容之后。
// 读取全局 --amb-* 令牌绘制 底渐变 + 四团柔光斑，
// backdrop-filter 玻璃在此之上折射获得可感知的"光"。
</script>

<style scoped>
.ambient-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: var(--amb-base);
  overflow: hidden;
  pointer-events: none;
}
.ambient-bg .amb {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  opacity: 0.55;
}
.ambient-bg .b-a {
  width: 230px;
  height: 230px;
  background: var(--amb-a);
  top: -50px;
  left: -60px;
}
.ambient-bg .b-b {
  width: 260px;
  height: 260px;
  background: var(--amb-b);
  bottom: -70px;
  right: -70px;
}
.ambient-bg .b-c {
  width: 150px;
  height: 150px;
  background: var(--amb-c);
  top: 38%;
  left: -30px;
  opacity: 0.4;
}
.ambient-bg .b-d {
  width: 160px;
  height: 160px;
  background: var(--amb-d);
  bottom: 14%;
  right: -20px;
  opacity: 0.35;
}
</style>
