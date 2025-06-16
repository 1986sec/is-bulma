import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAll',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/notifications');
      return true;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  filters: {
    type: '',
    read: '',
    sort: 'newest',
  },
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    updateNotification: (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n._id === action.payload._id
      );
      if (index !== -1) {
        state.notifications[index] = action.payload;
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch notifications';
      })
      // Mark as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = state.notifications.map((notification) =>
          notification._id === action.payload._id
            ? { ...notification, read: true }
            : notification
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to mark notification as read';
      })
      // Mark All as Read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.loading = false;
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          read: true,
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to mark all notifications as read';
      })
      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false;
        const deletedNotification = state.notifications.find(
          (n) => n._id === action.payload
        );
        if (deletedNotification && !deletedNotification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          (n) => n._id !== action.payload
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete notification';
      })
      // Delete All Notifications
      .addCase(deleteAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.loading = false;
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete all notifications';
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  addNotification,
  updateNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer; 