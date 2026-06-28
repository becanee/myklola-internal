export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export const chatHistory = [
  { id: "1", title: "Refactor authentication flow", date: "Today" },
  { id: "2", title: "Design system color tokens", date: "Today" },
  { id: "3", title: "Fix responsive sidebar layout", date: "Yesterday" },
  { id: "4", title: "API rate limiting strategy", date: "Yesterday" },
  { id: "5", title: "Database migration plan", date: "Jun 25" },
  { id: "6", title: "Onboarding flow revision", date: "Jun 24" },
  { id: "7", title: "Performance optimization", date: "Jun 23" },
  { id: "8", title: "Email template redesign", date: "Jun 22" },
]
