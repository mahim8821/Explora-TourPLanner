import {Category, Destination} from './types';

export const CATEGORIES: Category[] = [
  {id: 'beach', label: 'Beach', emoji: '🏖️', color: '#FF6B35'},
  {id: 'mountain', label: 'Mountain', emoji: '🏔️', color: '#1A535C'},
  {id: 'city', label: 'City', emoji: '🌆', color: '#5BC0EB'},
  {id: 'cultural', label: 'Cultural', emoji: '🏛️', color: '#FFE66D'},
  {id: 'adventure', label: 'Adventure', emoji: '🧗', color: '#4CAF82'},
  {id: 'wildlife', label: 'Wildlife', emoji: '🦁', color: '#FF8C5A'},
  {id: 'historical', label: 'Historical', emoji: '🏯', color: '#A78BFA'},
  {id: 'island', label: 'Island', emoji: '🏝️', color: '#22D3EE'},
];

export const DESTINATIONS: Destination[] = [
  {
    id: '1', name: 'Santorini', country: 'Greece', region: 'Aegean Islands',
    description: 'Santorini is a volcanic island in the Cyclades group of the Greek islands. Known as the "Jewel of the Aegean" for its dramatic cliffs, white-washed buildings, and breathtaking sunsets over the caldera.',
    shortDescription: 'Iconic white-blue architecture & legendary sunsets',
    rating: 4.9, reviewCount: 12453, price: 180, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800','https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800','https://images.unsplash.com/photo-1601581975053-7c5cfb87e88a?w=800'],
    category: 'beach', tags: ['romantic', 'sunset', 'wine', 'sailing', 'luxury'],
    coordinates: {latitude: 36.3932, longitude: 25.4615},
    weather: {temperature: 28, condition: 'Sunny', icon: '☀️'},
    isTrending: true, isFeatured: true, duration: '4-6 days', bestTimeToVisit: 'June – September',
    highlights: ['Oia Sunset View', 'Caldera Boat Tour', 'Black Sand Beach', 'Akrotiri Archaeological Site', 'Wine Tasting'],
  },
  {
    id: '2', name: 'Machu Picchu', country: 'Peru', region: 'Cusco Region',
    description: 'A 15th-century Inca citadel situated 2,430 meters above sea level. The most iconic symbol of the Inca Empire, surrounded by dramatic mountain peaks and lush cloud forest in the Sacred Valley.',
    shortDescription: 'Ancient Inca citadel above the Sacred Valley',
    rating: 4.8, reviewCount: 9872, price: 120, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    images: ['https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800','https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800','https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800'],
    category: 'historical', tags: ['UNESCO', 'ancient', 'inca', 'hiking', 'mystical'],
    coordinates: {latitude: -13.1631, longitude: -72.545},
    weather: {temperature: 18, condition: 'Partly Cloudy', icon: '⛅'},
    isTrending: true, isFeatured: true, duration: '2-3 days', bestTimeToVisit: 'May – October',
    highlights: ['Sun Gate Hike', 'Huayna Picchu Peak', 'Inca Trail Trek', 'Aguas Calientes', 'Sacred Valley Tour'],
  },
  {
    id: '3', name: 'Bali', country: 'Indonesia', region: 'Lesser Sunda Islands',
    description: 'Known as the "Island of the Gods," Bali offers a unique blend of spectacular scenery, vibrant nightlife, world-class surfing, and a rich cultural heritage with ancient temples and traditional ceremonies.',
    shortDescription: 'Tropical paradise with temples, rice fields & surf',
    rating: 4.8, reviewCount: 18934, price: 90, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800','https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800','https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800'],
    category: 'island', tags: ['surf', 'yoga', 'temples', 'rice-fields', 'culture'],
    coordinates: {latitude: -8.3405, longitude: 115.092},
    weather: {temperature: 30, condition: 'Tropical', icon: '🌴'},
    isTrending: true, isFeatured: false, duration: '7-10 days', bestTimeToVisit: 'April – October',
    highlights: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Kuta Beach Surf', 'Monkey Forest', 'Uluwatu Kecak Dance'],
  },
  {
    id: '4', name: 'Patagonia', country: 'Argentina / Chile', region: 'Southern Cone',
    description: 'A sparsely populated region at the southern end of South America featuring dramatic landscapes including the Andes Mountains, glaciers, lakes, and deserts. Home to Torres del Paine and Los Glaciares National Parks.',
    shortDescription: 'Wild Andean frontier with glaciers & dramatic peaks',
    rating: 4.9, reviewCount: 5621, price: 150, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    images: ['https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800'],
    category: 'adventure', tags: ['trekking', 'glaciers', 'wilderness', 'wildlife', 'photography'],
    coordinates: {latitude: -51.6301, longitude: -72.5198},
    weather: {temperature: 8, condition: 'Windy', icon: '💨'},
    isTrending: false, isFeatured: true, duration: '10-14 days', bestTimeToVisit: 'November – March',
    highlights: ['Torres del Paine W-Trek', 'Perito Moreno Glacier', 'Fitz Roy Peak', 'Punta Arenas', 'El Calafate'],
  },
  {
    id: '5', name: 'Kyoto', country: 'Japan', region: 'Kansai',
    description: 'Japan\'s ancient capital with over 1,600 Buddhist temples, 400 Shinto shrines, and 17 UNESCO World Heritage Sites. Famous for geisha culture, traditional tea ceremonies, and spectacular cherry blossoms.',
    shortDescription: 'Ancient capital of temples, geishas & cherry blossoms',
    rating: 4.9, reviewCount: 22147, price: 160, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800','https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'],
    category: 'cultural', tags: ['temples', 'geisha', 'tea-ceremony', 'cherry-blossom', 'UNESCO'],
    coordinates: {latitude: 35.0116, longitude: 135.7681},
    weather: {temperature: 22, condition: 'Clear', icon: '🌸'},
    isTrending: true, isFeatured: true, duration: '4-6 days', bestTimeToVisit: 'March – May, Oct – Nov',
    highlights: ['Fushimi Inari Shrine', 'Arashiyama Bamboo Grove', 'Gion Geisha District', 'Kinkaku-ji', 'Nishiki Market'],
  },
  {
    id: '6', name: 'Maldives', country: 'Maldives', region: 'South Asia',
    description: 'A tropical nation in the Indian Ocean composed of 1,000+ coral islands. Known for crystal-clear lagoons, overwater bungalows, and extensive reefs — the world\'s most exclusive luxury destination.',
    shortDescription: 'Ultimate overwater luxury in crystal-clear lagoons',
    rating: 4.9, reviewCount: 8234, price: 400, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    images: ['https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800','https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800','https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800'],
    category: 'island', tags: ['luxury', 'overwater-bungalow', 'snorkeling', 'diving', 'honeymoon'],
    coordinates: {latitude: 3.2028, longitude: 73.2207},
    weather: {temperature: 30, condition: 'Sunny', icon: '☀️'},
    isTrending: true, isFeatured: true, duration: '5-7 days', bestTimeToVisit: 'November – April',
    highlights: ['Overwater Bungalow', 'Coral Reef Snorkeling', 'Whale Shark Diving', 'Sunset Dolphin Cruise', 'Underwater Restaurant'],
  },
  {
    id: '7', name: 'Banff', country: 'Canada', region: 'Alberta Rockies',
    description: 'Canada\'s oldest national park in the Canadian Rockies featuring turquoise Moraine Lake, Lake Louise, stunning peaks, wildlife, world-class skiing, and the spectacular Icefields Parkway drive.',
    shortDescription: 'Turquoise glacial lakes & majestic Rocky Mountains',
    rating: 4.8, reviewCount: 14567, price: 200, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800',
    images: ['https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'],
    category: 'mountain', tags: ['hiking', 'skiing', 'wildlife', 'lakes', 'photography'],
    coordinates: {latitude: 51.4968, longitude: -115.9281},
    weather: {temperature: 12, condition: 'Clear', icon: '🏔️'},
    isTrending: false, isFeatured: true, duration: '5-7 days', bestTimeToVisit: 'June – Aug, Dec – Mar',
    highlights: ['Lake Louise', 'Moraine Lake', 'Icefields Parkway', 'Johnston Canyon', 'Sulphur Mountain Gondola'],
  },
  {
    id: '8', name: 'Dubai', country: 'UAE', region: 'Persian Gulf',
    description: 'A global hub known for luxury shopping, ultramodern architecture, and lively nightlife. Features the world\'s tallest building, largest mall, and iconic palm-shaped islands.',
    shortDescription: 'Futuristic skyline meets desert luxury & adventure',
    rating: 4.7, reviewCount: 28934, price: 250, currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800','https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800','https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800'],
    category: 'city', tags: ['luxury', 'shopping', 'skyscraper', 'desert-safari', 'futuristic'],
    coordinates: {latitude: 25.2048, longitude: 55.2708},
    weather: {temperature: 35, condition: 'Hot & Sunny', icon: '🌞'},
    isTrending: true, isFeatured: false, duration: '4-6 days', bestTimeToVisit: 'November – March',
    highlights: ['Burj Khalifa', 'Dubai Mall & Fountain', 'Desert Safari', 'Palm Jumeirah', 'Gold & Spice Souk'],
  },
];

export const getDestinations = async (): Promise<Destination[]> => new Promise(resolve => setTimeout(() => resolve(DESTINATIONS), 300));
export const getFeaturedDestinations = async (): Promise<Destination[]> => new Promise(resolve => setTimeout(() => resolve(DESTINATIONS.filter(d => d.isFeatured)), 300));
export const getTrendingDestinations = async (): Promise<Destination[]> => new Promise(resolve => setTimeout(() => resolve(DESTINATIONS.filter(d => d.isTrending)), 300));
export const getDestinationById = async (id: string): Promise<Destination | undefined> => new Promise(resolve => setTimeout(() => resolve(DESTINATIONS.find(d => d.id === id)), 200));
export const searchDestinations = async (query: string): Promise<Destination[]> => {
  const q = query.toLowerCase();
  return new Promise(resolve => setTimeout(() => resolve(DESTINATIONS.filter(d =>
    d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) ||
    d.tags.some(t => t.includes(q)) || d.category.includes(q)
  )), 200));
};
export const getDestinationsByCategory = async (category: string): Promise<Destination[]> =>
  new Promise(resolve => setTimeout(() => resolve(category === 'all' ? DESTINATIONS : DESTINATIONS.filter(d => d.category === category)), 200));
