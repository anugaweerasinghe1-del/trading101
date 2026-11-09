export type ReleaseNote = {
  id: string;
  date: string;
  category: "Site" | "Learning" | "Rewards" | "Portfolio" | "Course";
  title: string;
  summary: string;
  href: `/${string}`;
  action: string;
};

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    id: "whats-new",
    date: "2026-11-09",
    category: "Site",
    title: "A home for TradeHQ updates",
    summary: "Find recent improvements and newly published courses in one place. The Roadmap is still where you can see what we’re working on next.",
    href: "/roadmap",
    action: "See the Roadmap",
  },
  {
    id: "daily-to-next-lesson",
    date: "2026-11-09",
    category: "Learning",
    title: "Go from Daily Practice to your next lesson",
    summary: "Finish a daily challenge to see your next approved lesson. You can keep learning right away or return tomorrow. Lessons now offer help from the learning mentor before the quiz.",
    href: "/daily",
    action: "Open Daily Practice",
  },
  {
    id: "portfolio-chart",
    date: "2026-11-08",
    category: "Portfolio",
    title: "A clearer view of your practice portfolio",
    summary: "The portfolio chart shows your current account value even before a trend has formed. Axis labels and the downside comparison are easier to read.",
    href: "/portfolio",
    action: "Open your portfolio",
  },
  {
    id: "trophy-cabinet",
    date: "2026-11-08",
    category: "Rewards",
    title: "Twenty trophies for learning and practice",
    summary: "The Trophy Cabinet explains what earns each award and shows your progress. Earned trophies are private by default, with separate controls for anything you choose to share.",
    href: "/achievements",
    action: "Explore the Trophy Cabinet",
  },
];
