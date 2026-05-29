"use client"

import { createContext, useContext, useReducer, type ReactNode, useCallback, useMemo } from "react"

// ============ TYPES ============

export interface DialogueLine {
  id: string
  speaker?: string
  text: string
  isNarration?: boolean
}

export interface Choice {
  choiceId: string
  text: string
  isCustomInput?: boolean
}

export interface CharacterOnStage {
  id: string
  name: string
  position: "left" | "center" | "right"
  imageUrl?: string
}

export interface GameModule {
  moduleId: string
  displayName: string
  description: string
  icon: string
  openMode: "overlay" | "fullscreen"
  closeBehavior: "returnHub" | "returnVN"
  unlockCondition?: string
  badge?: string
}

export interface CharacterStatus {
  id: string
  name: string
  avatarUrl: string
  affection: number
  unlocked: boolean
  description?: string
}

export interface UserCharacter {
  name: string
  avatarUrl: string
  showSprite: boolean
}

export interface VNSettings {
  textSpeed: number // 1-10
  autoPlaySpeed: number // 1-10
  autoPlay: boolean
  bgmVolume: number // 0-100
  sfxVolume: number // 0-100
  voiceVolume: number // 0-100
  portraitMode: boolean
  skinId: string
}

export type OverlayPanel = "none" | "settings" | "history" | "character" | "gameplay" | "module"

export interface VNState {
  // Dialogue system
  dialogueHistory: DialogueLine[]
  currentLineIndex: number
  isTyping: boolean
  autoScrollEnabled: boolean

  // Choice system
  choices: Choice[]
  selectedChoiceId: string | null
  choiceLocked: boolean
  customInputText: string

  // Stage
  backgroundUrl: string
  characters: CharacterOnStage[]
  effectLayer: string | null

  // Toast / notification
  toastMessage: string | null
  toastVisible: boolean

  // UI state
  activeOverlay: OverlayPanel
  leftMenuExpanded: boolean
  rightMenuExpanded: boolean
  activeModuleId: string | null

  // Settings
  settings: VNSettings

  // User character
  userCharacter: UserCharacter

  // Character roster
  characterRoster: CharacterStatus[]

  // Game modules
  gameModules: GameModule[]
}

// ============ ACTIONS ============

type VNAction =
  | { type: "SET_DIALOGUE_HISTORY"; payload: DialogueLine[] }
  | { type: "GO_TO_LINE"; payload: number }
  | { type: "NEXT_LINE" }
  | { type: "PREV_LINE" }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "SET_AUTO_SCROLL"; payload: boolean }
  | { type: "SET_CHOICES"; payload: Choice[] }
  | { type: "SELECT_CHOICE"; payload: string | null }
  | { type: "SET_CHOICE_LOCKED"; payload: boolean }
  | { type: "SET_CUSTOM_INPUT"; payload: string }
  | { type: "CLEAR_CHOICES" }
  | { type: "SET_BACKGROUND"; payload: string }
  | { type: "SET_CHARACTERS"; payload: CharacterOnStage[] }
  | { type: "SET_EFFECT"; payload: string | null }
  | { type: "SHOW_TOAST"; payload: string }
  | { type: "HIDE_TOAST" }
  | { type: "SET_OVERLAY"; payload: OverlayPanel }
  | { type: "TOGGLE_LEFT_MENU" }
  | { type: "TOGGLE_RIGHT_MENU" }
  | { type: "SET_ACTIVE_MODULE"; payload: string | null }
  | { type: "UPDATE_SETTINGS"; payload: Partial<VNSettings> }
  | { type: "UPDATE_USER_CHARACTER"; payload: Partial<UserCharacter> }
  | { type: "SET_CHARACTER_ROSTER"; payload: CharacterStatus[] }
  | { type: "SET_GAME_MODULES"; payload: GameModule[] }

// ============ INITIAL STATE ============

const DEMO_DIALOGUE: DialogueLine[] = [
  { id: "1", text: "......灰色的天空下，老旧的报纸在风中翻飞。", isNarration: true },
  { id: "2", speaker: "???", text: "你醒了。别急着动，外面不安全。" },
  { id: "3", text: "空气中弥漫着铁锈和陈旧墨水的味道。我的视线逐渐聚焦，映入眼帘的是一间堆满发黄报纸的破旧房间。", isNarration: true },
  { id: "4", speaker: "???", text: "你还记得自己的名字吗？这年头，很多人连名字都忘了。" },
  { id: "5", text: "窗外传来远处的爆裂声，像是什么巨大的东西正在坍塌。她的眼神中透着一丝不易察觉的忧虑。", isNarration: true },
  { id: "6", speaker: "???", text: "外面的世界已经不是你记忆中的样子了。报纸上写的那些——都已成真。" },
  { id: "7", text: "她将一份泛黄的报纸递到我面前。头版的标题已经模糊不清，但依稀能辨认出几个大字：「末日降临」。", isNarration: true },
  { id: "8", speaker: "???", text: "走吧，留在这里太久不安全。跟我来，我带你去一个还算安全的地方。" },
]

