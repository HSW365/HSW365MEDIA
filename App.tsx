import React, { useState } from 'react';
import Layout from './components/Layout.tsx';
import NetflixSection from './components/NetflixSection.tsx';
import ShortsFeed from './components/ShortsFeed.tsx';
import CreatorStudio from './components/CreatorStudio.tsx';
import DirectMessages from './components/DirectMessages.tsx';
import LiveInteractions from './components/LiveInteractions.tsx';
import SubscriptionView from './components/SubscriptionView.tsx';
import BusinessCenter from './components/BusinessCenter.tsx';
import { VideoContent, ContentType, AppView } from './types.ts';
import { Play, Star, Plus, Info, Globe, Shield, Zap, Radio, TrendingUp } from 'lucide-react';

// Mock Data
const MOCK_VIDEOS: VideoContent[] = [
  {
    id: '1',
    title: 'Neon Odyssey: The Last Director',
    description: 'A visual masterpiece following a director lost in a cyberpunk Tokyo. Stunning 8K visuals and award-winning sound design.',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80',
    videoUrl: '#',
    duration: '2h 14m',
    views: 1200000,
    likes: 450000,
    type: ContentType.MOVIE,
    creator: { id: 'c1', name: 'Kaelen Vance', handle: 'kvance', avatar: 'https://i.pravatar.cc/150?u=c1', followers: 2000000, verified: true, role: 'Director' },
    tags: ['Cyberpunk', 'Cinematic', 'Sci-Fi'],
    releasedAt: '2024-03-15'
  },
  {
    id: '2',
    title: 'Echoes of Fashion: Spring 2025',
    description: 'Exclusive look at the avant-garde collection of the decade. Redefining silhouettes and sustainability.',
    thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1280&q=80',
    videoUrl: '#',
    duration: '45m',
    views: 890000,
    likes: 310000,
    type: ContentType.SERIES,
    creator: { id: 'c2', name: 'Zoe Aris', handle: 'zoearis', avatar: 'https://i.pravatar.cc/150?u=c2', followers: 5400000, verified: true, role: 'Designer' },
    tags: ['Fashion', 'Art', 'Trends'],
    releasedAt: '2024-03-20'
  },
  {
    id: 's1',
    title: 'POV: You missed the call',
    description: 'Every comedian knows this feeling when the agent calls and you are in the shower.',
    thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280&q=80',
    videoUrl: '#',
    duration: '0:15',
    views: 5600000,
    likes: 1200000,
    type: ContentType.SHORT,
    creator: { id: 'c3', name: 'Mark G.', handle: 'markfunny', avatar: 'https://i.pravatar.cc/150?u=c3', followers: 10000000, verified: true, role: 'Comedian' },
    tags: ['POV', 'Comedy', 'Relatable'],
    releasedAt: '2024-03-22'
  }
];

