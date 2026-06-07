import React, { useState } from "react";
import {
  Radio,
  Play,
  BookOpen,
  Music,
  Shirt,
  Mic,
  Smartphone,
  Star,
  Heart,
  Mail,
  DollarSign,
  Menu,
  X,
  Video,
  Headphones,
  Crown,
  Send,
} from "lucide-react";
const CASHAPP = "https://cash.app/$hsw365";
const PAYPAL = "#";
const STRIPE = "#";
const BOOKING_EMAIL = "mailto:Book@Hoodstar365.com?subject=Booking Hoodstar365";
const ARTIST_EMAIL = "mailto:Book@Hoodstar365.com?subject=Artist Placement Submission";
const GUMROAD = "https://hsw365media.com";
const RADIO_STREAM = "https://stream.zeno.fm/f9mz6798g0hvv";
const videos = [
  {
    title: "HOODSTAR365 Featured Music Video",
    youtubeId: "YOUR_VIDEO_ID_HERE",
    label: "Official Video",
  },
  {
    title: "Indie Artist Spotlight",
    youtubeId: "YOUR_VIDEO_ID_HERE",
    label: "Artist Feature",
  },
];
const services = [
  { name: "Radio Airplay Slot", price: "$49" },
  { name: "Mixtape Slot Placement", price: "$79" },
  { name: "Podcast Interview", price: "$99" },
  { name: "Front Page Video Feature", price: "$149" },
];
function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <div className="text-red-500">{icon}</div>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
          {title}
        </h2>
      </div>
      {subtitle && <p className="text-zinc-400 mt-2 max-w-3xl">{subtitle}</p>}
    </div>
  );
}
function Card({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-red-600 transition">
      <div className="text-red-500 mb-4">{icon}</div>
      <h3 className="text-xl font-black mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    "Radio",
    "Videos",
    "Books",
    "Music",
    "Merch",
    "Apps",
    "Services",
    "Booking",
    "Support",
  ];
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-b border-red-600/40">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              HSW<span className="text-red-600">365</span> MEDIA
            </h1>
            <p className="text-xs text-zinc-400">
              Music • Books • Radio • Podcasts • Apps • Merch
            </p>
          </div>
          <nav className="hidden lg:flex gap-5 text-xs font-black uppercase">
            {nav.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-red-500 transition"
              >
                {item}
              </a>
            ))}
          </nav>
          <button
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="lg:hidden px-5 pb-5 grid gap-3 bg-black border-t border-zinc-800">
            {nav.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="font-bold uppercase text-sm"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </header>
      <main className="pt-24 pb-32">
        <section className="min-h-[85vh] flex items-center bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,.35),transparent_35%),linear-gradient(to_bottom,#050505,#000)]">
          <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-red-500 font-black uppercase tracking-[0.3em] text-xs mb-4">
                Built By HOODSTAR365
              </p>
              <h2 className="text-5xl md:text-7xl font-black leading-none">
                THE HSW365
                <span className="block text-red-600">MEDIA EMPIRE</span>
              </h2>
              <p className="text-zinc-300 mt-6 text-lg max-w-xl">
                Music, books, live radio, podcasts, apps, merch, artist
                services, survivor stories, and booking opportunities all under
                one roof.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="#radio"
                  className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-black flex items-center justify-center gap-2"
                >
                  <Radio size={20} /> Listen Live
                </a>
                <a
                  href={CASHAPP}
                  className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl font-black flex items-center justify-center gap-2"
                >
                  <DollarSign size={20} /> Cash App $hsw365
                </a>
                <a
                  href={BOOKING_EMAIL}
                  className="bg-white text-black hover:bg-zinc-200 px-6 py-4 rounded-xl font-black flex items-center justify-center gap-2"
                >
                  <Mail size={20} /> Book Now
                </a>
              </div>
            </div>
            <div className="bg-zinc-950 border border-red-600/40 rounded-3xl p-6 shadow-2xl">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-red-700 to-zinc-950 flex items-center justify-center border border-zinc-800">
                <div className="text-center px-5">
                  <Play className="mx-auto mb-4 text-red-500" size={70} />
                  <h3 className="text-3xl font-black">
                    HOODSTAR365 TV RADIO
                  </h3>
                  <p className="text-zinc-400 mt-2">
                    Home of indie artists and future stars
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="radio" className="max-w-7xl mx-auto px-5 py-16">
          <SectionTitle
            icon={<Radio />}
            title="Live Radio Player"
            subtitle="Stream Hoodstar365 TV Radio live from the site."
          />
          <div className="bg-zinc-950 border border-red-600 rounded-3xl p-6">
            <h3 className="text-2xl font-black mb-2">
              Hoodstar365 TV Radio Live
            </h3>
            <p className="text-zinc-400 mb-5">
              Broadcasting indie music, interviews, podcasts, and artist
              promotion 24/7.
            </p>
            <audio controls className="w-full">
              <source src={RADIO_STREAM} type="audio/mpeg" />
              Your browser does not support the radio player.
            </audio>
          </div>
        </section>
        <section id="videos" className="max-w-7xl mx-auto px-5 py-16">
          <SectionTitle
            icon={<Video />}
            title="Music Video Player"
            subtitle="Feature HOODSTAR365 videos and paid indie artist video placements."
          />
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video, index) => (
              <div
                key={index}
                className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden"
              >
                <div className="aspect-video bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-5">
                  <p className="text-red-500 text-xs font-black uppercase">
                    {video.label}
                  </p>
                  <h3 className="text-xl font-black mt-1">{video.title}</h3>
                  <p className="text-zinc-400 text-sm mt-2">
                    Replace YOUR_VIDEO_ID_HERE with the real YouTube video ID.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-5 py-10 grid md:grid-cols-3 gap-6">
          <Card
            icon={<BookOpen />}
            title="Books & Ebooks"
            text="Hoodlum Soldier, Soldier 2 Convict, Raising Sons, From Prison to Purpose, business guides, and music monetization ebooks."
          />
          <Card
            icon={<Music />}
            title="Music Catalog"
            text="Official HOODSTAR365 music, EPs, singles, downloads, streaming links, and exclusive fan drops."
          />
          <Card
            icon={<Shirt />}
            title="Survivor Collection"
            text="1 of 1 hand-painted merchandise created by HOODSTAR365. Premium collector pieces."
          />
          <Card
            icon={<Mic />}
            title="Respect Da Game Podcast"
            text="Real talk, artist interviews, social issues, business lessons, and independent media conversations."
          />
          <Card
            icon={<Smartphone />}
            title="SpeekZone & Apps"
            text="SpeekZone, Doodee, AI tools, creator platforms, and future HSW365 tech products."
          />
          <Card
            icon={<Heart />}
            title="Support Recovery"
            text="Support cancer treatment recovery, rebuilding, and the independent creator movement."
          />
        </section>
        <section id="services" className="max-w-7xl mx-auto px-5 py-16">
          <SectionTitle
            icon={<Star />}
            title="Artist Services"
            subtitle="Paid promotion opportunities for indie artists, creators, authors, and entrepreneurs."
          />
          <div className="grid md:grid-cols-4 gap-5">
            {services.map((service) => (
              <div
                key={service.name}
                className="bg-zinc-950 border border-yellow-500/50 rounded-3xl p-6"
              >
                <p className="text-yellow-500 text-3xl font-black">
                  {service.price}
                </p>
                <h3 className="font-black mt-3">{service.name}</h3>
                <a
                  href={ARTIST_EMAIL}
                  className="mt-5 inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-3 rounded-xl font-black text-sm"
                >
                  <Send size={16} /> Submit Now
                </a>
              </div>
            ))}
          </div>
        </section>
        <section id="booking" className="max-w-7xl mx-auto px-5 py-16">
          <div className="bg-gradient-to-br from-red-700 to-black border border-red-600 rounded-3xl p-8 md:p-12">
            <SectionTitle
              icon={<Mic />}
              title="Book Hoodstar365"
              subtitle="Bring HOODSTAR365 to schools, colleges, podcasts, community events, prisons, veteran events, and business platforms."
            />
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-black/40 rounded-2xl p-5">Motivational Speaking</div>
              <div className="bg-black/40 rounded-2xl p-5">Artist Interviews</div>
              <div className="bg-black/40 rounded-2xl p-5">Business & Media Talks</div>
            </div>
            <a
              href={BOOKING_EMAIL}
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-4 rounded-xl font-black"
            >
              <Mail size={20} /> Book@Hoodstar365.com
            </a>
          </div>
        </section>
        <section id="support" className="max-w-7xl mx-auto px-5 py-16">
          <SectionTitle
            icon={<Heart />}
            title="Support The Movement"
            subtitle="Support by buying books, music, merch, artist services, subscriptions, or donating directly."
          />
          <div className="grid md:grid-cols-4 gap-5">
            <a
              href={CASHAPP}
              className="bg-green-600 hover:bg-green-700 rounded-3xl p-6 font-black flex items-center gap-3"
            >
              <DollarSign /> Cash App $hsw365
            </a>
            <a
              href={GUMROAD}
              className="bg-white text-black hover:bg-zinc-200 rounded-3xl p-6 font-black flex items-center gap-3"
            >
              <BookOpen /> Shop Products
            </a>
            <a
              href={STRIPE}
              className="bg-purple-600 hover:bg-purple-700 rounded-3xl p-6 font-black flex items-center gap-3"
            >
              <Crown /> Stripe Checkout
            </a>
            <a
              href={PAYPAL}
              className="bg-blue-600 hover:bg-blue-700 rounded-3xl p-6 font-black flex items-center gap-3"
            >
              <Headphones /> PayPal
            </a>
          </div>
          <p className="text-zinc-500 text-sm mt-5">
            Replace STRIPE and PAYPAL links at the top of this file when ready.
          </p>
        </section>
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-red-600 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <p className="font-black text-red-500 uppercase text-sm">
              Live Now: Hoodstar365 TV Radio
            </p>
            <p className="text-xs text-zinc-400">
              Indie music, interviews, podcasts, and future stars
            </p>
          </div>
          <audio controls className="w-full md:w-[420px]">
            <source src={RADIO_STREAM} type="audio/mpeg" />
          </audio>
        </div>
      </div>
      <footer className="border-t border-zinc-800 py-10 text-center text-zinc-500">
        <p className="font-black text-white">
          HSW<span className="text-red-600">365</span> MEDIA
        </p>
        <p>© 2026 HSW365 Media. Built by HOODSTAR365.</p>
        <p>Booking: Book@Hoodstar365.com | Cash App: $hsw365</p>
      </footer>
    </div>
  );
}