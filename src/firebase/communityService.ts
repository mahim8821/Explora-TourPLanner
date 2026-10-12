/**
 * communityService.ts
 * Firestore real-time CRUD for the `community_posts` collection.
 * 
 * Supports:
 * - Real-time feed of hidden & unseen places uploaded by users
 * - Experience stories, reviews, tips & ratings (1-5 stars)
 * - Real-time reactions (likes/loves/gems)
 * - Comments thread per post
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firestore';

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;           // Name of the unseen/hidden place
  location: string;        // District / Division / Specific area
  district?: string;       // e.g. 'Bandarban', 'Sylhet', etc.
  category?: 'Waterfall' | 'Cave' | 'Hills' | 'Forest' | 'Lake' | 'Other';
  imageUrl: string;        // Main photo of the hidden place
  imageUrls?: string[];    // Optional extra gallery photos
  experience: string;      // Personal story & discovery experience
  review: string;          // Review, tips, best time, difficulty
  rating: number;          // 1 to 5 stars
  likes: string[];         // User IDs who liked/reacted
  commentsCount: number;
  comments?: CommunityComment[];
  howToReach?: string;     // Step by step guide to reach
  bestTimeToVisit?: string;
  createdAt: number;
}

const POSTS_COL = 'community_posts';
const COMMENTS_SUBCOL = 'comments';

// ─── Default Seed Posts (Authentic Bangladeshi Hidden Gems) ───────────────────
export const INITIAL_SEED_POSTS: CommunityPost[] = [
  {
    id: 'seed_1',
    userId: 'seed_u1',
    userName: 'Tanvir Hossain',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    title: 'Nafakhum Deep Canyon & Hidden Cascade',
    location: 'Remakri, Thanchi, Bandarban',
    district: 'Bandarban',
    category: 'Waterfall',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
    experience: 'We hiked 4 hours upstream past Remakri along rocky riverbeds with our Marma guide. Rounding a narrow bend between towering bamboo cliffs, we found this roaring emerald cascade that no typical tour group visits.',
    review: 'Truly a slice of untouched paradise. The water is ice-cold and crystal clear. Take water boots and waterproof sacks for gear.',
    rating: 5,
    howToReach: 'From Thanchi bazaar, take an engine boat to Remakri (3 hrs), then trek with an indigenous guide.',
    bestTimeToVisit: 'September – November (Post-monsoon for full water flow)',
    likes: ['demo_1', 'demo_2', 'demo_3', 'demo_4'],
    commentsCount: 3,
    createdAt: Date.now() - 3600 * 1000 * 5,
    comments: [
      {
        id: 'c1',
        userId: 'u_sami',
        userName: 'Samiul Karim',
        userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        text: 'Is a local guide mandatory for crossing the Remakri canal?',
        createdAt: Date.now() - 3600 * 1000 * 3,
      },
      {
        id: 'c2',
        userId: 'seed_u1',
        userName: 'Tanvir Hossain',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        text: 'Yes absolutely! The river currents can be unpredictable and they know the safe stone crossings.',
        createdAt: Date.now() - 3600 * 1000 * 2,
      },
    ],
  },
  {
    id: 'seed_2',
    userId: 'seed_u2',
    userName: 'Ayesha Rahman',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    title: 'Debotakhum Cave River Chasm',
    location: 'Rowangchhari, Bandarban',
    district: 'Bandarban',
    category: 'Cave',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200',
    experience: 'Drifting on a simple hand-made bamboo raft through a claustrophobic gorge where 300-foot stone walls nearly touch overhead. Sunbeams pierce through the dark chasm onto glowing turquoise pools.',
    review: 'One of the most mystical places in Bangladesh. Must wear life jacket provided by locals at the entrance. Cellular reception is zero, giving pure tranquility.',
    rating: 4.9,
    howToReach: 'From Bandarban town take Chander Gari to Rowangchhari, then hike 1.5 hours to the mouth of the gorge.',
    bestTimeToVisit: 'November – February (Water turns crystal turquoise)',
    likes: ['demo_1', 'demo_5', 'demo_6'],
    commentsCount: 2,
    createdAt: Date.now() - 3600 * 1000 * 18,
    comments: [
      {
        id: 'c3',
        userId: 'u_maria',
        userName: 'Maria Sultana',
        userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        text: 'Can kids and non-swimmers go here safely?',
        createdAt: Date.now() - 3600 * 1000 * 12,
      },
      {
        id: 'c4',
        userId: 'seed_u2',
        userName: 'Ayesha Rahman',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        text: 'Yes! The rafts are very stable and life jackets are strictly enforced by the local community.',
        createdAt: Date.now() - 3600 * 1000 * 10,
      },
    ],
  },
  {
    id: 'seed_3',
    userId: 'seed_u3',
    userName: 'Fahim Reza',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    title: 'Secret Haor Watchtower at Dusk',
    location: 'Tahirpur, Sunamganj',
    district: 'Sylhet',
    category: 'Lake',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
    experience: 'Rented a country wooden boat and rowed 12km out into the vast open horizon of Tanguar Haor. We anchored next to an old submerged watchtower right when thousands of migratory birds flew past the setting sun.',
    review: 'Watching sunset over water that stretches as far as Meghalaya hills is breathtaking. Sleep under the stars on the boat roof deck if you can!',
    rating: 4.8,
    howToReach: 'Direct night coach from Dhaka to Sunamganj, then CNG to Tahirpur boat ghat.',
    bestTimeToVisit: 'July – September (Vast sea of water) or Dec – Jan (Migratory birds)',
    likes: ['demo_1', 'demo_2', 'demo_7'],
    commentsCount: 1,
    createdAt: Date.now() - 3600 * 1000 * 28,
    comments: [
      {
        id: 'c5',
        userId: 'u_joy',
        userName: 'Joy Sen',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        text: 'Did you hire the boat overnight? What was the cost?',
        createdAt: Date.now() - 3600 * 1000 * 20,
      },
    ],
  },
];

// ─── Real-Time Subscription ───────────────────────────────────────────────────

export function subscribeToCommunityPosts(
  callback: (posts: CommunityPost[]) => void
): Unsubscribe {
  const q = query(collection(db, POSTS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      if (snapshot.empty) {
        callback(INITIAL_SEED_POSTS);
      } else {
        const posts = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<CommunityPost, 'id'>),
        }));
        callback(posts);
      }
    },
    error => {
      console.warn('Firestore community subscription error:', error);
      callback(INITIAL_SEED_POSTS);
    }
  );
}

// ─── Add New Post ─────────────────────────────────────────────────────────────

export async function addCommunityPost(
  postData: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'commentsCount'>
): Promise<string> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(postData)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }

  const newPost = {
    ...cleaned,
    likes: [],
    commentsCount: 0,
    comments: [],
    createdAt: Date.now(),
  };

  const docRef = await addDoc(collection(db, POSTS_COL), newPost);
  return docRef.id;
}

// ─── Toggle Like / React ──────────────────────────────────────────────────────

export async function toggleLikePost(
  postId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<void> {
  // If it's a seed post, we don't write to firestore
  if (postId.startsWith('seed_')) return;

  const postRef = doc(db, POSTS_COL, postId);
  await updateDoc(postRef, {
    likes: isCurrentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
  });
}

// ─── Add Comment ──────────────────────────────────────────────────────────────

export async function addCommentToPost(
  postId: string,
  comment: Omit<CommunityComment, 'id' | 'createdAt'>
): Promise<CommunityComment> {
  const newComment: CommunityComment = {
    ...comment,
    id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    createdAt: Date.now(),
  };

  if (!postId.startsWith('seed_')) {
    const postRef = doc(db, POSTS_COL, postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
      commentsCount: increment(1),
    });
  }

  return newComment;
}

// ─── Delete Post ──────────────────────────────────────────────────────────────

export async function deleteCommunityPost(postId: string): Promise<void> {
  if (postId.startsWith('seed_')) return;
  await deleteDoc(doc(db, POSTS_COL, postId));
}
