// ---------------------------------------------------------------------------
// Server-side proxy for AI chat completion — bypasses CORS
// POST /api/chat  →  streams SSE from NEXT_PUBLIC_AI_CHAT_URL/chat/completions
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const body = await request.json()

  const apiUrl =
    process.env.NEXT_PUBLIC_AI_CHAT_URL ?? "https://ai.myklola.cloud/v1"

  const apiKey = process.env.NEXT_PUBLIC_AI_CHAT_API_KEY ?? ""

  const upstream = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  // Stream the response back to the client as-is (SSE passthrough)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
