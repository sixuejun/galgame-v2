"use client"

import { useVN } from "@/lib/vn-store"
import { useEffect, useState } from "react"

export function StageArea() {
  const { state } = useVN()
  const [toastAnim, setToastAnim] = useState<"in" | "out" | "hidden">("hidden")

  useEffect(() => {
    if (state.toastVisible) {
      setToastAnim("in")
      const timer = setTimeout(() => setToastAnim("out"), 2500)
      const hideTimer = setTimeout(() => setToastAnim("hidden"), 3000)
      return () => {
        clearTimeout(timer)
        clearTimeout(hideTimer)
      }
    } else {
      setToastAnim("hidden")
    }
  }, [state.toastVisible, state.toastMessage])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 1: Background */}
      <div className="absolute inset-0 paper-bg">
        {state.backgroundUrl && (
          <img
            src={state.backgroundUrl}
            alt="Scene background"
            className="w-full h-full object-cover opacity-40"
            crossOrigin="anonymous"
          />
        )}
        {/* Default atmospheric background when no image */}
        {!state.backgroundUrl && (
          <div className="absolute inset-0">
            {/* Layered atmospheric effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink-faded/60 to-ink/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-ink/40" />
            {/* Decorative newspaper headlines scattered */}
            <div className="absolute top-[15%] left-[8%] text-paper/[0.04] font-serif text-6xl font-black rotate-[-8deg] select-none whitespace-nowrap">
              {'EXTRA EDITION'}
            </div>
            <div className="absolute top-[35%] right-[5%] text-paper/[0.03] font-serif text-4xl font-bold rotate-[3deg] select-none whitespace-nowrap">
              {'THE LAST GAZETTE'}
            </div>
            <div className="absolute bottom-[30%] left-[15%] text-paper/[0.04] font-serif text-5xl font-black rotate-[-3deg] select-none whitespace-nowrap">
              {'末日旧闻'}
            </div>
            <div className="absolute top-[55%] right-[20%] text-paper/[0.03] font-serif text-3xl rotate-[5deg] select-none whitespace-nowrap">
              {'第壹百零七期'}
            </div>
          </div>
        )}
      </div>

      {/* Layer 2: Characters */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        {state.characters.map((char) => (
          <div
            key={char.id}
            className={`absolute bottom-0 transition-all duration-500 ${
              char.position === "left"
                ? "left-[10%]"
                : char.position === "right"
                ? "right-[10%]"
                : "left-1/2 -translate-x-1/2"
            }`}
          >
            {char.imageUrl ? (
              <img
                src={char.imageUrl}
                alt={char.name}
                className="max-h-[80vh] object-contain drop-shadow-lg"
                style={{ filter: "sepia(0.3) contrast(0.9)" }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-48 h-80 flex items-end justify-center">
                <div className="w-32 h-64 border border-border/30 bg-ink-faded/20 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs font-mono">{char.name}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Layer 3: Effect layer */}
      {state.effectLayer && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-300"
          style={{
            ...(state.effectLayer === "flash" && { backgroundColor: "rgba(212, 197, 160, 0.8)" }),
            ...(state.effectLayer === "dark" && { backgroundColor: "rgba(42, 36, 32, 0.7)" }),
            ...(state.effectLayer === "blur" && { backdropFilter: "blur(4px)" }),
          }}
        />
      )}

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-[3]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(42,36,32,0.7)_100%)]" />
      </div>

      {/* Noise grain */}
      <div className="absolute inset-0 pointer-events-none z-[4] opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Layer 4: Toast notification (newspaper clipping style) */}
      {toastAnim !== "hidden" && state.toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className="toast-clipping px-6 py-2 text-sm max-w-md text-center"
            style={{
              animation: toastAnim === "in" ? "toast-in 0.3s ease-out forwards" : "toast-out 0.3s ease-in forwards",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-rust font-bold text-xs">{"[ 号外 ]"}</span>
              <span>{state.toastMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
