import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Pricing from '../components/Pricing';
import ContactForm from '../components/ContactForm';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <Services />
      <Pricing />
      <ContactForm />
    </>
  );
};

export default Home;