const HomeView = ({ onJoinLive, onUpgrade }: { onJoinLive: () => void, onUpgrade: () => void }) => (
  <div className="pb-20 animate-in fade-in duration-700">
    <div className="relative h-[85vh] w-full flex items-end px-6 md:px-12 pb-24 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1920&q=80" 
        className="absolute inset-0 w-full h-full object-cover"
        alt="hero"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-transparent"></div>
      
      <div className="relative z-10 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <span className="bg-red-600 text-[10px] font-black tracking-widest px-3 py-1 rounded text-white uppercase italic">HSW365stream Original</span>
          <span className="text-sm font-bold text-white/80 flex items-center gap-2 uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg">
            <Globe size={14} className="text-indigo-400" /> Worldwide
          </span>
        </div>
        <h1 className="text-6xl md:text-9xl font-black mb-6 leading-[0.8] tracking-tighter drop-shadow-2xl">
          VELOCITY <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">X SERIES</span>
        </h1>
        <p className="text-xl text-gray-200 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-lg">
          Witness the world's most influential creators push the limits of fashion, film, and digital art in an interactive survival competition.
        </p>
        <div className="flex flex-wrap gap-6">
          <button 
            onClick={onJoinLive}
            className="group flex items-center gap-3 px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 active:scale-95"
          >
            <Radio size={24} className="text-red-600 animate-pulse" /> WATCH PREMIERE
          </button>
          <button 
            onClick={onUpgrade}
            className="flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-xl text-white font-black rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1 active:scale-95"
          >
            <TrendingUp size={24} className="text-indigo-400" /> UPGRADE TO PRO
          </button>
        </div>
      </div>

      {/* Floating Info */}
      <div className="absolute right-12 bottom-24 hidden lg:block text-right animate-in slide-in-from-right duration-1000">
         <div className="flex items-center gap-4 justify-end mb-2">
            <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">Live Interaction</span>
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-8 h-8 rounded-full border-2 border-indigo-500" alt="viewer" />
              ))}
            </div>
         </div>
         <p className="text-4xl font-black tracking-tighter">24.8M <span className="text-indigo-500">LIVE</span></p>
      </div>
    </div>

    {/* Content Grid */}
    <div className="-mt-20 relative z-20 space-y-4">
      <NetflixSection title="HSW365stream Premiere Films" items={MOCK_VIDEOS.filter(v => v.type === ContentType.MOVIE)} />
      
      <div className="px-6 mb-12">
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
          <div className="flex items-center gap-8 z-10">
             <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-black font-black text-3xl shadow-2xl">CF</div>
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded font-black tracking-widest uppercase">Sponsored</span>
                 <h3 className="text-2xl font-black italic tracking-tighter">CYBERFIT COLLECTIVE</h3>
               </div>
               <p className="text-gray-400 max-w-lg font-medium">Digital fashion for the ultra-creator. Unlock the exclusive Summer '25 skin pack today.</p>
             </div>
          </div>
          <button className="z-10 bg-white text-black px-10 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl active:scale-95">VIEW SHOP</button>
        </div>
      </div>

      <NetflixSection title="Viral Flashes" items={MOCK_VIDEOS.filter(v => v.type === ContentType.SHORT)} />
    </div>
  </div>
);

const LiveView = () => (
  <div className="flex h-full animate-in fade-in zoom-in-95 duration-700">
    <div className="flex-1 relative bg-black overflow-hidden group">
      <img 
        src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80" 
        className="w-full h-full object-cover opacity-80"
        alt="live"
      />
      <div className="absolute top-8 left-8 flex items-center gap-4">
        <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xl">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          ULTRA HD LIVE
        </div>
        <div className="bg-black/60 backdrop-blur-xl text-white text-xs font-bold px-4 py-1.5 rounded-lg border border-white/10">
          14.2M Watching Now
        </div>
      </div>
      <div className="absolute bottom-10 left-10 max-w-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
          <span className="text-indigo-400 font-black tracking-[0.3em] text-[10px]">CURRENTLY ON AIR</span>
        </div>
        <h2 className="text-4xl font-black mb-3 tracking-tighter">Directing the Future</h2>
        <p className="text-lg text-gray-300 font-medium">Kaelen Vance reveals the unseen footage of Tokyo 2088.</p>
      </div>
    </div>
    <div className="hidden lg:block">
      <LiveInteractions creatorName="Kaelen Vance" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('home');

  const renderView = () => {
    switch(activeView) {
      case 'home': return <HomeView onJoinLive={() => setActiveView('live')} onUpgrade={() => setActiveView('plans')} />;
      case 'live': return <LiveView />;
      case 'shorts': return <ShortsFeed shorts={MOCK_VIDEOS.filter(v => v.type === ContentType.SHORT)} />;
      case 'studio': return <CreatorStudio />;
      case 'messages': return <DirectMessages />;
      case 'plans': return <SubscriptionView />;
      case 'business': return <BusinessCenter />;
      default: return <HomeView onJoinLive={() => setActiveView('live')} onUpgrade={() => setActiveView('plans')} />;
    }
  };

  return (
    <Layout activeView={activeView} setView={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;