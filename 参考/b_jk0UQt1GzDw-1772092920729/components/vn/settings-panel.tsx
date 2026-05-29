"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { X, Volume2, Type, Monitor, Palette, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

const SKIN_PRESETS = [
  { id: "newspaper-default", name: "旧报", description: "泛黄报纸，油墨褪色" },
  { id: "telegram", name: "电报", description: "深灰背景，打字机字体" },
  { id: "wartime", name: "战时", description: "深红点缀，军事通讯风" },
  { id: "archive", name: "档案", description: "牛皮纸色，公文档案风" },
]

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-rust">{icon}</span>
      <h3 className="text-sm font-bold tracking-widest text-foreground/90">{title}</h3>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-border/60 to-transparent" />
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "",
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="text-xs text-foreground/70 w-20 shrink-0">{label}</span>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground font-mono w-10 text-right">
        {value}{suffix}
      </span>
    </div>
  )
}

export function SettingsPanel() {
  const { state } = useVN()
  const { setOverlay, updateSettings } = useVNActions()

  const handleReset = () => {
    updateSettings({
      textSpeed: 5,
      autoPlaySpeed: 5,
      autoPlay: false,
      bgmVolume: 70,
      sfxVolume: 80,
      voiceVolume: 100,
      portraitMode: false,
      skinId: "newspaper-default",
    })
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOverlay("none")} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 border border-border/60 bg-[var(--vn-panel-bg)] backdrop-blur-md overflow-hidden animate-fade-in-up">
        {/* Header decoration */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-rust/60 to-transparent" />
        <div className="h-[1px] mt-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="stamp-effect">
              <span className="text-rust text-xs font-bold tracking-widest">SETTINGS</span>
            </div>
            <h2 className="text-lg font-bold tracking-widest text-foreground/90">设置</h2>
          </div>
          <button
            onClick={() => setOverlay("none")}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto no-scrollbar max-h-[calc(85vh-80px)]">
          {/* Volume Controls */}
          <SectionHeader icon={<Volume2 className="w-4 h-4" />} title="音量设置" />
          <div className="mb-6 pl-2">
            <SliderRow
              label="背景音乐"
              value={state.settings.bgmVolume}
              onChange={(v) => updateSettings({ bgmVolume: v })}
            />
            <SliderRow
              label="音效"
              value={state.settings.sfxVolume}
              onChange={(v) => updateSettings({ sfxVolume: v })}
            />
            <SliderRow
              label="语音"
              value={state.settings.voiceVolume}
              onChange={(v) => updateSettings({ voiceVolume: v })}
            />
          </div>

          {/* Text Settings */}
          <SectionHeader icon={<Type className="w-4 h-4" />} title="文字显示" />
          <div className="mb-6 pl-2">
            <SliderRow
              label="文字速度"
              value={state.settings.textSpeed}
              onChange={(v) => updateSettings({ textSpeed: v })}
              min={1}
              max={10}
            />
            <SliderRow
              label="自动速度"
              value={state.settings.autoPlaySpeed}
              onChange={(v) => updateSettings({ autoPlaySpeed: v })}
              min={1}
              max={10}
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-foreground/70">自动播放</span>
              <Switch
                checked={state.settings.autoPlay}
                onCheckedChange={(v) => updateSettings({ autoPlay: v })}
              />
            </div>
          </div>

          {/* Display Settings */}
          <SectionHeader icon={<Monitor className="w-4 h-4" />} title="显示设置" />
          <div className="mb-6 pl-2">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs text-foreground/70">竖屏模式</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  开启后支持手势操作，左划/右划快速切换界面
                </p>
              </div>
              <Switch
                checked={state.settings.portraitMode}
                onCheckedChange={(v) => updateSettings({ portraitMode: v })}
              />
            </div>
          </div>

          {/* Skin System */}
          <SectionHeader icon={<Palette className="w-4 h-4" />} title="界面皮肤" />
          <div className="mb-6 pl-2">
            <div className="grid grid-cols-2 gap-2">
              {SKIN_PRESETS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => updateSettings({ skinId: skin.id })}
                  className={`p-3 border text-left transition-all duration-200 cursor-pointer ${
                    state.settings.skinId === skin.id
                      ? "border-rust bg-rust/10"
                      : "border-border/40 hover:border-border/70 bg-transparent"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  <div className="text-xs font-bold text-foreground/90 mb-1">{skin.name}</div>
                  <div className="text-[10px] text-muted-foreground">{skin.description}</div>
                  {state.settings.skinId === skin.id && (
                    <div className="mt-1.5 text-[9px] text-rust font-mono tracking-wider">
                      {"[ 当前使用 ]"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="border-t border-border/20 pt-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>恢复默认设置</span>
            </button>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />
        <div className="h-[2px] mt-[1px] bg-gradient-to-r from-transparent via-rust/50 to-transparent" />
      </div>
    </div>
  )
}
