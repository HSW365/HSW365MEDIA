import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { services } from '../constants';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', service: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="text-4xl font-extrabold text-midnight sm:text-5xl tracking-tight">
              Ready to Turn Your Vision Into Opportunity?
            </h2>
            <p className="mt-6 text-lg text-steel leading-relaxed">
              Fill out the form below and our team will get back to you within 24 hours. Let's discuss how HSW365 Media can help you scale your brand and operations.
            </p>
            
            <div className="mt-10 space-y-8">
              <div className="flex items-center group">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-cobalt text-white shadow-lg shadow-cobalt/20 group-hover:scale-110 transition-transform">
                    <Send className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-bold text-midnight">Email Us</h3>
                  <p className="text-steel font-medium">book@hoodstar365.com</p>
                </div>
              </div>
              <div className="p-8 bg-frost rounded-3xl border border-white">
                 <h4 className="font-bold text-midnight mb-2">Our Locations</h4>
                 <p className="text-sm text-steel">Global Digital Distribution & Strategy Hub</p>
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-0">
            <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-midnight/5 border border-frost relative">
              {status === 'success' ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 mb-6">
                    <Send className="h-10 w-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-midnight">Request Received!</h3>
                  <p className="mt-4 text-steel">Thank you for reaching out. A strategy expert will be in touch shortly.</p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="mt-8 text-cobalt font-bold hover:text-cyan transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-midnight uppercase tracking-widest mb-2 ml-1">Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        placeholder="John Doe"
                        className="block w-full bg-frost border-transparent rounded-xl focus:ring-2 focus:ring-cobalt focus:bg-white sm:text-sm p-4 transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-midnight uppercase tracking-widest mb-2 ml-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="john@example.com"
                        className="block w-full bg-frost border-transparent rounded-xl focus:ring-2 focus:ring-cobalt focus:bg-white sm:text-sm p-4 transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="service" className="block text-xs font-bold text-midnight uppercase tracking-widest mb-2 ml-1">Service Interested In</label>
                    <select
                      id="service"
                      required
                      className="block w-full bg-frost border-transparent rounded-xl focus:ring-2 focus:ring-cobalt focus:bg-white sm:text-sm p-4 transition-all"
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs font-bold text-midnight uppercase tracking-widest mb-2 ml-1">Project Brief</label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      placeholder="Tell us about your goals..."
                      className="block w-full bg-frost border-transparent rounded-xl focus:ring-2 focus:ring-cobalt focus:bg-white sm:text-sm p-4 transition-all"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                  </div>
                  {status === 'error' && (
                    <p className="text-ruby text-sm font-medium">Something went wrong. Please try again or email us directly.</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl shadow-cobalt/20 text-base font-bold text-white bg-cobalt hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cobalt disabled:opacity-50 transition-all transform hover:-translate-y-1"
                  >
                    {status === 'loading' ? 'Processing...' : 'Send Strategy Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
