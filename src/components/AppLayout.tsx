import React from 'react';
import Header from './Header';
import Hero from './Hero';
import WorkflowSteps from './WorkflowSteps';
import Studio from './Studio';
import StylesSection from './StylesSection';
import BackgroundsShowcase from './BackgroundsShowcase';
import Gallery from './Gallery';
import Pricing from './Pricing';
import CTABanner from './CTABanner';
import Footer from './Footer';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <Header />
      <main>
        <Hero />
        <WorkflowSteps />
        <Studio />
        <StylesSection />
        <BackgroundsShowcase />
        <Gallery />
        <Pricing />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
