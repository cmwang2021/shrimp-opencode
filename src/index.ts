import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { readFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"

const ZEN_BASE = "https://opencode.ai/zen/v1"
const AUTH_PATH = join(homedir(), ".local", "share", "opencode", "auth.json")

async function getAuthToken(): Promise<string> {
  if (process.env.OPENCODE_API_KEY) return process.env.OPENCODE_API_KEY
  try {
    const raw = await readFile(AUTH_PATH, "utf-8")
    const auth = JSON.parse(raw)
    if (auth.opencode?.type === "api" && auth.opencode?.key) return auth.opencode.key
    for (const [, provider] of Object.entries(auth) as [string, any][]) {
      if (provider?.type === "api" && provider?.key) return provider.key
    }
  } catch { /* no auth file */ }
  return ""
}

const app = new Hono()

app.get("/", (c) => c.json({ status: "ok", heart: "v8-standalone" }))

app.post("/v1/chat/completions", async (c) => {
  try {
    const body = await c.req.json()
    const isStream = body.stream === true
    const originalModel = body.model

    // Strip opencode: prefix for Zen endpoint
    if (body.model?.startsWith("opencode:")) {
      body.model = body.model.slice("opencode:".length)
    }

    console.log(`[HEART] ${isStream ? "stream" : "sync"} | ${originalModel} -> ${body.model}`)

    const token = await getAuthToken()

    const resp = await fetch(`${ZEN_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error(`[HEART] upstream ${resp.status}: ${errText.slice(0, 200)}`)
      return c.json({ error: { message: errText, status: resp.status } }, resp.status as any)
    }

    if (isStream) {
      return new Response(resp.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    }

    const data = await resp.json()
    data.model = originalModel
    return c.json(data)
  } catch (err: any) {
    console.error("[HEART] fatal:", err)
    return c.json({ error: { message: String(err?.message ?? err) } }, 500)
  }
})

const port = Number(process.env.PORT) || 20131
console.log(`Shrimp Heart v8 listening on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
