export type TripCategory = 'All' | 'Camping' | 'Hiking' | 'Beach' | 'Retreat';

export interface Trip {
  id: string;
  title: string;
  location: string;
  durationDays: number;
  budget: number;
  slotsAvailable: number;
  totalSlots: number;
  description: string;
  imageUrl: any;
  category: TripCategory;
}

export const TRIPS: Trip[] = [
  {
    id: '1',
    title: 'Bandarban Tour',
    location: 'Bandarban, Bangladesh',
    durationDays: 2,
    budget: 3000,
    slotsAvailable: 30,
    totalSlots: 30,
    category: 'Camping',
    description: 'Join us for an exciting 2-day group tour to the majestic hills of Bandarban. Experience the breathtaking views from Nilgiri, trek through the beautiful trails of Nafakhum waterfall, and camp under the starry night sky. Perfect for adventure seekers!',
    imageUrl: require('../assets/images/trips/bandarban.jpg'),
  },
  {
    id: '2',
    title: 'Sylhet Border Hiking',
    location: 'Sylhet, Bangladesh',
    durationDays: 3,
    budget: 3500,
    slotsAvailable: 15,
    totalSlots: 20,
    category: 'Hiking',
    description: 'A 3-day immersive hiking experience along the scenic borders of Sylhet. We will explore the crystal clear waters of Lalakhal, hike through the dense Ratargul Swamp Forest, and enjoy the tea gardens. Budget covers travel from Dhaka, meals, and local transport.',
    imageUrl: require('../assets/images/trips/sylhet.jpg'),
  },
  {
    id: '3',
    title: "Cox's Bazar Surfing Camp",
    location: "Cox's Bazar, Bangladesh",
    durationDays: 4,
    budget: 5500,
    slotsAvailable: 8,
    totalSlots: 15,
    category: 'Beach',
    description: 'Hit the longest sea beach in the world for an exclusive 4-day surfing camp. Includes daily surf lessons from certified instructors, board rentals, beachfront accommodation, and evening BBQ parties.',
    imageUrl: require('../assets/images/trips/cox.jpg'),
  },
  {
    id: '4',
    title: 'Kaptai Lake Retreat',
    location: 'Kaptai, Rangamati',
    durationDays: 2,
    budget: 4500,
    slotsAvailable: 2,
    totalSlots: 40,
    category: 'Retreat',
    description: 'A peaceful 2-day retreat at Kaptai Lake. Enjoy boating in the serene waters, authentic tribal cuisine, and relax in eco-resorts. Only 2 slots left!',
    imageUrl: require('../assets/images/trips/kaptai.jpg'),
  }
];
