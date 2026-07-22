# 钱书安全验证方案设计

> 更新日期：2026-07-22

---

## 一、概述与目标

### 1.1 概述

钱书（Money Book）是一款本地优先、零后端依赖的个人记账 PWA，所有用户数据存储在浏览器的 IndexedDB 中。为保护用户隐私，必须提供**应用层解锁机制**，防止设备被他人获取后直接查看财务数据。

安全验证方案由两层构成：

- **PIN 码锁**：6 位数字 PIN，通过 Web Crypto API SHA-256 哈希后存储，作为基础认证手段。
- **生物识别**：基于 WebAuthn API 的 platform authenticator（Face ID / Touch ID / Windows Hello），作为 PIN 的快捷替代。

### 1.2 目标

| 目标 | 说明 |
|------|------|
| **数据隔离** | 未验证身份时禁止访问任何业务内容 |
| **零后端依赖** | 所有认证逻辑在浏览器本地完成，不依赖网络或服务端 |
| **PIN 为根基** | 生物识别不可独立存在，关闭 PIN 时必须同步关闭生物识别 |
| **凭证复用** | 清理浏览器缓存或销毁数据后，重新开启生物识别应尽量复用已有硬件凭证 |
| **优雅降级** | 生物识别不可用时无缝回退到 PIN 输入 |
| **安全体验** | 输错自动清空 + Shake 动画反馈；切后台自动锁屏，切回前台自动锁定 |

### 1.3 非目标

- 不支持跨设备同步凭证（WebAuthn credential 绑定到硬件）
- 不支持生物识别替代 PIN 存储（PIN hash 保留，作为不可用时的唯一回退）
- 不提供忘记 PIN 的找回机制（数据不可恢复）

---

