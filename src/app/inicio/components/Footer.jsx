const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid"></div>
      <div className="footer-glow"></div>
      
      <div className="container">
        <div className="footer-content">
          {/* Columna Principal - Brand */}
          <div className="footer-column brand-column">
            <div className="brand-wrapper">
              <div className="brand-icon">
                <div className="icon-core"></div>
                <div className="icon-ring"></div>
              </div>
              <h3 className="brand-name">
                BYTE FUSION
                <span className="brand-subtitle">SOLUCIONES</span>
              </h3>
            </div>
            <p className="brand-description">
              Tu partner tecnológico completo. Desarrollo de software, hardware, consultoría IT 
              y soluciones empresariales todo bajo un mismo techo para simplificar tu gestión tecnológica.
            </p>
            <div className="tech-badge">
              <span className="badge-dot"></span>
              FACTURACIÓN ELECTRÓNICA
            </div>
          </div>

          {/* Columna de Servicios IT */}
          <div className="footer-column">
            <h4 className="column-title">
              <span className="title-icon">💻</span>
              Desarrollo de Software
            </h4>
            <ul className="footer-links">
              <li><a href="#software">→ Facturación Electrónica</a></li>
              <li><a href="#software">→ Desarrollo Web Corporativo</a></li>
              <li><a href="#software">→ Aplicaciones Móviles</a></li>
              <li><a href="#software">→ Software a Medida (ERP/CRM)</a></li>
              <li><a href="#software">→ Sistemas de Gestión Empresarial</a></li>
            </ul>
          </div>

          {/* Columna de Hardware & Productos */}
          <div className="footer-column">
            <h4 className="column-title">
              <span className="title-icon">🖥️</span>
              Hardware & Productos
            </h4>
            <ul className="footer-links">
              <li><a href="#hardware">→ Computadoras & Laptops</a></li>
              <li><a href="#hardware">→ Impresoras & Multifuncionales</a></li>
              <li><a href="#hardware">→ Equipos de Red</a></li>
              <li><a href="#hardware">→ Sistemas de Seguridad</a></li>
              <li><a href="#productos">→ Licencias de Software</a></li>
            </ul>
          </div>

          {/* Columna de Consultoría & Soporte */}
          <div className="footer-column">
            <h4 className="column-title">
              <span className="title-icon">🎯</span>
              Consultoría & Soporte
            </h4>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon">📊</span>
                <a href="#consultoria">Consultoría IT Estratégica</a>
              </li>
              <li>
                <span className="contact-icon">☁️</span>
                <a href="#consultoria">Migración a la Nube</a>
              </li>
              <li>
                <span className="contact-icon">🔧</span>
                <a href="#consultoria">Soporte Técnico 24/7</a>
              </li>
              <li>
                <span className="contact-icon">🎓</span>
                <a href="#consultoria">Capacitación IT</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Características del Facturador 
        <div className="facturador-features">
          <div className="features-title">CARACTERÍSTICAS DEL FACTURADOR</div>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <div className="feature-text">Facturación Electrónica con validación del Ministerio de Hacienda</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <div className="feature-text">Control Financiero y Dashboard Inteligente</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">Reportes Automáticos con exportación a Excel/PDF</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div className="feature-text">Multi-plataforma: Web, Móvil y Tablet</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">Fácil de usar e implementar</div>
            </div>
          </div>
        </div> */}

        {/* Redes Sociales */}
        <div className="footer-social">
          <div className="social-title">CONECTA CON NOSOTROS</div>
          <div className="social-links">
            <a href="#facebook" className="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#twitter" className="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#linkedin" className="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#instagram" className="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
            </a>
            <a href="#whatsapp" className="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Divisor con línea tech */}
        <div className="footer-divider">
          <div className="divider-line"></div>
          <div className="divider-dot"></div>
          <div className="divider-line"></div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="copyright">
            <span className="copyright-icon">©</span>
            {currentYear} BYTE FUSION SOLUCIONES
            <span className="copyright-separator">|</span>
            <span className="copyright-text">San Salvador, El Salvador</span>
          </div>
          
          <div className="footer-legal">
            <a href="#privacy">Política de Privacidad</a>
            <span className="legal-separator">•</span>
            <a href="#terms">Términos de Servicio</a>
            <span className="legal-separator">•</span>
            <a href="#faq">Preguntas Frecuentes</a>
            <span className="legal-separator">•</span>
            <a href="#support">Soporte Técnico</a>
          </div>
          
          <div className="footer-stats">
            <div className="stat-item">
              <span className="stat-icon">✅</span>
              <span className="stat-text">200+ Clientes Satisfechos</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span className="stat-text">Soporte 24/7</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .footer {
          position: relative;
          width: 100%;
          background: #000000;
          color: #ffffff;
          padding: 80px 20px 30px;
          overflow: hidden;
        }

        .footer-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.3;
        }

        .footer-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(0, 212, 255, 0.15), transparent 70%);
          pointer-events: none;
        }

        .container {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 60px;
          margin-bottom: 60px;
        }

        /* Facturador Features */
        .facturador-features {
          background: rgba(0, 212, 255, 0.05);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 60px;
        }

        .features-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #00d4ff;
          text-align: center;
          margin-bottom: 30px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 25px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .feature-icon {
          font-size: 1.8rem;
          flex-shrink: 0;
          color: #00d4ff;
        }

        .feature-text {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        }

        /* Brand Column */
        .brand-column {
          max-width: 400px;
        }

        .brand-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .brand-icon {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .icon-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: #00d4ff;
          border-radius: 50%;
          box-shadow: 0 0 20px #00d4ff;
          animation: corePulse 2s ease-in-out infinite;
        }

        @keyframes corePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }

        .icon-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border: 2px solid #00d4ff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: ringRotate 3s linear infinite;
        }

        @keyframes ringRotate {
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .brand-name {
          font-size: 1.8rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 2px;
          margin: 0;
          line-height: 1.2;
        }

        .brand-subtitle {
          display: block;
          font-size: 0.9rem;
          color: #00d4ff;
          font-weight: 600;
          letter-spacing: 3px;
          margin-top: 4px;
        }

        .brand-description {
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.8;
          margin: 0 0 25px 0;
          font-size: 0.95rem;
        }

        .tech-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #00d4ff;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: #00d4ff;
          border-radius: 50%;
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px #00d4ff; }
          50% { opacity: 0.5; box-shadow: 0 0 10px #00d4ff; }
        }

        /* Column Titles */
        .column-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 25px 0;
          letter-spacing: 1px;
        }

        .title-icon {
          font-size: 1.2rem;
        }

        /* Footer Links */
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .footer-links a:hover {
          color: #00d4ff;
          transform: translateX(5px);
          text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }

        /* Contact List */
        .footer-contact {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
        }

        .contact-icon {
          font-size: 1.2rem;
          color: #00d4ff;
          flex-shrink: 0;
        }

        .footer-contact a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-contact a:hover {
          color: #00d4ff;
        }

        /* Social Section */
        .footer-social {
          text-align: center;
          margin-bottom: 60px;
        }

        .social-title {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 25px;
        }

        .social-links {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .social-btn {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .social-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.2), transparent);
          transition: transform 0.3s ease;
        }

        .social-btn:hover::before {
          transform: translate(-50%, -50%) scale(1);
        }

        .social-btn:hover {
          border-color: #00d4ff;
          color: #00d4ff;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
          transform: translateY(-3px);
        }

        .social-btn svg {
          width: 20px;
          height: 20px;
          position: relative;
          z-index: 1;
        }

        /* Divider */
        .footer-divider {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 40px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
        }

        .divider-dot {
          width: 8px;
          height: 8px;
          background: #00d4ff;
          border-radius: 50%;
          box-shadow: 0 0 15px #00d4ff;
          animation: dividerPulse 2s ease-in-out infinite;
        }

        @keyframes dividerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Footer Bottom */
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 30px;
          border-top: 1px solid rgba(0, 212, 255, 0.1);
        }

        .copyright {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .copyright-icon {
          color: #00d4ff;
          font-size: 1rem;
        }

        .copyright-separator {
          color: rgba(255, 255, 255, 0.3);
          margin: 0 5px;
        }

        .copyright-text {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
        }

        .footer-legal {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .footer-legal a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.3s ease;
        }

        .footer-legal a:hover {
          color: #00d4ff;
        }

        .legal-separator {
          color: rgba(255, 255, 255, 0.3);
          margin: 0 8px;
        }

        .footer-stats {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-icon {
          font-size: 0.9rem;
          color: #00ff88;
        }

        .stat-text {
          font-size: 0.75rem;
          color: #00ff88;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }

          .brand-column {
            grid-column: 1 / -1;
            max-width: 100%;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .footer {
            padding: 60px 15px 30px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .facturador-features {
            padding: 20px;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .copyright {
            flex-wrap: wrap;
            justify-content: center;
          }

          .footer-legal {
            flex-wrap: wrap;
            justify-content: center;
          }

          .footer-stats {
            flex-direction: column;
            gap: 10px;
          }

          .social-links {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 480px) {
          .brand-name {
            font-size: 1.5rem;
          }

          .brand-wrapper {
            flex-direction: column;
            text-align: center;
          }

          .social-btn {
            width: 45px;
            height: 45px;
          }

          .column-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;