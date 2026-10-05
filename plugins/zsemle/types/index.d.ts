/** isRestarted: the reset time passed and no fresh reading came since (logic.current). */
export type Limit = { kind: string; percentUsed: number; resetsAt?: string; isRestarted?: boolean }

declare module 'claude-code' {
  interface PluginState {
    zsemle: {
      limits: Limit[]
      limitsReadAt: number
      announcedResets: string[]
      isHidden: boolean
      isWoken: boolean
      isGuardOff: boolean
    }
  }
}
