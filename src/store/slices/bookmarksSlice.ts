import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Destination} from '../../api/types';

interface BookmarksState { items: Destination[]; }
const initialState: BookmarksState = { items: [] };

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    toggleBookmark: (state, action: PayloadAction<Destination>) => {
      const index = state.items.findIndex(d => d.id === action.payload.id);
      if (index >= 0) { state.items.splice(index, 1); }
      else { state.items.push(action.payload); }
    },
    removeBookmark: (state, action: PayloadAction<string>) => { state.items = state.items.filter(d => d.id !== action.payload); },
    clearBookmarks: state => { state.items = []; },
  },
});

export const {toggleBookmark, removeBookmark, clearBookmarks} = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
