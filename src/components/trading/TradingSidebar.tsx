import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Wallet, 
  GraduationCap, 
  Settings,
  LayoutGrid,
  LineChart
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandMark } from "@/components/brand/BrandMark";

const navItems = [
  { icon: LayoutGrid, label: "Dashboard", path: "/" },
  { icon: TrendingUp, label: "Trade", path: "/trade" },
  { icon: LineChart, label: "Markets", path: "/markets" },
  { icon: Wallet, label: "Portfolio", path: "/portfolio" },
  { icon: GraduationCap, label: "Learn", path: "/learn" },
];

export function TradingSidebar() {
  const location = useLocation();

  return (
    <aside className="sticky top-0 h-screen w-16 shrink-0 bg-gradient-sidebar border-r border-border/30 flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="mb-8">
        <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-2xl hover:opacity-80 active:scale-[0.97] transition-all" aria-label="TradeHQ home">
          <BrandMark size="sm" showWordmark={false} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/trade" && location.pathname === "/trade");
          
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  aria-label={item.label}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-glow-profit" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-2">
        <ThemeToggle />
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to="/privacy" aria-label="Privacy and storage choices" className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Privacy and storage choices
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
