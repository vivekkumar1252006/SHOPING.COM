import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const storedUser = localStorage.getItem('smartcart_user')
    ? JSON.parse(localStorage.getItem('smartcart_user'))
    : null;
const storedToken = localStorage.getItem('smartcart_token') || storedUser?.token || null;

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const user = response.data?.user || response.data?.data?.user;
      const token = response.data?.token || response.data?.data?.token;
      if (user && token) {
        localStorage.setItem('smartcart_user', JSON.stringify(user));
        localStorage.setItem('smartcart_token', token);
      }
      return { user, token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const user = response.data?.user || response.data?.data?.user;
      const token = response.data?.token || response.data?.data?.token;
      if (user && token) {
        localStorage.setItem('smartcart_user', JSON.stringify(user));
        localStorage.setItem('smartcart_token', token);
      }
      return { user, token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data?.user || response.data?.data?.user || response.data?.data;
      if (user) {
        localStorage.setItem('smartcart_user', JSON.stringify(user));
      }
      return user;
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('smartcart_user');
        localStorage.removeItem('smartcart_token');
      }
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: storedUser,
        token: storedToken,
        isAuthenticated: !!storedUser && !!storedToken,
        loading: false,
        error: null,
    },
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.error = null;
            localStorage.setItem('smartcart_user', JSON.stringify(user));
            localStorage.setItem('smartcart_token', token);
        },
        updateProfile: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('smartcart_user', JSON.stringify(state.user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('smartcart_user');
            localStorage.removeItem('smartcart_token');
            api.post('/auth/logout').catch(() => {});
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                if (action.payload) {
                    state.user = action.payload;
                    state.isAuthenticated = true;
                }
            })
            .addCase(fetchProfile.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
            });
    },
});

export const { setCredentials, updateProfile, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
