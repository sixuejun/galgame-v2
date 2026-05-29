"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { X, Upload, User, Eye, EyeOff, Heart } from "lucide-react"
import { useState, useRef, useCallback } from "react"
import { Switch } from "@/components/ui/switch"

export function CharacterPanel() {
  const { state } = useVN()
  const { setOverlay, updateUserCharacter } = useVNActions()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showFullAvatar, setShowFullAvatar] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(state.userCharacter.name)

  const handleAvatarUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith("image/")) return

      const url = URL.createObjectURL(file)
      updateUserCharacter({ avatarUrl: url })
    },
    [updateUserCharacter]
  )

  const handleNameSave = useCallback(() => {
    if (nameValue.trim()) {
      updateUserCharacter({ name: nameValue.trim() })
    }
    setEditingName(false)
  }, [nameValue, updateUserCharacter])

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOverlay("none")} />

      {/* Full avatar preview */}
      {showFullAvatar && state.userCharacter.avatarUrl && (
        <div
          className="absolute inset-0 z-[60] bg-ink/90 flex items-center justify-center cursor-pointer"
          onClick={() => setShowFullAvatar(false)}
        >
          <img
            src={state.userCharacter.avatarUrl}
            alt={state.userCharacter.name}
            className="max-w-[80vw] max-h-[80vh] object-contain border border-border/30"
            style={{ filter: "sepia(0.2) contrast(0.9)" }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 border border-border/60 bg-[var(--vn-panel-bg)] backdrop-blur-md overflow-hidden animate-fade-in-up">
        {/* Header decoration */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-rust/60 to-transparent" />
        <div className="h-[1px] mt-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="stamp-effect">
              <span className="text-rust text-xs font-bold tracking-widest">PROFILE</span>
            </div>
            <h2 className="text-lg font-bold tracking-widest text-foreground/90">角色</h2>
          </div>
          <button
            onClick={() => setOverlay("none")}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close character panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto no-scrollbar max-h-[calc(85vh-80px)]">
          {/* User character section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-rust" />
              <h3 className="text-sm font-bold tracking-widest text-foreground/90">我的角色</h3>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-border/60 to-transparent" />
            </div>

            <div className="flex gap-5">
              {/* Avatar area */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative w-24 h-24 border border-border/50 bg-ink-faded/20 overflow-hidden cursor-pointer group"
                  onClick={() => {
                    if (state.userCharacter.avatarUrl) {
                      setShowFullAvatar(true)
                    } else {
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  {state.userCharacter.avatarUrl ? (
                    <>
                      <img
                        src={state.userCharacter.avatarUrl}
                        alt={state.userCharacter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: "sepia(0.3) contrast(0.9)" }}
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-5 h-5 text-foreground" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[9px]">上传头像</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {state.userCharacter.avatarUrl ? "更换头像" : "选择图片"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Info area */}
              <div className="flex-1">
                {/* Name */}
                <div className="mb-3">
                  <span className="text-[10px] text-muted-foreground block mb-1">姓名</span>
                  {editingName ? (
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                      autoFocus
                      className="w-full bg-ink-faded/30 border border-border/40 px-2 py-1 text-sm text-foreground outline-none focus:border-rust/50"
                      style={{ borderRadius: "2px" }}
                    />
                  ) : (
                    <div
                      className="text-sm text-foreground/90 cursor-pointer hover:text-rust transition-colors"
                      onClick={() => setEditingName(true)}
                    >
                      {state.userCharacter.name}
                      <span className="text-[9px] text-muted-foreground ml-2">{"(点击编辑)"}</span>
                    </div>
                  )}
                </div>

                {/* Sprite toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {state.userCharacter.showSprite ? (
                      <Eye className="w-3.5 h-3.5 text-rust" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-foreground/70">显示对话框立绘</span>
                  </div>
                  <Switch
                    checked={state.userCharacter.showSprite}
                    onCheckedChange={(v) => updateUserCharacter({ showSprite: v })}
                    disabled={!state.userCharacter.avatarUrl}
                  />
                </div>
                {!state.userCharacter.avatarUrl && (
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
                    请先上传头像才能开启立绘显示
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="headline-rule mb-6">
            <span className="text-[9px] text-muted-foreground font-mono tracking-widest px-2 bg-[var(--vn-panel-bg)] relative z-10">
              {'--- 角色图鉴 ---'}
            </span>
          </div>

          {/* Character roster */}
          <div className="flex flex-col gap-3">
            {state.characterRoster.map((char) => (
              <div
                key={char.id}
                className={`border transition-all duration-200 ${
                  char.unlocked
                    ? "border-border/40 bg-foreground/[0.02]"
                    : "border-border/20 bg-ink-faded/10 opacity-50"
                }`}
                style={{ borderRadius: "2px" }}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 border border-border/30 bg-ink-faded/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {char.avatarUrl ? (
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                        style={{ filter: "sepia(0.4)" }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${char.unlocked ? "text-foreground/90" : "text-muted-foreground"}`}>
                        {char.unlocked ? char.name : "???"}
                      </span>
                      {!char.unlocked && (
                        <span className="text-[8px] text-muted-foreground border border-border/30 px-1">
                          未解锁
                        </span>
                      )}
                    </div>
                    {char.unlocked && char.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {char.description}
                      </p>
                    )}
                  </div>

                  {/* Affection */}
                  {char.unlocked && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Heart className="w-3 h-3 text-rust/60" />
                      <span className="text-xs font-mono text-muted-foreground">{char.affection}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />
        <div className="h-[2px] mt-[1px] bg-gradient-to-r from-transparent via-rust/50 to-transparent" />
      </div>
    </div>
  )
}
