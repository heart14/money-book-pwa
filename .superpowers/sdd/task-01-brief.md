# Task 1: 项目脚手架搭建

## 项目根目录
C:\Users\wfli\Documents\Workspace\VSCode\money-book-pwa

## 步骤

### Step 1: 创建 package.json
内容见实施计划 Task 1 Step 1。关键依赖：
- vue ^3.5.0, vue-router ^4.5.0, pinia ^2.3.0
- vant ^4.9.0, @vant/use ^1.6.0
- dexie ^4.0.0
- echarts ^5.6.0, vue-echarts ^7.0.0
- @vueuse/core ^11.0.0
- vite-plugin-pwa ^0.21.0
- 开发依赖: @vitejs/plugin-vue, typescript, vue-tsc, vite, unplugin-auto-import, unplugin-vue-components

### Step 2: 创建 vite.config.ts
配置：Vue 插件 + VitePWA + AutoImport(VantResolver) + Components(VantResolver) + @ 别名

### Step 3: 创建 tsconfig.json
strict: true, path: @/* → ./src/*

### Step 4: 创建 tsconfig.node.json
target ES2022, include vite.config.ts

### Step 5: 创建 index.html
lang=zh-CN, meta viewport, theme-color=#1989fa

### Step 6: 创建 src/main.ts
简单入口：createApp + Pinia + Router + 导入 Vant 样式

### Step 7: 创建 src/vite-env.d.ts
Vite 环境类型声明 + .vue 模块声明

### Step 8: 创建 .gitignore
node_modules, dist, *.local, .DS_Store

### Step 9: 安装依赖并验证
npm install → npx vue-tsc --noEmit（应无错误）

### Step 10: 提交
git add -A && git commit -m "chore: scaffold project with Vue 3 + Vite + Vant 4 + Dexie"

## 报告文件
C:\Users\wfli\Documents\Workspace\VSCode\money-book-pwa\.superpowers\sdd\task-01-report.md

## 报告要求
在报告文件中写入完成的步骤，状态（DONE/BLOCKED），提交的 commit hash，`npx vue-tsc --noEmit` 的输出结果。