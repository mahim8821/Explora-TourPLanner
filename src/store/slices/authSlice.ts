import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state) {
      state.status = 'loading';
      state.error = null;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.status = 'unauthenticated';
      state.error = action.payload;
    },
    setRole(state, action: PayloadAction<'user' | 'admin'>) {
      if (state.user) {
        state.user.role = action.payload;
      }
    },
  },
});

export const {setLoading, setUser, clearUser, setError, setRole} = authSlice.actions;
export default authSlice.reducer;