const DEMO_CHARACTERS: CharacterStatus[] = [
  { id: "c1", name: "???", avatarUrl: "", affection: 0, unlocked: true, description: "神秘的引路人。" },
  { id: "c2", name: "旧报童", avatarUrl: "", affection: 0, unlocked: false, description: "在废墟中收集旧报纸的少年。" },
  { id: "c3", name: "铁匠", avatarUrl: "", affection: 0, unlocked: false, description: "末日中仅存的工匠之一。" },
]

const DEMO_MODULES: GameModule[] = [
  { moduleId: "explore", displayName: "废墟探索", description: "在残破的城市废墟中搜寻物资与线索", icon: "compass", openMode: "overlay", closeBehavior: "returnHub" },
  { moduleId: "craft", displayName: "物品制作", description: "利用收集到的材料制作生存工具", icon: "hammer", openMode: "overlay", closeBehavior: "returnHub" },
  { moduleId: "trade", displayName: "黑市交易", description: "与其他幸存者进行以物易物", icon: "repeat", openMode: "overlay", closeBehavior: "returnHub", unlockCondition: "完成第二章" },
  { moduleId: "archive", displayName: "旧闻档案", description: "收集到的旧报纸碎片，拼凑出末日前的真相", icon: "newspaper", openMode: "overlay", closeBehavior: "returnHub" },
]

const initialState: VNState = {
  dialogueHistory: DEMO_DIALOGUE,
  currentLineIndex: 0,
  isTyping: false,
  autoScrollEnabled: false,
  choices: [],
  selectedChoiceId: null,
  choiceLocked: false,
  customInputText: "",
  backgroundUrl: "",
  characters: [],
  effectLayer: null,
  toastMessage: null,
  toastVisible: false,
  activeOverlay: "none",
  leftMenuExpanded: false,
  rightMenuExpanded: false,
  activeModuleId: null,
  settings: {
    textSpeed: 5,
    autoPlaySpeed: 5,
    autoPlay: false,
    bgmVolume: 70,
    sfxVolume: 80,
    voiceVolume: 100,
    portraitMode: false,
    skinId: "newspaper-default",
  },
  userCharacter: {
    name: "旅人",
    avatarUrl: "",
    showSprite: false,
  },
  characterRoster: DEMO_CHARACTERS,
  gameModules: DEMO_MODULES,
}

// ============ REDUCER ============

function vnReducer(state: VNState, action: VNAction): VNState {
  switch (action.type) {
    case "SET_DIALOGUE_HISTORY":
      return { ...state, dialogueHistory: action.payload, currentLineIndex: 0 }
    case "GO_TO_LINE":
      return {
        ...state,
        currentLineIndex: Math.max(0, Math.min(action.payload, state.dialogueHistory.length - 1)),
      }
    case "NEXT_LINE":
      return {
        ...state,
        currentLineIndex: Math.min(state.currentLineIndex + 1, state.dialogueHistory.length - 1),
      }
    case "PREV_LINE":
      return {
        ...state,
        currentLineIndex: Math.max(state.currentLineIndex - 1, 0),
      }
    case "SET_TYPING":
      return { ...state, isTyping: action.payload }
    case "SET_AUTO_SCROLL":
      return { ...state, autoScrollEnabled: action.payload }
    case "SET_CHOICES":
      return { ...state, choices: action.payload, selectedChoiceId: null, choiceLocked: false, customInputText: "" }
    case "SELECT_CHOICE":
      return { ...state, selectedChoiceId: action.payload }
    case "SET_CHOICE_LOCKED":
      return { ...state, choiceLocked: action.payload }
    case "SET_CUSTOM_INPUT":
      return { ...state, customInputText: action.payload }
    case "CLEAR_CHOICES":
      return { ...state, choices: [], selectedChoiceId: null, choiceLocked: false, customInputText: "" }
    case "SET_BACKGROUND":
      return { ...state, backgroundUrl: action.payload }
    case "SET_CHARACTERS":
      return { ...state, characters: action.payload }
    case "SET_EFFECT":
      return { ...state, effectLayer: action.payload }
    case "SHOW_TOAST":
      return { ...state, toastMessage: action.payload, toastVisible: true }
    case "HIDE_TOAST":
      return { ...state, toastVisible: false }
    case "SET_OVERLAY":
      return { ...state, activeOverlay: action.payload, leftMenuExpanded: false, rightMenuExpanded: false }
    case "TOGGLE_LEFT_MENU":
      return { ...state, leftMenuExpanded: !state.leftMenuExpanded, rightMenuExpanded: false }
    case "TOGGLE_RIGHT_MENU":
      return { ...state, rightMenuExpanded: !state.rightMenuExpanded, leftMenuExpanded: false }
    case "SET_ACTIVE_MODULE":
      return { ...state, activeModuleId: action.payload }
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case "UPDATE_USER_CHARACTER":
      return { ...state, userCharacter: { ...state.userCharacter, ...action.payload } }
    case "SET_CHARACTER_ROSTER":
      return { ...state, characterRoster: action.payload }
    case "SET_GAME_MODULES":
      return { ...state, gameModules: action.payload }
    default:
      return state
  }
}