## 二、方案设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         App.vue                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  PIN Dialog   │  │ Biometric    │  │  MobileLayout /       │   │
│  │  (锁定层)     │  │ 静默验证     │  │  DesktopLayout        │   │
│  │               │  │              │  │  (业务内容，仅unlocked │   │
│  │  v-if="       │  │  onMount +   │  │   = true时渲染)       │   │
│  │  showPinLock" │  │  visibility  │  │                       │   │
│  └──────┬───────┘  │  change      │  └───────────────────────┘   │
│         │          └──────┬───────┘                               │
│         │                 │                                       │
│         ▼                 ▼                                       │
│  ┌────────────────────────────────────────┐                      │
│  │         uiStore.unlocked               │                      │
│  └────────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  utils/crypto.ts │    │  utils/biometric.ts  │
│  SHA-256 hash    │    │  WebAuthn API        │
│  localStorage    │    │  localStorage 标记   │
└──────────────────┘    └──────────────────────┘
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  localStorage   │    │  设备安全硬件         │
│  pin_hash       │    │  Secure Enclave / TPM │
└──────────────────┘    └──────────────────────┘
```

### 2.2 身份验证流程

#### 2.2.1 App 首次启动 / 刷新

```
开始
 │
 ├─ hasStoredPINHash()?
 │   ├─ NO → 无 PIN → unlocked = true → 直接渲染 App ✅
 │   └─ YES
 │       ├─ isBiometricEnabled()?
 │       │   ├─ YES → 静默调用 authenticateBiometric()
 │       │   │   ├─ 通过 → unlocked = true ✅
 │       │   │   └─ 失败/取消 → showPinLock = true → 用户输入 PIN
 │       │   │       ├─ hash比对成功 → unlocked = true ✅
 │       │   │       └─ hash比对失败 → 自动清空 + shake 动画 → 重试
 │       │   └─ NO → showPinLock = true → 用户输入 PIN
 │       │       ├─ 正确 → unlocked = true ✅
 │       │       └─ 错误 → 自动清空 + shake → 重试
 │
 └─ 用户通过验证 → 渲染 App 内容
```

#### 2.2.2 切后台 → 回前台

```
visibilitychange 事件触发
 │
 ├─ document.hidden = true
 │   └─ unlocked = false（强制锁屏）
 │
 └─ document.hidden = false
     ├─ hasStoredPINHash()?
     │   ├─ NO → unlocked = true（无 PIN 直接恢复）
     │   └─ YES
     │       ├─ showPinLock = true + pinResetVersion++
     │       ├─ isBiometricEnabled()?
     │       │   ├─ YES → 静默调用 authenticateBiometric()
     │       │   │   ├─ 通过 → unlocked = true ✅
     │       │   │   └─ 失败 → 停留在 PIN 弹窗让用户输入
     │       │   └─ NO → 停留在 PIN 弹窗让用户输入
     │       └─ 用户输入 PIN ...
```

### 2.3 设置流程

```
设置 → 安全 → PIN 码锁
 │
 ├─ 无 PIN
 │   └─ 设置 6 位数字 PIN → 确认 → hash存入localStorage
 │
 └─ 已设 PIN
     ├─ 验证当前 PIN
     │   ├─ 修改 PIN
     │   └─ 关闭 PIN → 清除 hash + 清除 biometric 标记
     └─ 验证通过后
         ├─ isBiometricSupported()?
         │   ├─ YES → 显示 Face ID / Touch ID 开关
         │   │   ├─ 开启
         │   │   │   ├─ 尝试 discoverExistingCredential()
         │   │   │   │   ├─ 找到 → 复用 → 保存 ID → 开启成功
         │   │   │   │   └─ 未找到 → create 新凭证
         │   │   │   │       ├─ 成功 → 保存 ID → 开启成功
         │   │   │   │       └─ 失败/取消 → 保持关闭
         │   │   └─ 关闭 → 清除 localStorage 标记
         │   └─ NO → 不显示开关
         ├─ 修改 PIN
         └─ 关闭 PIN → 同步关闭 biometric
```

---

## 三、涉及文件

| 文件 | 角色 | 关键代码 |
|------|------|----------|
| `src/App.vue` | 解锁总控制器 | `onPinSubmit`, `tryBiometricUnlock`, `onVisibilityChange` |
| `src/stores/uiStore.ts` | 解锁状态管理 | `unlocked` ref —— 决定 Layout 渲染 |
| `src/utils/crypto.ts` | PIN 哈希工具 | `hashPIN`, `getStoredPINHash`, `setStoredPINHash`, `clearPIN` |
| `src/utils/biometric.ts` | 生物识别工具 | `authenticateBiometric`, `registerBiometric`, `isBiometricSupported`, `clearBiometric`, `discoverExistingCredential` |
| `src/components/common/PinDialog.vue` | PIN 输入弹窗 | 6 位键盘, shake 动画, resetKey watch |
| `src/pages/settings/SecurityLock.vue` | PIN + Biometric 设置页 | 设置/修改/关闭 PIN, biometric 开关 |
| `src/pages/settings/SettingsPage.vue` | 设置主页 | 展示 PIN 和 biometric 状态 |
| `src/utils/export.ts` | 数据销毁 | `destroyAllData` —— 清除所有 IndexedDB 数据和缓存，但不涉及 localStorage 的 biometric 标记（由 SecurityLock.vue 的 `onDisable` 负责） |

---

## 四、架构与交互流程图

### 4.1 模块依赖关系

```
App.vue
  ├─ stores/uiStore.ts        [unlocked 状态]
  ├─ utils/crypto.ts          [哈希 + localStorage 存取]
  ├─ utils/biometric.ts       [WebAuthn API]
  ├─ components/common/PinDialog.vue
  ├─ components/layout/MobileLayout.vue   [v-if="isMobile && unlocked"]
  └─ components/layout/DesktopLayout.vue  [v-else-if]

SecurityLock.vue
  ├─ utils/crypto.ts
  ├─ utils/biometric.ts
  ├─ components/common/ConfirmDialog.vue
  └─ @/components/common/ConfirmDialog.vue

SettingsPage.vue
  ├─ utils/crypto.ts          [只读: getStoredPINHash]
  ├─ utils/biometric.ts       [只读: isBiometricEnabled]
  └─ pages/settings/SecurityLock.vue  [子视图]
```

### 4.2 PIN 验证交互序列

```
用户输入 6 位数字
 ↓
PinDialog @submit(pin)
 ↓
App.vue onPinSubmit(pin)
  ↓
  pinError.value = ''          (确保 watch 可触发)
  ↓
  hashPIN(pin)                 (Web Crypto API SHA-256)
  ↓
  getStoredPINHash()           (localStorage 读取)
  ↓
  比对
  ├─ 匹配 → unlockApp()
  │         unlocked = true
  │         showPinLock = false
  │         pinError = ''
  │         √  Layout 渲染
  │
  └─ 不匹配 → pinError = 'PIN 码错误，请重试'
              ↓
              PinDialog watch(errorMsg)
                ├─ triggerShake()    (CSS animation 0.35s)
                └─ clearPin()        (清除 6 位输入)
```

### 4.3 Biometric 交互序列

```
App mounted / visibilitychange 回前台
 ↓
tryBiometricUnlock()
  ↓
authenticateBiometric()
  ├─ getBiometricCredentialId()        (从 localStorage 读取)
  ├─ 构造 PublicKeyCredentialRequestOptions
  │   challenge: crypto.getRandomValues(new Uint8Array(32))
  │   rpId: window.location.hostname
  │   allowCredentials: [{ id: credentialId, type: 'public-key' }]
  │   userVerification: 'required'
  │
  ├─ navigator.credentials.get()
  │   ↓
  │   系统弹出 Face ID / Touch ID / Windows Hello
  │   ├─ 用户验证通过
  │   │   → 返回 credential
  │   │   → unlocked = true ✅
  │   │
  │   ├─ 用户取消
  │   │   → catch → return false
  │   │   → showPinLock = true (fallback)
  │   │
  │   └─ 设备不支持 / 凭证已移除
  │       → catch → return false
  │       → showPinLock = true (fallback)
  │
  └─ (无 credentialId)
      → return false
      → 走 PIN 逻辑
```

### 4.4 Biometric 注册交互序列

```
用户打开 Face ID / Touch ID 开关
 ↓
registerBiometric()
 │
 ├─ Phase 1: 尝试复用
 │   navigator.credentials.get({
 │     publicKey: { allowCredentials: [], ... }
 │   })
 │   ├─ 成功 → 拿到已有 credentialId → 保存 → return true ✅
 │   └─ 失败/无凭证 → 进入 Phase 2
 │
 └─ Phase 2: 创建新凭证
     navigator.credentials.create({
       publicKey: {
         rp: { id: hostname, name: '钱书' },
         user: { id: random, name, displayName },
         pubKeyCredParams: [...],
         authenticatorSelection: {
           authenticatorAttachment: 'platform',
           userVerification: 'required',
           residentKey: 'preferred',
         },
         attestation: 'none',
       }
     })
     ├─ 成功 → 保存 credential ID → return true ✅
     └─ 失败/取消 → return false (保持关闭)
```

---

## 五、技术实现细节

### 5.1 PIN 哈希 (src/utils/crypto.ts)

- **算法**: SHA-256 (Web Crypto API — `crypto.subtle.digest`)
- **存储**: localStorage, key = `pin_hash`, value = 64 字符 hex string
- **为什么不加 salt**: localStorage 访问即等价于代码执行环境，salt 无法在客户端保密。SHA-256 的单向性 + PWA 本地存储的特性使 salt 在这里无实际收益。

```typescript
// 核心流程
export async function hashPIN(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bufferToHex(hashBuffer)
}
```

### 5.2 WebAuthn 配置 (src/utils/biometric.ts)

#### 验证 (authenticate)

| 参数 | 值 | 说明 |
|------|-----|------|
| `challenge` | 32 字节随机 | 防重放 |
| `rpId` | `window.location.hostname` | 绑定到当前 origin |
| `allowCredentials` | `[{id, type: 'public-key'}]` | 指定存储的凭证 |
| `userVerification` | `'required'` | 强制用户验证 (Face ID / Touch ID / PIN) |

#### 注册 (create)

| 参数 | 值 | 说明 |
|------|-----|------|
| `authenticatorAttachment` | `'platform'` | 仅使用平台内置认证器 |
| `residentKey` | `'preferred'` | 偏好可发现凭证 |
| `userVerification` | `'required'` | 注册时必须验证 |
| `attestation` | `'none'` | 不收集认证器证明（隐私） |
| `timeout` | `60000` | 1 分钟超时 |

#### 复用发现 (discover)

| 参数 | 值 |
|------|-----|
| `allowCredentials` | `[]` (空数组——系统返回同 origin 所有可发现凭证) |

### 5.3 PIN 弹窗交互 (src/components/common/PinDialog.vue)

| 特性 | 实现 |
|------|------|
| **输入** | 6 位可见, 自定义数字键盘 |
| **自动提交** | 第 6 位输入时自动 emit `submit` |
| **错误** | watch `errorMsg` → 自动清空 + shake 动画 (0.35s CSS keyframes) |
| **重复错误** | App.vue 先 `pinError = ''` 清空, 再赋值, 确保 watch 触发 |
| **遮罩** | `@click.self="$emit('close')"` 但 App.vue  `onPinClose` 为空, 不可穿透 |
| **重置** | `resetKey` prop watch → `clearPin()` |
| **后退台** | `visibilitychange` → `pinResetVersion++` → `clearPin()` 清空部分输入 |

### 5.4 localStorage 数据清单

| Key | 值 | 用途 |
|-----|----|------|
| `pin_hash` | 64 字符 hex (SHA-256) | PIN 码哈希 |
| `biometric_enabled` | `'true'` / absent | 生物识别是否启用 |
| `biometric_credential_id` | base64url 字符串 | WebAuthn credential ID |

### 5.5 状态管理 (src/stores/uiStore.ts)

| 状态 | 类型 | 初始化 | 修改 |
|------|------|--------|------|
| `uiStore.unlocked` | `boolean` | `true` (默认) → App.vue 同步覆写 | `onPinSubmit` / `tryBiometricUnlock` / `onVisibilityChange` |

---

## 六、数据清单

| 数据类型 | 位置 | 生命周期 | 清除条件 |
|----------|------|----------|----------|
| PIN hash | localStorage | 持久（手动清除） | 设置-关闭 PIN; 清浏览器缓存; `localStorage.clear()` |
| Biometric enabled flag | localStorage | 持久 | 关闭 biometric; 关闭 PIN; 销毁数据; 清缓存 |
| Biometric credential ID | localStorage | 持久 | 同上; 不影响硬件凭证 |
| WebAuthn credential | Secure Enclave / TPM | **设备级持久** | 仅在操作系统的"管理网站凭证"处手动删除 |
| `uiStore.unlocked` | 内存 | 会话级 | 页面关闭; 切后台 |

---

## 七、异常处理与降级策略

### 7.1 降级矩阵

| 异常场景 | 表现 | 降级 |
|---------|------|------|
| 设备不支持 WebAuthn | `isBiometricSupported()` → `false` | 设置页不显示开关, App 仅用 PIN ✅ |
| biometric 验证失败/取消 | `authenticateBiometric()` → `false` | `showPinLock = true`, 用户输入 PIN ✅ |
| biometric 凭证 ID 丢失 | `getBiometricCredentialId()` → `null` | `authenticateBiometric()` → `false` → fallback PIN ✅ |
| localStorage 被清 | `getBiometricCredentialId()` → `null` | App 不尝试 biometric → 纯 PIN ✅ |
| `destroyAllData()` | 清除 DB + Cache + SW | biometric 标记丢失 → 下次纯 PIN, 设置页显示关闭, 用户可重新开启 |
| 用户删除浏览器中的 WebAuthn 凭证 | biometric 验证抛出异常 | `authenticateBiometric()` catch → `false` → fallback PIN ✅ |
| WebAuthn API 未定义 | `window.PublicKeyCredential` 为 undefined | `isBiometricSupported()` → `false` ✅ |

### 7.2 白屏保护

`App.vue` 三元条件:
```typescript
const showPinLock = ref(!hasPin ? false : hasBiometric ? false : true)
```

- 无 PIN: `showPinLock = false`, `unlocked = true` (渲染 Layout)
- 有 PIN + Biometric: `showPinLock = false`, `unlocked = false` (等待 biometric, 不渲染 Layout)
- 只有 PIN: `showPinLock = true`, `unlocked = false` (渲染 PIN 弹窗)

### 7.3 无 PIN 后台白屏 (已修复)

详见 git log / 问题追踪: 当未设置 PIN 时, `onVisibilityChange` 中 `document.hidden` 将 `unlocked` 设为 `false`, 但 `else if` 分支只处理"有 PIN"的场景, 缺少 `else` 恢复 `unlocked = true`, 导致 App 回到前台白屏。修复: 添加 `else { uiStore.unlocked = true }`。

---

## 八、安全边界与局限性

### 8.1 已知边界

| 边界 | 说明 | 可接受? |
|------|------|---------|
| PIN 只有 6 位数字 | 1,000,000 种组合, 无重试限制 | ✅ PWA 本地场景, attacker 需物理接触设备 |
| PIN hash 存在 localStorage | 可在 DevTools 中被读取 | ✅ 无法逆向为原始 PIN; 即使拿到 hash 也无法在另一设备使用 |
| 无 PIN 找回 | 忘记 PIN = 数据不可访问 | ✅ PWA 无后端, 技术上无法实现 |
| 无登录超时 | 验证后持续到页面关闭/切后台 | ✅ visibilitychange 提供基础保护 |
| SafeArea + TabBar 遮挡 | 不影响 | — |

### 8.2 已知局限性

| 局限性 | 说明 | 影响 |
|--------|------|------|
| 仅 origin 级 WebAuthn | 同一 PWA 在不同 Device 无法同步 credential | 预期内 |
| localStorage 不加密 | PIN hash 明文 Web Storage | PIN 逆向不可行, hash 本身无价值 |
| Orphaned credential | 清除 localStorage 后, Secure Enclave 可能残留旧凭证(无害) | 不影响功能, 可通过 `discoverExistingCredential` 下次复用 |
| 不支持 FIDO2 Security Key | `authenticatorAttachment: 'platform'` 限制 | 符合"设备自带"原则 |
| DevTools 可删除 localStorage | 用户可手动删除 `pin_hash` → 解锁 PIN 约束 | 绕过 PIN 的前提是 attacker 已有开发者工具访问权, 此时设备物理安全已被攻破 |

### 8.3 安全建议

| 级别 | 建议 |
|------|------|
| **强制** | 必须在 HTTPS (或 localhost) 环境下运行, 否则 WebAuthn 不可用 |
| **推荐** | 开启 FIDO2 安全密钥需 `cross-platform` attachment, 当前未实现; 对目标用户(日均1–5笔流水)益处有限 |
| **可选** | 增加"切后台 N 分钟后重新锁定"的配置, 当前为切后台即锁定, 颗粒度够细 |

---

## 九、与用户数据的交互

| 操作 | 影响 biometric? | 影响 PIN? | 影响 IndexedDB? |
|------|-----------------|-----------|-----------------|
| **开启 PIN** | 不影响 | 写入 hash | 不影响 |
| **关闭 PIN** | 标记被清除 (`clearBiometric()`) | 清除 hash | 不影响 |
| **开启 Face ID** | 写入标记 + credential ID | 不影响 | 不影响 |
| **关闭 Face ID** | 清除标记 | 不影响 | 不影响 |
| **导出数据** | 不影响 | 不影响 | JSON 导出 |
| **导入数据** | 不影响 | 不影响 | 覆盖 DB 4 表 |
| **彻底销毁数据** | 不影响 (仅 DB + Cache + SW) | 不影响 (仅 DB) | 清除 |
| **清浏览器缓存** | 标记丢失 | hash 丢失 | 不清除 IndexedDB |

> **注意**: `destroyAllData()` 仅清 IndexedDB + Cache + SW, **不清 localStorage**。PIN 和 biometric 标记在 `SecurityLock.vue` 的 `onDisable()` 中清除, 两者是独立的生命周期。这意味着即使执行"彻底销毁数据", 重新刷新页面上锁机制仍然有效。

---

## 十、WebAuthn 浏览器兼容性

| 浏览器 | 最低版本 | 平台认证器 |
|--------|----------|------------|
| Safari (iOS) | 14.5 | Face ID / Touch ID |
| Safari (macOS) | 14.0 | Touch ID |
| Chrome (Android) | 90+ | 面部 / 指纹 |
| Chrome (macOS) | 90+ | Touch ID / macOS 密码 |
| Edge (Windows) | 97+ | Windows Hello |
| Chrome (Windows) | 97+ | Windows Hello |
| Firefox | 不支持 platform authenticator | — |
| Linux | 无 TPM | — |

---

## 十一、修订历史

| 日期 | 修订内容 | 版本 |
|------|---------|------|
| 2026-07-22 | 初版: PIN + Biometric 方案设计、架构、实现细节 | v1.0 |