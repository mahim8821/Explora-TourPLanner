import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  locationEnabled: boolean;
}

const initialState: SettingsState = {
  darkMode: false,
  notifications: true,
  locationEnabled: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleDarkMode: state => { state.darkMode = !state.darkMode; },
    toggleNotifications: state => { state.notifications = !state.notifications; },
    toggleLocation: state => { state.locationEnabled = !state.locationEnabled; },
    setSetting: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return {...state, ...action.payload};
    },
  },
});

export const {toggleDarkMode, toggleNotifications, toggleLocation, setSetting} = settingsSlice.actions;
export default settingsSlice.reducer;
