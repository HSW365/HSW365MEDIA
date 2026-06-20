import React from 'react';
import { Link } from 'react-router-dom';
import { CASHAPP } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-midnight text-white py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold tracking-tighter text-cobalt uppercase">HSW365</span>
              <span className="text-xl font-medium text-cyan uppercase tracking-widest">Media</span>
            </Link>
            <p className="text-steel max-w-xs leading-relaxed">
              Turning vision into opportunity 365 days a year. Your partner in digital media, technology, and business consulting.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Services</h3>
            <ul className="space-y-4">
              <li><Link to="/services/ai-solutions" className="text-steel hover:text-cyan transition-colors text-sm font-medium">AI Business Solutions</Link></li>
              <li><Link to="/services/web-development" className="text-steel hover:text-cyan transition-colors text-sm font-medium">Web Development</Link></li>
              <li><Link to="/services/consulting" className="text-steel hover:text-cyan transition-colors text-sm font-medium">Business Consulting</Link></li>
              <li><Link to="/services/media-promotion" className="text-steel hover:text-cyan transition-colors text-sm font-medium">Media Promotion</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Connect</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="text-steel">Email: <span className="text-white">book@hoodstar365.com</span></li>
              <li className="text-steel">Cash App: <a href={CASHAPP} className="text-white hover:text-cyan transition-colors">$hsw365</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-steel text-xs font-medium">
            © {new Date().getFullYear()} HSW365 Media. All rights reserved. Built by HOODSTAR365.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-steel text-[10px] font-bold uppercase tracking-[0.3em] italic">"Vision Into Opportunity"</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
