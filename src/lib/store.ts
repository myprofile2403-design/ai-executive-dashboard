'use client'

import { create } from 'zustand'

export type ViewType = 'overview' | 'tasks' | 'reminders' | 'expenses' | 'notes' | 'settings' | 'work'

interface AppState {
  activeView: ViewType
  setActiveView: (view: ViewType) => void
  supabaseUrl: string
  supabaseKey: string
  setSupabaseConfig: (url: string, key: string) => void
  configLoaded: boolean
  setConfigLoaded: (loaded: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'overview',
  setActiveView: (view) => set({ activeView: view }),
  supabaseUrl: '',
  supabaseKey: '',
  setSupabaseConfig: (url, key) => set({ supabaseUrl: url, supabaseKey: key }),
  configLoaded: false,
  setConfigLoaded: (loaded) => set({ configLoaded: loaded }),
}))
