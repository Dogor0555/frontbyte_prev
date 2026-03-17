// components/Header.jsx
"use client";
import { useEffect, useState } from 'react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Smooth scroll + cleanup
  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');

    const handleClick = function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    anchors.forEach(anchor => anchor.addEventListener('click', handleClick));

    return () => {
      anchors.forEach(anchor => anchor.removeEventListener('click', handleClick));
    };
  }, []);

  // Detect scroll (shrink navbar)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section observer
  useEffect(() => {
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <nav>
        <div className="logo">
          <div className="logo-icon">BF</div>
          <span>Byte Fusion</span>
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Links */}
        <ul className={`nav-links ${isMenuOpen ? 'nav-active' : ''}`}>
          <li>
            <a href="#home" onClick={closeMenu} className={activeSection === 'home' ? 'active' : ''}>
              <span>Inicio</span>
            </a>
          </li>
          <li>
            <a href="#servicesit" onClick={closeMenu} className={activeSection === 'servicesit' ? 'active' : ''}>
              <span>Servicios</span>
            </a>
          </li>
          <li>
            <a href="#services" onClick={closeMenu} className={activeSection === 'services' ? 'active' : ''}>
              <span>Funciones Facturador</span>
            </a>
          </li>
          <li>
            <a href="#product" onClick={closeMenu} className={activeSection === 'product' ? 'active' : ''}>
              <span>Facturador</span>
            </a>
          </li>
          <li>
            <a href="#tech" onClick={closeMenu} className={activeSection === 'tech' ? 'active' : ''}>
              <span>Tecnologías</span>
            </a>
          </li>
          <li>
            <a href="#contact" onClick={closeMenu} className={activeSection === 'contact' ? 'active' : ''}>
              <span>Contacto</span>
            </a>
          </li>
        </ul>

        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </nav>
    </header>
  );
};

export default Header;