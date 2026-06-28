export type AppMode = "ai" | "dashboard"

export const MODE_META: { id: AppMode; label: string }[] = [
  { id: "ai", label: "AI" },
  { id: "dashboard", label: "Apps" },
]
