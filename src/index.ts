import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { Effect, Layer, Stream, ManagedRuntime, Schema } from "effect"
import { LLMClient, LLM } from "../../llm/src"
import { Auth } from "../../opencode/src/auth"
import { ModelsDev } from "../../core/src/models"
import { AppFileSystem } from "../../core/src/filesystem"
import { Npm } from "../../core/src/npm"
import { RequestExecutor } from "../../llm/src/route/executor"
import { LLMEvent, LLMRequest, Message, SystemPart, ToolChoice, ToolDefinition } from "../../llm/src"
import { ModelRef, ModelLimits, ModelID, ProviderID, RouteID, GenerationOptions } from "../../llm/src/schema"

console.log("--- SHRIMP PROXY HEART V7 (STABLE VIOLENCE) LOADED ---")

// 1. Define the core services layer for the proxy.
const ProxyLayer = Layer.mergeAll(
  Auth.defaultLayer,
  ModelsDev.defaultLayer,
  LLMClient.layer,
  Npm.defaultLayer,
  AppFileSystem.defaultLayer
).pipe(
  Layer.provideMerge(RequestExecutor.defaultLayer)
)

const runtime = ManagedRuntime.make(ProxyLayer)

const app = new Hono()

app.post("/v1/chat/completions", async (c) => {
  const body = await c.req.json()
  const isStream = body.stream === true

  const program = Effect.gen(function* () {
    console.log(`[PROXY V7] Request: ${body.model}`)
    const auth = yield* Auth.Service
    
    const { model: fullModelName, messages, tools, tool_choice, ...generation } = body
    const [provider, modelId] = fullModelName.includes(":") ? fullModelName.split(":") : ["openai", fullModelName]
    
    const isFreeModel = provider === "opencode"
    
    let apiKey: string | undefined
    if (isFreeModel) {
       apiKey = "none"
    } else {
       const credential = yield* Effect.orDie(auth.get(provider))
       apiKey = credential?.type === "api" ? credential.key : undefined
    }

    // [SPEC-038] VIOLENT STITCHING: ULTRA Identity Spoofing
    const spoofProvider = isFreeModel ? "togetherai" : provider
    const spoofModel = isFreeModel ? "deepseek-ai/DeepSeek-V3" : modelId
    const spoofRoute = isFreeModel ? "openai-compatible-chat" : (provider === "openai" ? "openai-chat" : "openai-compatible-chat")
    const spoofBaseURL = isFreeModel ? "https://opencode.ai/zen/v1" : "https://api.openai.com/v1"

    console.log(`[PROXY V7] Violence: ${provider}:${modelId} -> ${spoofProvider}:${spoofModel} [Route: ${spoofRoute}]`)

    const systemParts: SystemPart[] = []
    const llmMessages: Message[] = []
    for (const m of messages) {
      if (m.role === "system") systemParts.push(SystemPart.make(m.content))
      else llmMessages.push(Message.make({ role: m.role, content: m.content }))
    }

    const finalRequest = new LLMRequest({
      model: ModelRef.make({
        id: spoofModel,
        provider: ProviderID.make(spoofProvider),
        route: RouteID.make(spoofRoute),
        baseURL: spoofBaseURL,
        apiKey: apiKey ?? "none",
        limits: ModelLimits.make({ context: 4096, output: 4096 })
      }),
      system: systemParts,
      messages: llmMessages,
      tools: tools?.map((t: any) => ToolDefinition.make({
        name: t.function.name,
        description: t.function.description,
        inputSchema: t.function.parameters,
      })) ?? [],
    })

    const client = yield* LLMClient.Service

    if (isStream) {
      const sseStream = client.stream(finalRequest).pipe(
        Stream.map((event, i) => {
          const base = {
            id: `chatcmpl-${i}`,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: fullModelName,
            choices: [{ index: 0, delta: {}, finish_reason: null }],
          }
          if (event.type === "text-delta") {
            return `data: ${JSON.stringify({ ...base, choices: [{ ...base.choices[0], delta: { content: event.text } }] })}\n\n`
          }
          if (event.type === "finish") {
            return `data: ${JSON.stringify({ ...base, choices: [{ ...base.choices[0], delta: {}, finish_reason: event.reason }] })}\n\n`
          }
          return ""
        }),
        Stream.filter((s) => s !== ""),
        Stream.concat(Stream.make("data: [DONE]\n\n"))
      )

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const asyncIterable = await Effect.runPromise(
              Stream.toAsyncIterable(sseStream).pipe(Effect.provide(ProxyLayer))
            )
            for await (const chunk of asyncIterable) {
              controller.enqueue(new TextEncoder().encode(chunk))
            }
          } catch (e) {
            console.error("[STREAM] Error:", e)
          } finally {
            controller.close()
          }
        },
      })
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    } else {
      const response = yield* LLMClient.generate(finalRequest)
      return c.json({
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: fullModelName,
        choices: [{ index: 0, message: { role: "assistant", content: response.text }, finish_reason: "stop" }],
        usage: {
          prompt_tokens: response.usage?.inputTokens ?? 0,
          completion_tokens: response.usage?.outputTokens ?? 0,
          total_tokens: response.usage?.totalTokens ?? 0,
        },
      })
    }
  })

  try {
    return await runtime.runPromise(program)
  } catch (error) {
    console.error("[PROXY V7] Error Trace:", error)
    return c.json({ error: { message: String(error) } }, 500)
  }
})

const port = 3002
console.log(`Shrimp Proxy V7 (The Heart) listening on port ${port}`)
serve({ fetch: app.fetch, port })
