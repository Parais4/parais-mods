export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    zsemle: {
      limits: Limit[]
      isHidden: boolean
      isWoken: boolean
      isGuardOff: boolean
    }
  }
}
