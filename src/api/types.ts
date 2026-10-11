export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  shortDescription: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  imageUrl: string;
  images: string[];
  category: DestinationCategory;
  tags: string[];
  coordinates: {latitude: number; longitude: number};
  weather: {temperature: number; condition: string; icon: string};
  isTrending: boolean;
  isFeatured: boolean;
  duration: string;
  bestTimeToVisit: string;
  highlights: string[];
}

export type DestinationCategory =
  | 'beach' | 'mountain' | 'city' | 'cultural'
  | 'adventure' | 'wildlife' | 'historical' | 'island';

export interface Category {
  id: DestinationCategory;
  label: string;
  emoji: string;
  color: string;
}
