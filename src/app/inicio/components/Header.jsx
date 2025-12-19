// components/Header.jsx
"use client";
import { useEffect, useState } from 'react';
import './Header.css'; // Importa los estilos

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header>
      <nav>
        <div className="logo">
          <div className="logo-icon">BF</div>
          <span>Byte Fusion</span>
        </div>
        
        {/* Hamburger Menu Button */}
        <button 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links - ACTUALIZADO */}
        <ul className={`nav-links ${isMenuOpen ? 'nav-active' : ''}`}>
          <li><a href="#home" onClick={closeMenu}><span>Inicio</span></a></li>
          <li><a href="#servicesit" onClick={closeMenu}><span>Servicios</span></a></li>
          <li><a href="#services" onClick={closeMenu}><span>Funciones Facturador</span></a></li>
          <li><a href="#product" onClick={closeMenu}><span>Facturador</span></a></li>
          <li><a href="#tech" onClick={closeMenu}><span>Tecnologías</span></a></li>
          <li><a href="#contact" onClick={closeMenu}><span>Contacto</span></a></li>
        </ul>

        {/* Overlay for mobile */}
        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </nav>
    </header>
  );
};

export default Header;