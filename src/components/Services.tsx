import React from 'react';
import { Link } from 'react-router-dom';
import { services } from '../constants';

const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-midnight sm:text-4xl">
            Comprehensive Media & Tech Services
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-steel">
            Everything you need to build, launch, and grow your brand in one place.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="relative group bg-frost p-6 rounded-xl transition-all hover:bg-white hover:shadow-xl border border-transparent hover:border-cobalt/20"
            >
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-cobalt rounded-md shadow-lg group-hover:bg-cyan transition-colors duration-300">
                  <service.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold text-midnight group-hover:text-cobalt transition-colors">
                  {service.name}
                </h3>
                <p className="mt-2 text-base text-steel line-clamp-3">
                  {service.subheadline}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to={`/services/${service.id}`}
                  className="text-sm font-semibold text-cobalt hover:text-cyan transition-colors"
                >
                  Learn more &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
