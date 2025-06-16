import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks
export const searchJobs = createAsyncThunk(
  'search/searchJobs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/search/jobs', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const searchUsers = createAsyncThunk(
  'search/searchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/search/users', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getSuggestions = createAsyncThunk(
  'search/getSuggestions',
  async ({ query, type }, { rejectWithValue }) => {
    try {
      const response = await api.get('/search/suggestions', {
        params: { query, type },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Initial state
const initialState = {
  jobs: {
    results: [],
    total: 0,
    page: 1,
    pages: 1,
    loading: false,
    error: null,
  },
  users: {
    results: [],
    total: 0,
    page: 1,
    pages: 1,
    loading: false,
    error: null,
  },
  suggestions: {
    jobs: [],
    skills: [],
    locations: [],
    loading: false,
    error: null,
  },
  filters: {
    jobs: {
      query: '',
      type: '',
      location: '',
      experience: '',
      salary: '',
      skills: [],
      company: '',
      sort: 'newest',
    },
    users: {
      query: '',
      role: '',
      skills: [],
      experience: '',
      location: '',
      sort: 'relevance',
    },
  },
};

// Slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setJobFilters: (state, action) => {
      state.filters.jobs = {
        ...state.filters.jobs,
        ...action.payload,
      };
    },
    setUserFilters: (state, action) => {
      state.filters.users = {
        ...state.filters.users,
        ...action.payload,
      };
    },
    clearJobFilters: (state) => {
      state.filters.jobs = initialState.filters.jobs;
    },
    clearUserFilters: (state) => {
      state.filters.users = initialState.filters.users;
    },
    clearSearchResults: (state) => {
      state.jobs = initialState.jobs;
      state.users = initialState.users;
    },
  },
  extraReducers: (builder) => {
    builder
      // searchJobs
      .addCase(searchJobs.pending, (state) => {
        state.jobs.loading = true;
        state.jobs.error = null;
      })
      .addCase(searchJobs.fulfilled, (state, action) => {
        state.jobs.loading = false;
        state.jobs.results = action.payload.jobs;
        state.jobs.total = action.payload.total;
        state.jobs.page = action.payload.page;
        state.jobs.pages = action.payload.pages;
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.jobs.loading = false;
        state.jobs.error = action.payload.message;
      })
      // searchUsers
      .addCase(searchUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.results = action.payload.users;
        state.users.total = action.payload.total;
        state.users.page = action.payload.page;
        state.users.pages = action.payload.pages;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload.message;
      })
      // getSuggestions
      .addCase(getSuggestions.pending, (state) => {
        state.suggestions.loading = true;
        state.suggestions.error = null;
      })
      .addCase(getSuggestions.fulfilled, (state, action) => {
        state.suggestions.loading = false;
        state.suggestions[action.meta.arg.type] = action.payload;
      })
      .addCase(getSuggestions.rejected, (state, action) => {
        state.suggestions.loading = false;
        state.suggestions.error = action.payload.message;
      });
  },
});

// Actions
export const {
  setJobFilters,
  setUserFilters,
  clearJobFilters,
  clearUserFilters,
  clearSearchResults,
} = searchSlice.actions;

// Selectors
export const selectJobResults = (state) => state.search.jobs.results;
export const selectUserResults = (state) => state.search.users.results;
export const selectJobFilters = (state) => state.search.filters.jobs;
export const selectUserFilters = (state) => state.search.filters.users;
export const selectSuggestions = (state) => state.search.suggestions;
export const selectSearchLoading = (state) => ({
  jobs: state.search.jobs.loading,
  users: state.search.users.loading,
  suggestions: state.search.suggestions.loading,
});
export const selectSearchError = (state) => ({
  jobs: state.search.jobs.error,
  users: state.search.users.error,
  suggestions: state.search.suggestions.error,
});
export const selectSearchPagination = (state) => ({
  jobs: {
    total: state.search.jobs.total,
    page: state.search.jobs.page,
    pages: state.search.jobs.pages,
  },
  users: {
    total: state.search.users.total,
    page: state.search.users.page,
    pages: state.search.users.pages,
  },
});

export default searchSlice.reducer; 