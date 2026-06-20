import { 
  Cpu, 
  Globe, 
  Briefcase, 
  TrendingUp, 
  Palette, 
  Mic, 
  Radio, 
  User, 
  BookOpen, 
  Video, 
  Share2,
  LucideIcon
} from 'lucide-react';

export const RADIO_STREAM = "https://stream.zeno.fm/f9mz6798g0hvv";
export const CASHAPP = "https://cash.app/$hsw365";
export const BOOKING_EMAIL = "mailto:Book@Hoodstar365.com?subject=Booking Hoodstar365";

export interface Service {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  cta: string;
}

export const services: Service[] = [
  {
    id: 'ai-solutions',
    name: 'AI Business Solutions',
    headline: 'Intelligence That Works While You Work',
    subheadline: 'Automate, optimize, and scale with custom AI solutions built for your business reality.',
    description: 'We design and deploy custom AI agents, automation pipelines, and intelligent workflows that integrate seamlessly into your existing operations.',
    icon: Cpu,
    features: [
      'Custom AI agent development',
      'Bespoke workflow automation',
      'AI-powered data analysis',
      'Natural language processing',
      'Seamless API integration'
    ],
    cta: 'Book AI Strategy Session'
  },
  {
    id: 'web-development',
    name: 'Website Development',
    headline: 'Your Digital Front Door. Built to Impress.',
    subheadline: 'Custom websites that load fast, look stunning, and convert visitors into clients.',
    description: 'We build modern, responsive websites using React, Vite, and Tailwind CSS that deliver blazing-fast performance and pixel-perfect design.',
    icon: Globe,
    features: [
      'Fully custom design',
      'Mobile-first & responsive',
      'Optimized for speed (90+)',
      'Modern Tech Stack',
      'SEO-optimized structure'
    ],
    cta: 'Start Website Project'
  },
  {
    id: 'consulting',
    name: 'Business Consulting',
    headline: 'Clarity. Strategy. Momentum.',
    subheadline: 'Strategic consulting that turns chaos into a clear, actionable roadmap.',
    description: 'Identify bottlenecks, seize opportunities, and build sustainable growth with our data-driven methodologies.',
    icon: Briefcase,
    features: [
      'Business model validation',
      'Go-to-market strategy',
      'Operational efficiency audits',
      'Revenue growth strategy',
      'Fractional COO advisory'
    ],
    cta: 'Book Free Discovery Call'
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    headline: 'Stop Being a Best-Kept Secret.',
    subheadline: 'Data-driven digital marketing that puts your brand in front of the right audience.',
    description: 'Multi-channel marketing ecosystems designed to deliver predictable, scalable growth.',
    icon: TrendingUp,
    features: [
      'Paid ad management',
      'Technical SEO strategy',
      'Email marketing automation',
      'Content marketing strategy',
      'Conversion Rate Optimization'
    ],
    cta: 'Grow Your Audience'
  },
  {
    id: 'brand-development',
    name: 'Brand Development',
    headline: 'A Brand People Remember.',
    subheadline: 'From name to narrative — build a brand that resonates and endures.',
    description: 'Build a cohesive identity that captures your essence and commands attention in a crowded marketplace.',
    icon: Palette,
    features: [
      'Brand positioning workshops',
      'Visual identity systems',
      'Messaging framework',
      'Brand guidelines docs',
      'Rebranding strategy'
    ],
    cta: 'Define Your Brand'
  },
  {
    id: 'podcast-production',
    name: 'Podcast Production',
    headline: 'Your Voice. Your Show. Your Audience.',
    subheadline: 'End-to-end podcast production — from concept to publishing.',
    description: 'We handle every aspect of podcast production so you can focus on the conversation.',
    icon: Mic,
    features: [
      'Professional editing & mastering',
      'SEO-optimized show notes',
      'Multi-platform distribution',
      'Custom intro/outro music',
      'Artwork and branding'
    ],
    cta: 'Launch Your Podcast'
  },
  {
    id: 'radio-promotion',
    name: 'Online Radio Promotion',
    headline: 'Airwaves. Audiences. Amplified.',
    subheadline: 'Get heard on internet radio stations reaching thousands of listeners worldwide.',
    description: 'Connect with curated internet radio stations that match your genre and target audience.',
    icon: Radio,
    features: [
      'Curated station placement',
      'Genre-matched selection',
      'Rotation scheduling & reports',
      'Artist interviews & segments',
      'Listener analytics'
    ],
    cta: 'Get On Air'
  },
  {
    id: 'artist-promotion',
    name: 'Independent Artist Promotion',
    headline: 'The World Is Ready to Hear You.',
    subheadline: 'Strategic artist promotion that builds your fanbase and grows your streams.',
    description: 'Amplify your reach across streaming platforms and social media without a major label.',
    icon: User,
    features: [
      'Spotify playlist pitching',
      'Social media growth strategy',
      'EPK development',
      'Music video distribution',
      'Fan engagement management'
    ],
    cta: 'Amplify Your Sound'
  },
  {
    id: 'ebook-publishing',
    name: 'E-book Publishing',
    headline: 'Write the Book. We\'ll Handle the Rest.',
    subheadline: 'From manuscript to marketplace — full-service e-book publishing.',
    description: 'End-to-end e-book publishing services taking your manuscript from draft to major marketplaces.',
    icon: BookOpen,
    features: [
      'Professional formatting',
      'Custom cover design',
      'ISBN registration',
      'Multi-platform distribution',
      'Amazon KDP optimization'
    ],
    cta: 'Publish Your Book'
  },
  {
    id: 'media-production',
    name: 'Media Production',
    headline: 'From Concept to Content.',
    subheadline: 'Professional video, audio, and visual production that brings your ideas to life.',
    description: 'Create polished, professional video and audio content that captures attention.',
    icon: Video,
    features: [
      'Video production & editing',
      'Sound design & audio',
      'Motion graphics & animation',
      'Scriptwriting support',
      'Post-production grading'
    ],
    cta: 'Make Something Great'
  },
  {
    id: 'social-growth',
    name: 'Social Media Growth',
    headline: 'Grow Beyond the Algorithm.',
    subheadline: 'Organic and paid social strategies that build real communities.',
    description: 'Relationships-first social strategy to turn followers into fans and customers.',
    icon: Share2,
    features: [
      'Platform-specific strategies',
      'Content calendar planning',
      'Community management',
      'Influencer collaboration',
      'Monthly analytics reporting'
    ],
    cta: 'Start Growing'
  },
];
