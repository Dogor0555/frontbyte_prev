const ProductShowcase = () => {
  return (
    <section className="product-showcase" id="product">
      <div className="container">
        <h2 className="section-title">Nuestro Facturador Electrónico</h2>
    
        
        <div className="product-hero">
          <div className="product-description">
            <h3>Facturación Electrónica Profesional</h3>
            <p className="text-black">
              Dentro de nuestro portafolio de soluciones tecnológicas, nuestro sistema de 
              facturación electrónica destaca como una herramienta integral que combina 
              potencia, simplicidad y cumplimiento normativo en una sola plataforma inteligente.
            </p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div>
                  <h4>Facturación Instantánea</h4>
                  <p>Genera facturas electrónicas en segundos con validación automática</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h4>Dashboard Inteligente</h4>
                  <p>Analíticas en tiempo real y reportes automatizados</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>100% Seguro</h4>
                  <p>Encriptación avanzada y cumplimiento SUNAT</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">☁️</span>
                <div>
                  <h4>Cloud First</h4>
                  <p>Acceso desde cualquier dispositivo, en cualquier momento</p>
                </div>
              </div>
            </div>
            
            <div className="product-cta">
              <a href="#contact" className="cta-button primary">Prueba Gratis</a>
              <a href="#services" className="cta-button secondary">Ver Todos los Servicios</a>
            </div>
          </div>
          
          <div className="product-visual">
            <div className="mockup-container">
              <div className="mockup-screen">
                <div className="mockup-header">
                  <div className="mockup-controls">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="mockup-title">Facturador Byte Fusion</div>
                </div>
                <div className="mockup-content">
                  <div className="dashboard-widget">
                    <h5>Ventas Hoy</h5>
                    <div className="stat-number">S/ 15,420</div>
                    <div className="stat-change">+12.5%</div>
                  </div>
                  <div className="dashboard-widget">
                    <h5>Facturas Emitidas</h5>
                    <div className="stat-number">248</div>
                    <div className="stat-change">+8.3%</div>
                  </div>
                  <div className="dashboard-chart">
                    <div className="chart-bars">
                      <div className="bar" style={{ height: '40%' }}></div>
                      <div className="bar" style={{ height: '70%' }}></div>
                      <div className="bar" style={{ height: '60%' }}></div>
                      <div className="bar" style={{ height: '90%' }}></div>
                      <div className="bar" style={{ height: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .section-intro {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 40px;
          color: #fff;
          font-size: 1rem;
          line-height: 1.6;
        }
      `}</style>
    </section>
  );
};

export default ProductShowcase;