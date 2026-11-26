# 日记页设计（2026-11-26）

## 意图与 Why
钱书用户想新增一个「日记」页，纯文字心情随记，不关联收支。定位「**强化看、弱化写**」：
主界面是时间倒序的心情时间线，右上角小「+」新建，点卡片编辑。数据量小（一天最多一条），
不需要日期筛选，倒序直排 + 下滑即可直达历史。

进 Tab 栏，正好填上账户删除后腾出的槽位。

## 目标 / 非目标 / 反目标
- 目标：可浏览/新建/编辑/删除「日期 + 内容」的日记；进 Tab 栏；风格与全 App 玻璃卡片一致。
- 非目标：不做日期筛选、不关联当日收支、不做搜索跳转。
- 反目标：不要做成重表单/重编辑的页面，保持以看为主。

## 约束
- Vue 3 `<script setup lang="ts">` + Vue Router + Pinia + Dexie（IDB，schema 用 `version(n).stores()` 升级）。
- 沿用全页面规约：页面根容器 `padding: 0 16px 16px` + `padding-bottom: calc(24px + env(safe-area-inset-bottom))`；
  卡片/区块垂直间距统一 **14px 档位**；卡片用全局 `.glass` 玻璃类；字体走 `--fs-*`、`--ink*`、`--line-soft`、`--radius-big` 令牌。
- 提交入口沿用账户删除后的 Tab 结构：明细/统计/记账(中部色块)/设置。

## 方案
唯一合理方案（无竞品替代）。数据走 Dexie 新表 `diaries`（`++id, date` 索引），沿用 v7 升级。

## 已定 How（用户确认）
- 「日记」进 Tab 栏：**明细 / 统计 / 记账 / 日记 / 设置**。
- 列表**不分组**、按日期倒序直排，一条一张卡（日期 + 内容）。
- 右上角小「+」→ 弹编辑框新建；点已有卡片 → 同一编辑框改日期/内容，可删除。
- **不做日期筛选**。
- 纯文字，不关联收支。
- 编辑框复用 `CommonBottomSheet` + `DatePickerSheet` 日期选择 + 多行 textarea。

## 留给实施者
- 实现 `src/pages/diary/DiaryPage.vue` + `src/components/diary/DiaryEditSheet.vue`。
- `src/types/index.ts` 加 `Diary { id?, date, content }`；`src/db/index.ts` 加 `version(7).stores({ ..., diaries: '++id, date' })` 与 `diaries!: Table<Diary, number>`。
- `src/router/index.ts` 加 `/diary`；`src/components/layout/TabBar.vue` 加「日记」Tab。
- `src/utils/export.ts` 的 export/import/destroy 三函数并入 `diaries`，保证备份不丢日记。
- `npm run build` 验证 exit 0（仅既有 chunk>500kB 警告）。