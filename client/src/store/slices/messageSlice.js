import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks
export const getMessages = createAsyncThunk(
  'messages/getMessages',
  async ({ userId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages?userId=${userId}&page=${page}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ receiverId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post('/messages', { receiverId, content });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      await api.delete(`/messages/${messageId}`);
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getConversations = createAsyncThunk(
  'messages/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Initial state
const initialState = {
  messages: [],
  conversations: [],
  currentChat: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pages: 1,
};

// Slice
const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find((msg) => msg._id === messageId);
      if (message) {
        message.status = status;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentChat = null;
      state.total = 0;
      state.page = 1;
      state.pages = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // getMessages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // markMessageAsRead
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const message = state.messages.find((msg) => msg._id === action.payload._id);
        if (message) {
          message.read = true;
        }
      })
      // deleteMessage
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter((msg) => msg._id !== action.payload);
      })
      // getConversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });
  },
});

// Actions
export const {
  setCurrentChat,
  addMessage,
  updateMessageStatus,
  clearMessages,
} = messageSlice.actions;

// Selectors
export const selectMessages = (state) => state.messages.messages;
export const selectConversations = (state) => state.messages.conversations;
export const selectCurrentChat = (state) => state.messages.currentChat;
export const selectMessagesLoading = (state) => state.messages.loading;
export const selectMessagesError = (state) => state.messages.error;
export const selectMessagesPagination = (state) => ({
  total: state.messages.total,
  page: state.messages.page,
  pages: state.messages.pages,
});

export default messageSlice.reducer; 