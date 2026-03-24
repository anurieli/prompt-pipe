import { create } from 'zustand'

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error'

type RightPanelTab = 'output' | 'edit'

type NewIdeaModal = 'none' | 'open'

type UIStoreState = {
  activeIdeaId: string | null
  selectedStepId: string | null
  selectedThreadId: string | null
  rightPanelTab: RightPanelTab
  connectionStatus: ConnectionStatus
  connectionError: string | null
  newIdeaModal: NewIdeaModal
  setActiveIdea: (id: string | null) => void
  selectStep: (id: string | null) => void
  selectThread: (stepId: string, threadId: string | null) => void
  setRightPanelTab: (tab: RightPanelTab) => void
  setConnectionStatus: (status: ConnectionStatus, error?: string) => void
  openNewIdeaModal: (modal: NewIdeaModal) => void
  closeNewIdeaModal: () => void
}

export const useUIStore = create<UIStoreState>()((set) => ({
  activeIdeaId: null,
  selectedStepId: null,
  selectedThreadId: null,
  rightPanelTab: 'output',
  connectionStatus: 'idle',
  connectionError: null,
  newIdeaModal: 'none',
  setActiveIdea: (id) => set({ activeIdeaId: id, selectedStepId: null, selectedThreadId: null, rightPanelTab: 'output' }),
  selectStep: (id) => set({ selectedStepId: id, selectedThreadId: null, rightPanelTab: id ? 'edit' : 'output' }),
  selectThread: (stepId, threadId) => set({ selectedStepId: stepId, selectedThreadId: threadId, rightPanelTab: threadId ? 'edit' : 'output' }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setConnectionStatus: (status, error) =>
    set({
      connectionStatus: status,
      connectionError: error ?? null,
    }),
  openNewIdeaModal: (modal) => set({ newIdeaModal: modal }),
  closeNewIdeaModal: () => set({ newIdeaModal: 'none' }),
}))
