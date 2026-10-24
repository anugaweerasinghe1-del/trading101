import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, BarChart3, Wallet, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav - Fixed bottom navigation for mobile devices
 * Native app feel with smooth transitions and safe area handling
 * The glass utility supplies relative positioning; !fixed keeps this bar anchored.
 * Only visible on mobile (<768px)
 */
export function MobileBottomNav() {
  const location = useLocation();
  
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/trade", label: "Trade", icon: TrendingUp },
    { to: "/markets", label: "Markets", icon: BarChart3 },
    { to: "/portfolio", label: "Portfolio", icon: Wallet },
    { to: "/learn", label: "Learn", icon: GraduationCap },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
    {/* Preserve document-end clearance for the bar and mobile safe area. */}
    <div aria-hidden="true" className="md:hidden" style={{ height: "calc(4rem + 2px + env(safe-area-inset-bottom, 0px))" }} />
    <nav 
      className="!fixed bottom-0 left-0 right-0 z-50 md:hidden glass-liquid-dark border-t border-white/10 pb-safe"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full min-h-[48px] transition-all duration-200",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <div className={cn(
                "relative flex items-center justify-center",
                active && "after:absolute after:-inset-2 after:rounded-xl after:bg-primary/10"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 transition-transform",
                  active && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
