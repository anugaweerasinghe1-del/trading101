import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PageTransition } from "@/components/PageTransition";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { PushNotificationPrompt } from "@/components/retention/PushNotificationPrompt";
import { AuthProvider } from "@/hooks/useAuth";
import { recordVisit } from "@/lib/lastVisit";
import { snapshotWatchlist } from "@/lib/watchlistDiff";
import { ConsentBanner } from "@/components/ConsentBanner";
import { CoursePublicationNotices } from "@/components/courses/CoursePublicationNotices";

import Index from "./pages/Index";
import { RoutePublisherNotes } from "./components/RoutePublisherNotes";

const Trade = lazy(() => import("./pages/Trade"));
const TradeAsset = lazy(() => import("./pages/TradeAsset"));
const Markets = lazy(() => import("./pages/Markets"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Learn = lazy(() => import("./pages/Learn"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const LearnTradingGuide = lazy(() => import("./pages/LearnTradingGuide"));
const AIMentor = lazy(() => import("./pages/AIMentor"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const SectorPillar = lazy(() => import("./pages/SectorPillar"));
const WikiTerm = lazy(() => import("./pages/WikiTerm"));
const WikiIndex = lazy(() => import("./pages/WikiIndex"));
const NicheAsset = lazy(() => import("./pages/NicheAsset"));
const SEOAudit = lazy(() => import("./pages/SEOAudit"));
const AdminValidator = lazy(() => import("./pages/AdminValidator"));
const AdminEditor = lazy(() => import("./pages/AdminEditor"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LearnArticle = lazy(() => import("./pages/LearnArticle"));
const Daily = lazy(() => import("./pages/Daily"));
const Reviews = lazy(() => import("./pages/Reviews"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminDaily = lazy(() => import("./pages/AdminDaily"));
const AdminCourses = lazy(() => import("./pages/AdminCourses"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const AdminAIAssistant = lazy(() => import("./pages/AdminAIAssistant"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Compare = lazy(() => import("./pages/Compare"));
const CompareIndex = lazy(() => import("./pages/Compare").then(m => ({ default: m.CompareIndex })));
const HowToTrade = lazy(() => import("./pages/HowToTrade"));
const HowToTradeIndex = lazy(() => import("./pages/HowToTrade").then(m => ({ default: m.HowToTradeIndex })));
const Strategy = lazy(() => import("./pages/Strategy"));
const StrategyIndex = lazy(() => import("./pages/Strategy").then(m => ({ default: m.StrategyIndex })));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseTrack = lazy(() => import("./pages/CourseTrack"));
const CourseLesson = lazy(() => import("./pages/CourseLesson"));
const CountryGuide = lazy(() => import("./pages/CountryGuide"));
const CountryGuideIndex = lazy(() => import("./pages/CountryGuide").then(m => ({ default: m.CountryGuideIndex })));
const TraderProfile = lazy(() => import("./pages/TraderProfile"));
const PublicTrader = lazy(() => import("./pages/PublicTrader"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Challenge = lazy(() => import("./pages/Challenge"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

function AnimatedRoutes() {
  const location = useLocation();

  // Track last visited route for the "Continue where you left off" hook.
  useEffect(() => {
    recordVisit(location.pathname);
  }, [location.pathname]);

  return (
    <Suspense fallback={
      <main data-route-loading aria-busy="true" className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div role="status" aria-live="polite">
            <h1 className="text-2xl font-semibold text-foreground">Loading your page</h1>
            <p className="mt-3 text-muted-foreground">Your TradeHQ page is on its way. Please wait a moment while we get it ready.</p>
          </div>
          <a href="/" className="mt-6 inline-block text-primary underline underline-offset-4">Return to TradeHQ home</a>
        </div>
      </main>
    }>
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/trade/:symbol" element={<TradeAsset />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/article/:slug" element={<LearnArticle />} />
          <Route path="/learn/how-to-read-stock-charts" element={<Navigate to="/learn/article/how-to-read-stock-charts" replace />} />
          <Route path="/learn/trading-strategies-for-beginners" element={<Navigate to="/learn/article/trading-strategies-for-beginners" replace />} />
          <Route path="/learn/what-is-paper-trading" element={<Navigate to="/learn/article/what-is-paper-trading" replace />} />
          <Route path="/learn/how-to-build-a-portfolio" element={<Navigate to="/learn/article/how-to-build-a-portfolio" replace />} />
          <Route path="/learn/crypto-vs-stocks" element={<Navigate to="/learn/article/crypto-vs-stocks" replace />} />
          <Route path="/learn/stock-market-index-etfs" element={<Navigate to="/learn/article/stock-market-index-etfs" replace />} />
          <Route path="/learn/risk-management-in-trading" element={<Navigate to="/learn/article/risk-management-in-trading" replace />} />
          <Route path="/learn/:lessonId" element={<LessonDetail />} />
          <Route path="/learn-trading-guide" element={<LearnTradingGuide />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/ai-mentor" element={<AIMentor />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/compare" element={<CompareIndex />} />
          <Route path="/compare/:slug" element={<Compare />} />
          <Route path="/how-to-trade" element={<HowToTradeIndex />} />
          <Route path="/how-to-trade/:symbol" element={<HowToTrade />} />
          <Route path="/strategy" element={<StrategyIndex />} />
          <Route path="/strategy/:slug" element={<Strategy />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:trackSlug" element={<CourseTrack />} />
          <Route path="/courses/:trackSlug/:lessonSlug" element={<CourseLesson />} />
          <Route path="/learn/country" element={<CountryGuideIndex />} />
          <Route path="/learn/country/:country" element={<CountryGuide />} />
          <Route path="/trader/me" element={<TraderProfile />} />
          <Route path="/trader/:username" element={<PublicTrader />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/challenge/:code" element={<Challenge />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sectors/:sectorId" element={<SectorPillar />} />
          <Route path="/wiki" element={<WikiIndex />} />
          <Route path="/wiki/:slug" element={<WikiTerm />} />
          <Route path="/niche/:symbol" element={<NicheAsset />} />

          {/* ADMIN ROUTES — existing desks preserved */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/ai" element={<AdminAIAssistant />} />
          <Route path="/admin/seo-audit" element={<SEOAudit />} />
          <Route path="/admin/validator" element={<AdminValidator />} />
          <Route path="/admin/editor" element={<AdminEditor />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/daily" element={<AdminDaily />} />
          <Route path="/admin/newsletter" element={<AdminNewsletter />} />
          <Route path="/admin/courses" element={<AdminCourses />} />

          {/* CATCH-ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </Suspense>
  );
}

/** Periodically snapshot watchlist prices so we can diff on next visit. */
function WatchlistSnapshot() {
  useEffect(() => {
    const snap = () => snapshotWatchlist();
    const t = setTimeout(snap, 5000);
    const iv = setInterval(snap, 5 * 60 * 1000);
    window.addEventListener("beforeunload", snap);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
      window.removeEventListener("beforeunload", snap);
    };
  }, []);
  return null;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors closeButton />
        <BrowserRouter>
          <AuthProvider>
            <AnimatedRoutes />
            <RoutePublisherNotes />
            <MobileBottomNav />
            <BackgroundMusic />
            <PushNotificationPrompt />
            <WatchlistSnapshot />
            <ConsentBanner />
            <CoursePublicationNotices />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
