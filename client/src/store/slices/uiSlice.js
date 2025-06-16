import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  sidebarOpen: false,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  toast: {
    isOpen: false,
    type: 'info',
    message: '',
  },
  loading: {
    global: false,
    requests: {},
  },
  errors: {
    global: null,
    fields: {},
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeModal: (state) => {
      state.modal = initialState.modal;
    },
    showToast: (state, action) => {
      state.toast = {
        isOpen: true,
        type: action.payload.type || 'info',
        message: action.payload.message,
      };
    },
    hideToast: (state) => {
      state.toast.isOpen = false;
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    startRequest: (state, action) => {
      state.loading.requests[action.payload] = true;
    },
    endRequest: (state, action) => {
      state.loading.requests[action.payload] = false;
    },
    setGlobalError: (state, action) => {
      state.errors.global = action.payload;
    },
    clearGlobalError: (state) => {
      state.errors.global = null;
    },
    setFieldError: (state, action) => {
      state.errors.fields[action.payload.field] = action.payload.message;
    },
    clearFieldError: (state, action) => {
      delete state.errors.fields[action.payload];
    },
    clearAllFieldErrors: (state) => {
      state.errors.fields = {};
    },
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme,
      };
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  openModal,
  closeModal,
  showToast,
  hideToast,
  setGlobalLoading,
  startRequest,
  endRequest,
  setGlobalError,
  clearGlobalError,
  setFieldError,
  clearFieldError,
  clearAllFieldErrors,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectModal = (state) => state.ui.modal;
export const selectToast = (state) => state.ui.toast;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectRequestLoading = (state, requestId) =>
  state.ui.loading.requests[requestId];
export const selectGlobalError = (state) => state.ui.errors.global;
export const selectFieldError = (state, field) => state.ui.errors.fields[field];

export default uiSlice.reducer; 