import {configureStore} from '@reduxjs/toolkit';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import destinationsReducer from './slices/destinationsSlice';
import bookmarksReducer from './slices/bookmarksSlice';
import settingsReducer from './slices/settingsSlice';
import authReducer from './slices/authSlice';
import savedTripsReducer from './slices/savedTripsSlice';

export const store = configureStore({
  reducer: {
    destinations: destinationsReducer,
    bookmarks: bookmarksReducer,
    savedTrips: savedTripsReducer,
    settings: settingsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
