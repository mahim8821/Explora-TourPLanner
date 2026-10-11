import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  getDestinations, getTrendingDestinations, getFeaturedDestinations,
  searchDestinations, getDestinationsByCategory,
} from '../../api/destinations';
import {Destination} from '../../api/types';

interface DestinationsState {
  all: Destination[];
  trending: Destination[];
  featured: Destination[];
  searched: Destination[];
  selectedDestination: Destination | null;
  loading: boolean;
  error: string | null;
  activeCategory: string;
  searchQuery: string;
}

const initialState: DestinationsState = {
  all: [], trending: [], featured: [], searched: [],
  selectedDestination: null, loading: false, error: null,
  activeCategory: 'all', searchQuery: '',
};

export const fetchAllDestinations = createAsyncThunk('destinations/fetchAll', async () => await getDestinations());
export const fetchTrending = createAsyncThunk('destinations/fetchTrending', async () => await getTrendingDestinations());
export const fetchFeatured = createAsyncThunk('destinations/fetchFeatured', async () => await getFeaturedDestinations());
export const searchDests = createAsyncThunk('destinations/search', async (query: string) => await searchDestinations(query));
export const fetchByCategory = createAsyncThunk('destinations/byCategory', async (category: string) => await getDestinationsByCategory(category));

const destinationsSlice = createSlice({
  name: 'destinations',
  initialState,
  reducers: {
    setSelectedDestination: (state, action: PayloadAction<Destination | null>) => { state.selectedDestination = action.payload; },
    setActiveCategory: (state, action: PayloadAction<string>) => { state.activeCategory = action.payload; },
    setSearchQuery: (state, action: PayloadAction<string>) => { state.searchQuery = action.payload; },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAllDestinations.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchAllDestinations.fulfilled, (state, action) => { state.all = action.payload; state.loading = false; })
      .addCase(fetchAllDestinations.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      .addCase(fetchTrending.fulfilled, (state, action) => { state.trending = action.payload; })
      .addCase(fetchFeatured.fulfilled, (state, action) => { state.featured = action.payload; })
      .addCase(searchDests.fulfilled, (state, action) => { state.searched = action.payload; })
      .addCase(fetchByCategory.fulfilled, (state, action) => { state.all = action.payload; });
  },
});

export const {setSelectedDestination, setActiveCategory, setSearchQuery} = destinationsSlice.actions;
export default destinationsSlice.reducer;
