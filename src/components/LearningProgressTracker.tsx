import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Trophy, 
  Zap, 
  BookOpen, 
  Target,
  Share2,
  Twitter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  xp: number;
  completed: boolean;
  locked: boolean;
}

type PersistedLearningModuleState = {
  id: string;
  completed: boolean;
  locked: boolean;
};

const STORAGE_KEY = "tradinghq_learning_progress_v2";

const defaultModules: LearningModule[] = [
  { id: "basics", title: "Trading Basics", description: "Learn what trading is", icon: <BookOpen className="w-5 h-5" />, xp: 100, completed: false, locked: false },
  { id: "markets", title: "Market Types", description: "Stocks, Forex & Crypto", icon: <Target className="w-5 h-5" />, xp: 150, completed: false, locked: true },
  { id: "risk", title: "Risk Management", description: "Protect your capital", icon: <Zap className="w-5 h-5" />, xp: 200, completed: false, locked: true },
  { id: "psychology", title: "Trading Psychology", description: "Master your emotions", icon: <Target className="w-5 h-5" />, xp: 250, completed: false, locked: true },
  { id: "ai-bots", title: "AI Trading Bot Safety", description: "Navigate AI trading safely", icon: <Zap className="w-5 h-5" />, xp: 300, completed: false, locked: true },
  { id: "practice", title: "Simulator Practice", description: "Trade with $100K demo", icon: <Trophy className="w-5 h-5" />, xp: 500, completed: false, locked: true },
];

function safeParseState(raw: string | null): PersistedLearningModuleState[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x) => x && typeof x === "object" && typeof x.id === "string")
      .map((x) => ({
        id: String(x.id),
        completed: Boolean(x.completed),
        locked: Boolean(x.locked),
      }));
  } catch {
    return null;
  }
}

export function LearningProgressTracker() {
  const { toast } = useToast();
  
  const [modules, setModules] = useState<LearningModule[]>(() => {
    const saved = safeParseState(localStorage.getItem(STORAGE_KEY));
    if (!saved) return defaultModules;
    
    // Merge saved state with default modules to restore icons
    return defaultModules.map(mod => {
      const savedMod = saved.find(s => s.id === mod.id);
      return savedMod 
        ? { ...mod, completed: savedMod.completed, locked: savedMod.locked }
        : mod;
    });
  });

  useEffect(() => {
    // Only persist serializable data
    const toSave: PersistedLearningModuleState[] = modules.map(m => ({
      id: m.id,
      completed: m.completed,
      locked: m.locked,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [modules]);

  const completedCount = modules.filter(m => m.completed).length;
  const totalXP = modules.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);
  const maxXP = modules.reduce((sum, m) => sum + m.xp, 0);

  const getLevel = (xp: number) => {
    if (xp >= 1000) return { level: 5, title: "Pro Trader" };
    if (xp >= 600) return { level: 4, title: "Advanced" };
    if (xp >= 350) return { level: 3, title: "Intermediate" };
    if (xp >= 150) return { level: 2, title: "Beginner" };
    return { level: 1, title: "Novice" };
  };

  const levelInfo = getLevel(totalXP);

  const handleComplete = (id: string) => {
    setModules(prev => {
      const updated = prev.map((m, index) => {
        if (m.id === id) {
          return { ...m, completed: true };
        }
        // Unlock next module
        if (prev[index - 1]?.id === id && m.locked) {
          return { ...m, locked: false };
        }
        return m;
      });
      return updated;
    });

    const module = modules.find(m => m.id === id);
    if (module) {
      toast({
        title: `🎉 +${module.xp} XP Earned!`,
        description: `Completed: ${module.title}`,
      });
    }
  };

  const handleShareProgress = () => {
    const shareText = `I'm leveling up my trading skills on TradeHQ! 📈\n\n🎯 Level ${levelInfo.level}: ${levelInfo.title}\n⚡ ${totalXP}/${maxXP} XP\n✅ ${completedCount}/${modules.length} modules completed\n\nStudy trading with virtual cash: https://www.thetradehq.com/learn-trading-guide\n\n#TradingEducation #LearnToTrade #PaperTrading`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    
    toast({
      title: "Share your progress!",
      description: "Opening Twitter to share your achievement",
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Your Learning Path</h3>
            <p className="text-sm text-muted-foreground">
              Level {levelInfo.level}: {levelInfo.title}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareProgress}
          className="gap-2"
        >
          <Twitter className="w-4 h-4" />
          Share Progress
        </Button>
      </div>

      {/* XP Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Experience Points</span>
          <span className="font-semibold text-primary">{totalXP} / {maxXP} XP</span>
        </div>
        <Progress value={(totalXP / maxXP) * 100} aria-label="Experience Points" className="h-3" />
      </div>

      {/* Module Progress */}
      <div className="flex justify-between text-sm mb-4">
        <span className="text-muted-foreground">Modules Completed</span>
        <span className="font-semibold">{completedCount} / {modules.length}</span>
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {modules.map((module, index) => (
          <div
            key={module.id}
            className={cn(
              "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 p-4 rounded-lg border transition-all",
              module.completed 
                ? "bg-profit/10 border-profit/30" 
                : module.locked 
                  ? "bg-muted/20 border-border opacity-60"
                  : "bg-card/50 border-border hover:border-primary/50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              module.completed 
                ? "bg-profit text-profit-foreground" 
                : module.locked 
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/20 text-primary"
            )}>
              {module.completed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : module.locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                module.icon
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-semibold break-words",
                module.locked && "text-muted-foreground"
              )}>
                {module.title}
              </h4>
              <p className="text-xs text-muted-foreground break-words">
                {module.description}
              </p>
            </div>

            <div className="col-span-2 flex flex-wrap items-center justify-end gap-3">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                module.completed 
                  ? "bg-profit/20 text-profit" 
                  : "bg-primary/20 text-primary"
              )}>
                +{module.xp} XP
              </span>
              {!module.completed && !module.locked && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleComplete(module.id)}
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
