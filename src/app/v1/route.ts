import { post } from "@/req/base_req"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const authHeader = request.headers.get("authorization")

  try {
    const res = await post("/ai-request", body, {
      ...(authHeader ? { headers: { Authorization: authHeader } } : {}),
    })
    return NextResponse.json(res.data)
  } catch (err: any) {
    return NextResponse.json(err?.response?.data ?? { message: "Internal Server Error" })
  }
}
