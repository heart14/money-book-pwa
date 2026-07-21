# 明细页分页与分类筛选方案重构

## 核心修改

将分页筛选从"客户端 computed 过滤"改为"DB 侧加载时就过滤"。核心思路：

1. `loadPage()` 根据当前是否有分类筛选，从 DB 加载**只匹配该分类**的 PAGE_SIZE+1 条数据
2. 不再需要 `loadUntilMatchFound`——因为加载的每一条都是匹配的
3. `filteredTransactions` computed 只处理搜索关键词（客户端侧）

## 修改计划

### 1. 新增辅助函数 `getCategoryFilter`

在 [`TransactionsPage.vue`](src/pages/transactions/TransactionsPage.vue) 的 `<script>` 中添加：

```typescript
function getCategoryFilter(): ((tx: Transaction) => boolean) | null {
  const sel = selectedCategoryId.value
  if (sel == null) return null
  const childIds = childIdsByParent.value.get(sel)
  if (!childIds || childIds.size === 0) {
    // 选中子分类或没有子分类的父分类
    return (tx: Transaction) => tx.categoryId === sel
  }
  // 选中父分类 → 匹配父分类 ID 或任何子分类 ID
  return (tx: Transaction) => tx.categoryId === sel || childIds.has(tx.categoryId!)
}
```

### 2. 重构 `loadPage()`

修改 [`loadPage`](src/pages/transactions/TransactionsPage.vue:217) 的第 229-269 行：

```typescript
async function loadPage() {
  if (allLoaded.value) return
  // isLoading stuck recovery
  if (isLoading.value) {
    isLoading.value = false
    cursorDate = null
    cursorId = null
  }
  isLoading.value = true
  const seq = ++loadSeq
  const gen = resetGen

  try {
    const catFilter = getCategoryFilter()
    let query: Collection<Transaction, number>

    if (dateFilterActive.value) {
      const start = toDateString(...)
      const end = toDateString(...)
      if (cursorDate !== null && cursorId !== null) {
        query = db.transactions.where('[date+id]').between([start, 0], [cursorDate, cursorId], true, false).reverse()
      } else {
        query = db.transactions.where('[date+id]').between([start, 0], [end, Number.MAX_SAFE_INTEGER]).reverse()
      }
    } else {
      if (cursorDate !== null && cursorId !== null) {
        query = db.transactions.where('[date+id]').below([cursorDate, cursorId]).reverse()
      } else {
        query = db.transactions.orderBy('[date+id]').reverse()
      }
    }

    // 如果有分类筛选，先 filter 再 limit
    const items = catFilter
      ? await query.filter(catFilter).limit(PAGE_SIZE + 1).toArray()
      : await query.limit(PAGE_SIZE + 1).toArray()

    // gen 过期检测 ...
    // allLoaded 判断 ...
    // cursor 推进 ...
    // push ...
  }
}
```

### 3. 移除 `loadUntilMatchFound` 和 `hasActiveFilter`

删除 [`loadUntilMatchFound`](src/pages/transactions/TransactionsPage.vue:307) 和 [`hasActiveFilter`](src/pages/transactions/TransactionsPage.vue:299)。修改 [`resetPagination`](src/pages/transactions/TransactionsPage.vue:316)：

```typescript
async function resetPagination() {
  resetGen++
  isLoading.value = false
  cursorDate = null
  cursorId = null
  allLoaded.value = false
  transactions.value = []
  await loadPage()
  // 不再需要 loadUntilMatchFound
}
```

### 4. 简化 `isEmpty` 和 `filteredTransactions`

`isEmpty` computed 不再需要检查 `allLoaded && filteredTransactions.length === 0`，因为 DB 侧返回的就是匹配数据：

```typescript
const isEmpty = computed(() => {
  if (isLoading.value) return false
  // 如果有搜索词，用 filteredTransactions 判断
  if (searchQuery.value.trim()) {
    return allLoaded.value && filteredTransactions.value.length === 0
  }
  // 无搜索词时，直接看 transactions（DB 侧已按分类过滤）
  return transactions.value.length === 0
})
```

`filteredTransactions` 只处理搜索关键词：

```typescript
const filteredTransactions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return transactions.value  // 无搜索词时直接返回（已按分类过滤）
  return transactions.value.filter((tx) => {
    if ((tx.title || '').toLowerCase().includes(q)) return true
    if ((tx.note || '').toLowerCase().includes(q)) return true
    return (tx.tags || []).some((t) => t.toLowerCase().includes(q))
  })
})
```

## 边界情况

| 场景 | 行为 |
|------|------|
| 选择父分类 | DB 查询先按 [date+id] 倒序取游标范围内的记录，filter 匹配父分类或子分类，返回最多 21 条匹配项 |
| 选择子分类 | filter 只匹配该子分类 ID |
| 父分类+日期筛选 | where([date+id]).between() + filter |
| 父分类+搜索 | DB 加载父分类匹配数据 + computed 搜索过滤 |
| 快速切换分类 | resetGen++ 废弃旧 loadPage，新查询使用新分类 ID |
| 某分类数据很少 | 加载完所有匹配数据后 allLoaded=true，展示 "没有更多账单了" |

## Dexie filter 性能说明

`Collection.filter(fn)` 是**惰性求值**的。当调用 `.limit(21).toArray()` 时，Dexie 的游标遍历过程中：
1. 从索引 `[date+id]` 按倒序遍历
2. 对每条记录调用 filter 函数
3. 匹配的累积到结果集中
4. 当结果集达到 21 条或游标遍历完毕时停止

在最坏情况下（某分类只有很少数据且分布在最旧的记录中），需要遍历全部数据才能拿到匹配项。但由于 `limit` 的存在，每次只加载 21 条，之后通过 IntersectionObserver 继续加载下一页，不会一次性加载全部数据。

对于个人记账软件来说，总数据量通常在数千到数万级别，这种方案的性能完全可接受。如果未来数据量极大，可以在 Dexie 中添加 `[categoryId+date+id]` 复合索引来优化。