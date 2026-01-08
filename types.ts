
export enum ContentType {
  MOVIE = 'MOVIE',
  SHORT = 'SHORT',
  SERIES = 'SERIES',
  LIVE = 'LIVE'
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  verified: boolean;
  role: 'Director' | 'Indie Artist' | 'Influencer' | 'Comedian' | 'Designer';
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  views: number;
  likes: number;
  type: ContentType;
  creator: Creator;
  tags: string[];
  releasedAt: string;
  isSponsored?: boolean;
}

export interface AdCampaign {
  id: string;
  brandName: string;
  title: string;
  status: 'active' | 'paused' | 'pending';
  budget: number;
  spent: number;
  impressions: number;
  ctr: number;
}

export type AppView = 'home' | 'shorts' | 'studio' | 'discover' | 'profile' | 'messages' | 'live' | 'plans' | 'business';

// ChatMessage interface for live stream chat component
export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isCreator?: boolean;
}

// Poll interfaces for live stream engagement components
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  totalVotes: number;
  options: PollOption[];
}

// Message and Conversation interfaces for direct messaging features
export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participant: Creator;
  lastMessage: string;
  messages: Message[];
}
