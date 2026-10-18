import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, Home, GraduationCap, BookOpen, BarChart3, Bot, Menu, X, Star, Info, UserRound, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/brand/BrandMark";
import { StreakBadge } from "@/components/badges/StreakBadge";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      setMobileMenuOpen(false);
      toast.success("Signed out on this device.");
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll + close on Escape while the sheet is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);


  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/trade", label: "Trade", icon: BarChart3 },
    { to: "/portfolio", label: "Portfolio", icon: BookOpen },
    { to: "/learn", label: "Learn", icon: GraduationCap },
    { to: "/courses", label: "Courses", icon: BookOpen },
    { to: "/leaderboard", label: "Leaderboard", icon: Wallet },
    { to: "/reviews", label: "Reviews", icon: Star },
    { to: "/ai-mentor", label: "AI Mentor", icon: Bot },
    { to: "/about", label: "About", icon: Info },
  ];

  return (
    <>
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",

      scrolled
        ? "bg-[hsl(0_0%_2%)/90] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_-10px_hsl(0_0%_0%/0.5)]"
        : "bg-transparent border-b border-transparent"
    )}>
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group active:scale-[0.97] transition-transform" aria-label="TradeHQ home">
            <BrandMark size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex min-w-0 overflow-x-auto items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 px-2 text-sm font-medium rounded-xl transition-all duration-300",
                    location.pathname === item.to
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="ml-2 pl-2 border-l border-white/[0.06]">
              <StreakBadge className="mr-2" />
              <ThemeToggle />
              {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 h-9 rounded-xl text-sm" aria-label="Account menu">
                    <UserRound className="w-4 h-4 mr-2" /> Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link to="/trader/me">My profile</Link></DropdownMenuItem>
                  <DropdownMenuItem disabled={signingOut} onSelect={() => void handleSignOut()}>
                    <LogOut className="w-4 h-4 mr-2" /> {signingOut ? "Signing out…" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Link to="/auth" className="ml-2 inline-block">
                <Button variant="outline" size="sm" className="h-9 rounded-xl text-sm">
                  <UserRound className="w-4 h-4 mr-2" />
                  Sign in
                </Button>
              </Link>}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <StreakBadge />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

      </div>
    </nav>

    {/* Mobile slide-in sheet — portalled to <body> so no floating control overlaps it */}
    {createPortal(
    <div
      className={cn(
        "xl:hidden fixed inset-0 overflow-hidden z-[80] transition-opacity duration-300",
        mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!mobileMenuOpen}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          "absolute right-0 top-0 h-full w-[82%] max-w-xs flex flex-col",
          "bg-[hsl(0_0%_4%)] border-l border-white/10 shadow-2xl",
          "transition-transform duration-300 ease-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06] shrink-0">
          <BrandMark size="sm" />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 px-4 text-sm font-medium rounded-xl transition-all",
                  location.pathname === item.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                )}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Link to={user ? "/trader/me" : "/auth"} onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start h-12 px-4 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.05]">
              <UserRound className="w-4 h-4 mr-3" />
              {user ? "My profile" : "Sign in (optional)"}
            </Button>
          </Link>
          {user && <Button variant="ghost" disabled={signingOut} onClick={() => void handleSignOut()} className="w-full justify-start h-12 px-4 text-sm font-medium rounded-xl">
            <LogOut className="w-4 h-4 mr-3" /> {signingOut ? "Signing out…" : "Sign out"}
          </Button>}
        </div>
      </div>
    </div>,
    document.body)}
    </>
  );

}
