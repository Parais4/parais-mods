/** isRestarted: the reset time passed and no fresh reading came since (logic.current). */
export type Limit = { kind: string; percentUsed: number; resetsAt?: string; isRestarted?: boolean }

declare module 'claude-code' {
  interface PluginState {
    zsemle: {
      limits: Limit[]
      limitsReadAt: number
      announcedResets: string[]
      isHidden: boolean
      /** Folded down to one button (the bubble's or the figure's "lecsuk"); a press opens it again. */
      isFolded: boolean
      isWoken: boolean
      isGuardOff: boolean
    }
  }
}
