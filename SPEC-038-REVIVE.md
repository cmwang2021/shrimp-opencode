# SPEC-038-REVIVE: The Resurrection of Big Pickle

## 🍱 規格概覽 (Specifications)

本文件定義了「暴力縫合」後的 Shrimp-Proxy 核心邏輯，旨在繞過 OpenCode 內部的類型排斥，強制激活 Free Model (如 Big Pickle)。

## 🍱 核心策略：身份偽裝 (Identity Spoofing)

由於 OpenCode 內部的 `LLMClient` 具備嚴格的路由註冊檢查，未經官方「白名單」的模型會被強行分配到 `openai-chat` 路由並報錯。

### 暴力實作：
1.  **攔截 (Intercept)**：捕獲所有 `opencode:*` 請求。
2.  **改寫 (Rewrite)**：將 Provider 強行修改為 `togetherai`，模型 ID 修改為 `deepseek-ai/DeepSeek-V3`。
3.  **導流 (Redirect)**：將 `baseURL` 強插至 `https://opencode.ai/zen/v1`。
4.  **協定偽裝**：強制使用 `openai-compatible-chat` 協定發包。

## 🍱 技術組件

*   **Runtime**: Bun (v1.3.14+)
*   **Server**: Hono (Lightweight Forwarder)
*   **Auth Bridge**: 直接橋接 `~/.local/share/opencode/auth.json`，實現免 Key 算力泵送。
*   **Heartbeat Port**: 預設 3001/3002 (可配置)。

## 🍱 產品亮點

*   **暴力直連**：破牆而入，無視 Registry 限制。
*   **免 Key 算力**：共享 OpenCode 官方算力資源。
*   **Hono 極速轉發**：毫秒級延遲，保持流式感。

---
*Status: READY FOR DEPLOYMENT (SPEC-037 READY)*
