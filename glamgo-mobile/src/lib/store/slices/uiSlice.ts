import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface UIState {
  isAppLoading: boolean;
  isAppReady: boolean;
  activeModal: string | null;
  toast: Toast | null;
  bottomSheetOpen: boolean;
  bottomSheetContent: string | null;
  networkStatus: 'online' | 'offline';
  theme: 'light' | 'dark' | 'system';
}

const initialState: UIState = {
  isAppLoading: false,
  isAppReady: false,
  activeModal: null,
  toast: null,
  bottomSheetOpen: false,
  bottomSheetContent: null,
  networkStatus: 'online',
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setAppLoading: (state, action: PayloadAction<boolean>) => {
      state.isAppLoading = action.payload;
    },
    setAppReady: (state, action: PayloadAction<boolean>) => {
      state.isAppReady = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: ToastType }>) => {
      state.toast = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      if (state.toast) {
        state.toast.visible = false;
      }
    },
    clearToast: (state) => {
      state.toast = null;
    },
    openBottomSheet: (state, action: PayloadAction<string>) => {
      state.bottomSheetOpen = true;
      state.bottomSheetContent = action.payload;
    },
    closeBottomSheet: (state) => {
      state.bottomSheetOpen = false;
      state.bottomSheetContent = null;
    },
    setNetworkStatus: (state, action: PayloadAction<'online' | 'offline'>) => {
      state.networkStatus = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  setAppLoading,
  setAppReady,
  openModal,
  closeModal,
  showToast,
  hideToast,
  clearToast,
  openBottomSheet,
  closeBottomSheet,
  setNetworkStatus,
  setTheme,
} = uiSlice.actions;

// Selectors
export const selectUILoading = (state: { ui: UIState }) => state.ui.isAppLoading;
export const selectAppReady = (state: { ui: UIState }) => state.ui.isAppReady;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectToast = (state: { ui: UIState }) => state.ui.toast;
export const selectBottomSheet = (state: { ui: UIState }) => ({
  isOpen: state.ui.bottomSheetOpen,
  content: state.ui.bottomSheetContent,
});
export const selectNetworkStatus = (state: { ui: UIState }) => state.ui.networkStatus;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.networkStatus === 'online';
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;

export default uiSlice.reducer;
