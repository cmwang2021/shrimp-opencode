# Shrimp-Proxy: The Direct Heart of OpenCode

Shrimp-Proxy 是一個為 OpenCode 深度定製的「算力心臟」，它將 OpenCode 強大的 LLM 調度能力提取並封裝為一個標準的 OpenAI-Compatible API。

## 🚀 核心特性

- **暴力直連 (Violent Stitching)**: 繞過複雜的路由註冊 Registry，直接對接底層適配器。
- **身份偽裝 (Identity Spoofing)**: 通過偽裝模型 ID，強制激活 OpenCode Zen 官方 Free Model 資源。
- **免 Key 算力**: 自動橋接 OpenCode 的認證系統，對外提供無需 Key 的算力轉發。
- **Hono 極速轉發**: 基於 Hono 框架，實現亞毫秒級的請求轉發，保持完美的「打字機流式感」。

## 🛠 安裝與啟動

### 1. 安裝環境
確保系統已安裝 [Bun](https://bun.sh/)。

### 2. 下載與安裝
```bash
git clone https://github.com/cmwang2021/shrimp-opencode
cd packages/shrimp-proxy
bun install
```

### 3. 啟動心臟
```bash
bun run src/index.ts
```

## 🍱 SPEC-038 活摘路徑

本 Proxy 遵循 **SPEC-038** 與 **SPEC-038-REVIVE** 規格，專為「活摘算力心臟」行動而生。它不僅是一個代理，更是 OpenCode 與其他工具（如 OpenClaw）之間的技術橋樑。

---
**Shrimp Clan | 蝦家班 5/19 榮譽呈獻**
