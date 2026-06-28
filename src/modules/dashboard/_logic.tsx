import {
  IconTerminal2,
  IconRobot,
  IconBook,
  IconSettings,
  IconFrame,
  IconChartPie,
  IconMap,
  IconUsers,
} from "@tabler/icons-react"

export const dashboardData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: IconTerminal2,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: IconRobot,
      items: [
        { title: "Genesis", url: "#" },
        { title: "Explorer", url: "#" },
        { title: "Quantum", url: "#" },
      ],
    },
    {
      title: "User Management",
      url: "/users",
      icon: IconUsers,
    },
    {
      title: "Documentation",
      url: "#",
      icon: IconBook,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: IconFrame },
    { name: "Sales & Marketing", url: "#", icon: IconChartPie },
    { name: "Travel", url: "#", icon: IconMap },
  ],
}
