// components/Particles.jsx
"use client";
import { useEffect } from 'react';

const Particles = () => {
  useEffect(() => {
    // Create floating particles
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
      }
    };

    createParticles();

    // Mouse move effect for hero section
    const handleMouseMove = (e) => {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;
      
      const bgAnimation = document.querySelector('.bg-animation');
      if (bgAnimation) {
        bgAnimation.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="bg-animation"></div>
      <div className="particles" id="particles"></div>
    </>
  );
};

export default Particles;