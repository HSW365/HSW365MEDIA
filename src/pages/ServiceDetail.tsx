import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { services, BOOKING_EMAIL } from '../constants';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const ServiceDetail: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const service = services.find((s) => s.id === serviceId);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-frost">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-midnight">Service Not Found</h1>
          <Link to="/" className="mt-4 text-cobalt hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-frost min-h-screen">
      <div className="bg-midnight text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cobalt rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="text-cyan hover:text-white transition-colors flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" /> All services
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-5 bg-cobalt rounded-2xl shadow-xl shadow-cobalt/20 w-fit">
              <service.icon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight leading-tight">{service.name}</h1>
              <p className="text-xl text-cyan font-medium mt-2">{service.headline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-midnight mb-6">Overview</h2>
              <p className="text-steel text-lg leading-relaxed mb-6 italic">
                {service.description}
              </p>
              <p className="text-steel text-lg leading-relaxed">
                {service.subheadline} HSW365 Media provides professional, end-to-end solutions tailored to your unique requirements. Our approach is built on transparency, technical excellence, and a deep understanding of your business goals.
              </p>
            </section>
            
            <section>
              <h3 className="text-2xl font-bold text-midnight mb-8 text-center lg:text-left">Key Deliverables</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-frost group hover:border-cobalt/20 transition-colors">
                    <div className="bg-emerald-50 p-2 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <CheckCircle className="h-5 w-5 text-emerald-500 group-hover:text-white" />
                    </div>
                    <span className="text-slate-text font-bold text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-midnight p-8 rounded-[2rem] shadow-2xl sticky top-28 text-white border border-white/5 overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 gradient-bg rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <h3 className="text-2xl font-bold mb-4 relative z-10">Ready to start?</h3>
              <p className="text-gray-400 mb-8 relative z-10">
                Request {service.name.toLowerCase()} and turn your vision into opportunity.
              </p>
              <Link 
                to="/#contact"
                className="block w-full bg-cobalt text-white text-center py-4 rounded-xl font-bold hover:opacity-90 transition-all mb-6 shadow-xl shadow-cobalt/40 relative z-10"
              >
                {service.cta}
              </Link>
              <div className="space-y-4 text-sm text-gray-400 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                  <span>Expert Implementation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                  <span>24/7 Priority Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                  <span>Measurable ROI Focused</span>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-500 mt-8 relative z-10 uppercase tracking-widest">
                Direct: {BOOKING_EMAIL.replace('mailto:', '')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