// ============ CONTEXT ============

interface VNContextType {
  state: VNState
  dispatch: React.Dispatch<VNAction>
}

const VNContext = createContext<VNContextType | null>(null)

export function VNProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(vnReducer, initialState)

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <VNContext.Provider value={value}>{children}</VNContext.Provider>
}

export function useVN() {
  const context = useContext(VNContext)
  if (!context) throw new Error("useVN must be used within VNProvider")
  return context
}

// ============ CONVENIENCE HOOKS ============

export function useVNActions() {
  const { dispatch } = useVN()

  const nextLine = useCallback(() => dispatch({ type: "NEXT_LINE" }), [dispatch])
  const prevLine = useCallback(() => dispatch({ type: "PREV_LINE" }), [dispatch])
  const goToLine = useCallback((i: number) => dispatch({ type: "GO_TO_LINE", payload: i }), [dispatch])
  const setTyping = useCallback((v: boolean) => dispatch({ type: "SET_TYPING", payload: v }), [dispatch])
  const setAutoScroll = useCallback((v: boolean) => dispatch({ type: "SET_AUTO_SCROLL", payload: v }), [dispatch])

  const setChoices = useCallback((c: Choice[]) => dispatch({ type: "SET_CHOICES", payload: c }), [dispatch])
  const selectChoice = useCallback((id: string | null) => dispatch({ type: "SELECT_CHOICE", payload: id }), [dispatch])
  const lockChoice = useCallback(() => dispatch({ type: "SET_CHOICE_LOCKED", payload: true }), [dispatch])
  const setCustomInput = useCallback((t: string) => dispatch({ type: "SET_CUSTOM_INPUT", payload: t }), [dispatch])
  const clearChoices = useCallback(() => dispatch({ type: "CLEAR_CHOICES" }), [dispatch])

  const showToast = useCallback((msg: string) => {
    dispatch({ type: "SHOW_TOAST", payload: msg })
    setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 3000)
  }, [dispatch])

  const setOverlay = useCallback((p: OverlayPanel) => dispatch({ type: "SET_OVERLAY", payload: p }), [dispatch])
  const toggleLeftMenu = useCallback(() => dispatch({ type: "TOGGLE_LEFT_MENU" }), [dispatch])
  const toggleRightMenu = useCallback(() => dispatch({ type: "TOGGLE_RIGHT_MENU" }), [dispatch])
  const setActiveModule = useCallback((id: string | null) => dispatch({ type: "SET_ACTIVE_MODULE", payload: id }), [dispatch])

  const updateSettings = useCallback((s: Partial<VNSettings>) => dispatch({ type: "UPDATE_SETTINGS", payload: s }), [dispatch])
  const updateUserCharacter = useCallback((u: Partial<UserCharacter>) => dispatch({ type: "UPDATE_USER_CHARACTER", payload: u }), [dispatch])

  return {
    nextLine, prevLine, goToLine, setTyping, setAutoScroll,
    setChoices, selectChoice, lockChoice, setCustomInput, clearChoices,
    showToast, setOverlay, toggleLeftMenu, toggleRightMenu, setActiveModule,
    updateSettings, updateUserCharacter,
  }
}
