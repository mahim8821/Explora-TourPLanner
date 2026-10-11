import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Trip} from '../../data/trips';

interface SavedTripsState {
  items: Trip[];
}

const initialState: SavedTripsState = {
  items: [],
};

const savedTripsSlice = createSlice({
  name: 'savedTrips',
  initialState,
  reducers: {
    toggleSavedTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.push(action.payload);
      }
    },
    removeSavedTrip: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    clearSavedTrips: state => {
      state.items = [];
    },
  },
});

export const {toggleSavedTrip, removeSavedTrip, clearSavedTrips} = savedTripsSlice.actions;
export default savedTripsSlice.reducer;
