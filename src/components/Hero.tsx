import React from 'react';
import { RADIO_STREAM } from '../constants';

const Hero: React.FC = () => {
  return (
    <div className="relative bg-midnight text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cobalt rounded-full filter blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan rounded-full filter blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="pt-20 pb-24 lg:pt-32 lg:pb-40 lg:flex lg:items-center">
          <div className="lg:w-1/2">
            <h1 className="text-5xl tracking-tight font-extrabold sm:text-6xl md:text-7xl leading-tight">
              <span className="block text-white">Turning Vision Into</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cobalt to-cyan">Opportunity</span>
              <span className="block text-2xl sm:text-3xl font-medium mt-4 text-gray-400 italic">365 Days A Year.</span>
            </h1>
            <p className="mt-8 text-lg text-gray-400 max-w-xl leading-relaxed">
              HSW365 Media is an all-in-one digital media, technology, and business consulting powerhouse. We empower creators and small businesses to scale their operations and reach global audiences.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#services"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-white bg-cobalt hover:opacity-90 shadow-xl shadow-cobalt/20 transition-all transform hover:-translate-y-1"
              >
                Our Services
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/10 text-base font-bold rounded-full text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all transform hover:-translate-y-1"
              >
                Get Started
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-gray-500">
              <div className="flex flex-col text-center">
                <span className="text-2xl font-bold text-white">11+</span>
                <span className="text-[10px] uppercase tracking-widest">Core Services</span>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div className="flex flex-col text-center">
                <span className="text-2xl font-bold text-white">365</span>
                <span className="text-[10px] uppercase tracking-widest">Day Support</span>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div className="flex flex-col text-center">
                <span className="text-2xl font-bold text-white">ROI</span>
                <span className="text-[10px] uppercase tracking-widest">Focused</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block lg:w-1/2 mt-12 lg:mt-0 relative pl-12">
            <div className="relative w-full h-[500px] gradient-bg rounded-3xl overflow-hidden shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-700">
               <div className="absolute inset-0 bg-black/20"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                     <span className="block text-6xl font-black text-white mb-2 tracking-tighter">HSW365</span>
                     <span className="block text-2xl font-bold text-cyan tracking-[0.3em] uppercase">Media</span>
                  </div>
               </div>
               
               {/* Radio Player Overlay */}
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/10">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan">Live Now: Hoodstar365 TV Radio</span>
                    <audio controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity">
                      <source src={RADIO_STREAM} type="audio/mpeg" />
                    </audio>
                  </div>
               </div>

               <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/30"></div>
               <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white/30"></div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl text-midnight font-bold max-w-[200px] border border-frost">
               <span className="block text-cobalt text-[10px] uppercase mb-1 tracking-widest">Our Promise</span>
               "Vision into Opportunity. 365 Days a Year."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
