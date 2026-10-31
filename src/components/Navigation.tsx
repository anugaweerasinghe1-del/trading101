import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, Home, GraduationCap, BookOpen, BarChart3, Bot, Menu, X, Star, Info, UserRound, LogOut, ChevronDown, Mail, CalendarCheck, Contact, TrendingUp, Layers } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/brand/BrandMark";
import { StreakBadge } from "@/components/badges/StreakBadge";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
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
    const focusable = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(el => el.getClientRects().length);
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
      if (e.key === "Tab") {
        const items = focusable(), first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !menuRef.current?.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !menuRef.current?.contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      menuTriggerRef.current?.focus();
    };
  }, [mobileMenuOpen]);


  // The primary navigation describes the beginner's progression:
  // Learn the essentials -> practise with virtual money -> track a portfolio
  // -> build a weekly learning habit.
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/learn", label: "Learn", icon: GraduationCap },
    { to: "/trade", label: "Trade", icon: BarChart3 },
    { to: "/portfolio", label: "Portfolio", icon: Wallet },
    { to: "/newsletter", label: "Weekly", icon: Mail },
  ];
  const moreGroups = [
    { label: "Explore", items: [
      { to: "/courses", label: "Courses", icon: BookOpen },
      { to: "/ai-mentor", label: "AI Mentor", icon: Bot },
      { to: "/markets", label: "Markets", icon: TrendingUp },
      { to: "/daily", label: "Daily Practice", icon: CalendarCheck },
    ] },
    { label: "Community", items: [
      { to: "/leaderboard", label: "Leaderboard", icon: Layers },
      { to: "/reviews", label: "Reviews", icon: Star },
    ] },
    { label: "Company", items: [
      { to: "/about", label: "About", icon: Info },
      { to: "/contact", label: "Contact", icon: Contact },
      { to: "/roadmap", label: "Roadmap", icon: CalendarCheck },
    ] },
    { label: "Legal & Trust", items: [
      { to: "/privacy", label: "Privacy Policy", icon: Info },
      { to: "/terms", label: "Terms of Service", icon: BookOpen },
      { to: "/about#disclaimer", label: "Educational Disclaimer", icon: Info },
    ] },
  ];
  const isActive = (path: string) => path === "/"
    ? location.pathname === "/"
    : location.pathname === path || location.pathname.startsWith(path + "/");
  const moreActive = moreGroups.some(group => group.items.some(item => isActive(item.to)));

  return (
    <>
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 [.light_&]:bg-background/95 [.light_&]:border-border [.light_&]:text-foreground [.light_&]:[--accent-foreground:0_0%_6%]",

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
          <div className="hidden xl:flex min-w-0 items-center gap-1 2xl:gap-1.5">
            {navItems.map((item) => (
              <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 px-2.5 text-[15px] 2xl:text-base font-medium rounded-xl transition-all duration-300",
                    isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  )}
                 asChild key={item.to}>
<Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined}>
                  <item.icon className="w-[18px] h-[18px] mr-2" />
                  {item.label}
                </Link>
</Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="More site pages"
                  className={cn("h-10 px-3 text-[15px] 2xl:text-base font-medium rounded-xl",
                    moreActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]")}>
                  More <ChevronDown className="ml-1.5 w-[18px] h-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10}
                className="w-60 rounded-xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur-xl">
                {moreGroups.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 && <DropdownMenuSeparator className="my-1.5" />}
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.items.map(item => (
                      <DropdownMenuItem key={item.to} asChild
                        className={cn("rounded-lg cursor-pointer text-[15px] min-h-10", isActive(item.to) && "bg-primary/10 text-primary")}>
                        <Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined}>
                          <item.icon className="mr-2.5 h-4 w-4" /> {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              </DropdownMenu> : <Button variant="outline" size="sm" className="h-9 rounded-xl text-sm" asChild>
<Link to="/auth" className="ml-2 inline-block">
                  <UserRound className="w-4 h-4 mr-2" />
                  Sign in
                </Link>
</Button>}
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
              ref={menuTriggerRef}
              aria-controls="site-menu"
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
        mobileMenuOpen ? "opacity-100" : "opacity-0 invisible pointer-events-none"
      )}
      aria-hidden={!mobileMenuOpen}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        id="site-menu"
        ref={menuRef}
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
            <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 px-4 text-base font-medium rounded-xl transition-all",
                  isActive(item.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                )}
               asChild key={item.to}>
<Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
</Button>
          ))}
          <button type="button"
            className={cn("w-full flex items-center h-12 px-4 text-base font-medium rounded-xl text-left transition-all",
              moreActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]")}
            aria-expanded={mobileMoreOpen} aria-controls="mobile-more-pages"
            onClick={() => setMobileMoreOpen(open => !open)}>
            <Layers className="w-4 h-4 mr-3" /> More
            <ChevronDown className={cn("ml-auto w-4 h-4 transition-transform", mobileMoreOpen && "rotate-180")} />
          </button>
          {mobileMoreOpen && <div id="mobile-more-pages" className="ml-3 border-l border-white/10 pl-2 space-y-3">
            {moreGroups.map(group => (
              <div key={group.label}>
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive(item.to) ? "page" : undefined}
                    className={cn("flex w-full items-center min-h-11 rounded-lg px-4 py-2 text-[15px]",
                      isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]")}>
                    <item.icon className="mr-3 h-4 w-4" /> {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>}
          <Button variant="ghost" className="w-full justify-start h-12 px-4 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.05]" asChild>
<Link to={user ? "/trader/me" : "/auth"} onClick={() => setMobileMenuOpen(false)}>
              <UserRound className="w-4 h-4 mr-3" />
              {user ? "My profile" : "Sign in (optional)"}
            </Link>
</Button>
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
