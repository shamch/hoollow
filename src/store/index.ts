import { create } from 'zustand';

interface ToastItem {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    duration: number;
}

interface UserState {
    hasCompletedOnboarding: boolean;
    setHasCompletedOnboarding: (status: boolean) => void;
    environment: 'human' | 'super';
    setEnvironment: (env: 'human' | 'super') => void;
    toasts: ToastItem[];
    addToast: (toast: Omit<ToastItem, 'id'>) => void;
    removeToast: (id: string) => void;
}

let toastId = 0;

export const useStore = create<UserState>((set) => ({
    hasCompletedOnboarding: false,
    setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
    environment: 'human',
    setEnvironment: (env) => set({ environment: env }),
    toasts: [],
    addToast: (toast) =>
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id: String(++toastId) }],
        })),
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));

// Convenience helper
export const showToast = (type: ToastItem['type'], message: string, duration = 4000) => {
    useStore.getState().addToast({ type, message, duration });
};
