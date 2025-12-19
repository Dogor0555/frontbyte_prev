// app/page.jsx
"use client";
import { useEffect } from 'react';
import Particles from './inicio/components/Particles';
import Header from './inicio/components/Header';
import Hero from './inicio/components/Hero';
import ProductShowcase from './inicio/components/ProductShowcase';
import Services from './inicio/components/Services';
import TechStack from './inicio/components/TechStack';
import Contact from './inicio/components/Contact';
import Footer from './inicio/components/Footer';
import Servicesit from './inicio/components/Ser';

export default function Home() {
  useEffect(() => {
    // Animate elements on scroll
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.service-card, .tech-card, .feature-item');
      
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 100) {
          element.style.animation = 'fadeInUp 0.6s ease-out forwards';
        }
      });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on load

    return () => {
      window.removeEventListener('scroll', animateOnScroll);
    };
  }, []);

  return (
    <>
      <Particles />
      <Header />
      <Hero />
      <Servicesit />
      <ProductShowcase />
      <Services />
      <TechStack />
      <Contact />
      <Footer />
    </>
  );
}