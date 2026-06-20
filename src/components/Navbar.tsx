import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/#services' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <nav className="bg-midnight text-white sticky top-0 z-50 shadow-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <span className="text-white font-bold text-xl italic">H</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold tracking-tighter">
                  HSW<span className="text-cobalt">365</span>
                </span>
                <span className="text-sm font-medium tracking-[0.2em] text-cyan uppercase">Media</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-300 hover:text-cyan transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan transition-all group-hover:w-full"></span>
                </a>
              ))}
              <a
                href="#contact"
                className="bg-cobalt hover:opacity-90 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-cobalt/20"
              >
                Book Now
              </a>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-900 border-t border-white/5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block px-3 py-4 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <a
            href="#contact"
            className="block w-full text-center bg-cobalt py-3 rounded-md font-bold mt-4"
            onClick={() => setIsOpen(false)}
          >
            Book Now
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
