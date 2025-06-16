import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks
export const uploadAvatar = createAsyncThunk(
  'upload/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const uploadCV = createAsyncThunk(
  'upload/uploadCV',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('cv', file);

      const response = await api.post('/upload/cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const uploadJobImage = createAsyncThunk(
  'upload/uploadJobImage',
  async ({ file, jobId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('jobId', jobId);

      const response = await api.post('/upload/job-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteFile = createAsyncThunk(
  'upload/deleteFile',
  async ({ type, filename }, { rejectWithValue }) => {
    try {
      await api.delete(`/upload/${type}/${filename}`);
      return { type, filename };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Initial state
const initialState = {
  avatar: {
    loading: false,
    error: null,
    progress: 0,
  },
  cv: {
    loading: false,
    error: null,
    progress: 0,
  },
  jobImage: {
    loading: false,
    error: null,
    progress: 0,
  },
};

// Slice
const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadProgress: (state, action) => {
      const { type, progress } = action.payload;
      state[type].progress = progress;
    },
    clearUploadState: (state, action) => {
      const type = action.payload;
      state[type] = initialState[type];
    },
  },
  extraReducers: (builder) => {
    builder
      // uploadAvatar
      .addCase(uploadAvatar.pending, (state) => {
        state.avatar.loading = true;
        state.avatar.error = null;
        state.avatar.progress = 0;
      })
      .addCase(uploadAvatar.fulfilled, (state) => {
        state.avatar.loading = false;
        state.avatar.progress = 100;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatar.loading = false;
        state.avatar.error = action.payload.message;
      })
      // uploadCV
      .addCase(uploadCV.pending, (state) => {
        state.cv.loading = true;
        state.cv.error = null;
        state.cv.progress = 0;
      })
      .addCase(uploadCV.fulfilled, (state) => {
        state.cv.loading = false;
        state.cv.progress = 100;
      })
      .addCase(uploadCV.rejected, (state, action) => {
        state.cv.loading = false;
        state.cv.error = action.payload.message;
      })
      // uploadJobImage
      .addCase(uploadJobImage.pending, (state) => {
        state.jobImage.loading = true;
        state.jobImage.error = null;
        state.jobImage.progress = 0;
      })
      .addCase(uploadJobImage.fulfilled, (state) => {
        state.jobImage.loading = false;
        state.jobImage.progress = 100;
      })
      .addCase(uploadJobImage.rejected, (state, action) => {
        state.jobImage.loading = false;
        state.jobImage.error = action.payload.message;
      });
  },
});

// Actions
export const { setUploadProgress, clearUploadState } = uploadSlice.actions;

// Selectors
export const selectUploadState = (state) => state.upload;
export const selectAvatarUpload = (state) => state.upload.avatar;
export const selectCVUpload = (state) => state.upload.cv;
export const selectJobImageUpload = (state) => state.upload.jobImage;

export default uploadSlice.reducer; 