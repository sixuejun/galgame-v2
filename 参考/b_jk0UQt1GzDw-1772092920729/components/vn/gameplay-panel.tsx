"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { X, Compass, Hammer, Repeat, Newspaper, Lock, ArrowLeft } from "lucide-react"

const MODULE_ICONS: Record<string, React.ReactNode> = {
  compass: <Compass className="w-5 h-5" />,
  hammer: <Hammer className="w-5 h-5" />,
  repeat: <Repeat className="w-5 h-5" />,
  newspaper: <Newspaper className="w-5 h-5" />,
}

function ModuleView({ moduleId, onClose }: { moduleId: string; onClose: () => void }) {
  const { state } = useVN()
  const mod = state.gameModules.find((m) => m.moduleId === moduleId)

  if (!mod) return null

  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[80vh] mx-4 border border-border/60 bg-[var(--vn-panel-bg)] backdrop-blur-md overflow-hidden animate-fade-in-up">
        {/* Header decoration */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-rust/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <span className="text-rust">{MODULE_ICONS[mod.icon] || <Compass className="w-5 h-5" />}</span>
            <h2 className="text-base font-bold tracking-widest text-foreground/90">{mod.displayName}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>返回</span>
          </button>
        </div>

        {/* Module content placeholder */}
        <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border border-border/30 bg-ink-faded/10 flex items-center justify-center mb-4">
            <span className="text-rust/40">{MODULE_ICONS[mod.icon]}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{mod.description}</p>
          <div className="text-[10px] text-muted-foreground/50 font-mono border border-border/20 px-3 py-1 mt-4">
            {'moduleId: '}{mod.moduleId}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-4 max-w-xs">
            此模块内容将在后续版本中实现。模块以覆盖层形式打开，关闭后返回玩法中心。
          </p>
        </div>

        <div className="h-[2px] bg-gradient-to-r from-transparent via-rust/50 to-transparent" />
      </div>
    </div>
  )
}

export function GameplayPanel() {
  const { state } = useVN()
  const { setOverlay, setActiveModule } = useVNActions()

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOverlay("none")} />

      {/* Module overlay */}
      {state.activeModuleId && (
        <ModuleView
          moduleId={state.activeModuleId}
          onClose={() => setActiveModule(null)}
        />
      )}

      {/* Main panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 border border-border/60 bg-[var(--vn-panel-bg)] backdrop-blur-md overflow-hidden animate-fade-in-up">
        {/* Header decoration */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-rust/60 to-transparent" />
        <div className="h-[1px] mt-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="stamp-effect">
              <span className="text-rust text-xs font-bold tracking-widest">GAMEPLAY</span>
            </div>
            <h2 className="text-lg font-bold tracking-widest text-foreground/90">玩法</h2>
          </div>
          <button
            onClick={() => setOverlay("none")}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close gameplay hub"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Newspaper section header */}
        <div className="px-6 py-2 border-b border-border/20">
          <div className="text-[9px] text-muted-foreground font-mono tracking-wider text-center">
            {'--- 选择一个功能模块进入 ---'}
          </div>
        </div>

        {/* Module grid */}
        <div className="px-6 py-5 overflow-y-auto no-scrollbar max-h-[calc(85vh-130px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.gameModules.map((mod) => {
              const isLocked = !!mod.unlockCondition
              const icon = MODULE_ICONS[mod.icon] || <Compass className="w-5 h-5" />

              return (
                <button
                  key={mod.moduleId}
                  onClick={() => {
                    if (!isLocked) setActiveModule(mod.moduleId)
                  }}
                  disabled={isLocked}
                  className={`relative text-left border transition-all duration-200 cursor-pointer ${
                    isLocked
                      ? "border-border/20 opacity-40 cursor-not-allowed"
                      : "border-border/40 hover:border-rust/40 hover:bg-foreground/5"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {/* Top line */}
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 ${isLocked ? "text-muted-foreground/30" : "text-rust/70"}`}>
                        {isLocked ? <Lock className="w-5 h-5" /> : icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isLocked ? "text-muted-foreground" : "text-foreground/90"}`}>
                            {mod.displayName}
                          </span>
                          {mod.badge && (
                            <span className="text-[8px] text-rust border border-rust/30 px-1">
                              {mod.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {mod.description}
                        </p>
                        {isLocked && mod.unlockCondition && (
                          <p className="text-[9px] text-muted-foreground/50 mt-1.5 font-mono">
                            {'[ 解锁条件: '}{mod.unlockCondition}{' ]'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer info */}
          <div className="mt-6 pt-4 border-t border-border/20 text-center">
            <p className="text-[9px] text-muted-foreground/40 font-mono">
              {'模块不会影响当前剧情进度 · 关闭后返回此界面'}
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />
        <div className="h-[2px] mt-[1px] bg-gradient-to-r from-transparent via-rust/50 to-transparent" />
      </div>
    </div>
  )
}
