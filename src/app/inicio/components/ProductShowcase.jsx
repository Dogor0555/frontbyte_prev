import { useState, useEffect } from 'react';

const ProductShowcase = () => {
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    setAnimateStats(true);
  }, []);

  return (
    <section className="product-showcase" id="product">
      <div className="tech-grid"></div>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>
      
      <div className="container">
        <div className="section-header">
          <div className="tech-badge">PRODUCTO DESTACADO</div>
          <h2 className="section-title">
            Sistema de Facturación Electrónica
            <span className="tech-line"></span>
          </h2>
          <p className="section-intro">
            Tecnología de vanguardia para la gestión fiscal moderna. Potencia, seguridad y cumplimiento 
            normativo integrados en una plataforma cloud de alto rendimiento.
          </p>
        </div>
        
        <div className="product-hero">
          <div className="product-description">
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="icon-glow"></div>
                  <span className="feature-icon">⚡</span>
                </div>
                <div className="feature-content">
                  <h4>Facturación Instantánea</h4>
                  <p>Emisión y validación automática en tiempo real con el Ministerio de Hacienda</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="icon-glow"></div>
                  <span className="feature-icon">📊</span>
                </div>
                <div className="feature-content">
                  <h4>Dashboard Inteligente</h4>
                  <p>Analytics avanzado con visualización de datos en tiempo real y reportes AI</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="icon-glow"></div>
                  <span className="feature-icon">🔒</span>
                </div>
                <div className="feature-content">
                  <h4>Seguridad Enterprise</h4>
                  <p>Encriptación AES-256, firma digital y cumplimiento normativo certificado</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="icon-glow"></div>
                  <span className="feature-icon">☁️</span>
                </div>
                <div className="feature-content">
                  <h4>Cloud Architecture</h4>
                  <p>Infraestructura escalable con 99.9% uptime y backups automáticos</p>
                </div>
              </div>
            </div>
            
            <div className="product-cta">
              <a href="#contact" className="cta-button primary">
                <span>Solicitar Demo</span>
                <div className="button-glow"></div>
              </a>
              <a href="#services" className="cta-button secondary">
                <span>Ver Todos los Servicios</span>
              </a>
            </div>
          </div>
          
          <div className="product-visual">
            <div className="mockup-container">
              <div className="scan-line"></div>
              <div className="mockup-screen">
                <div className="mockup-header">
                  <div className="mockup-controls">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="mockup-title">
                    <span className="title-icon">●</span> Byte Fusion Facturador
                  </div>
                  <div className="mockup-status">
                    <span className="status-dot"></span> ONLINE
                  </div>
                </div>
                
                <div className="mockup-content">
                  <div className="stats-row">
                    <div className={`dashboard-widget ${animateStats ? 'animate' : ''}`}>
                      <div className="widget-label">VENTAS HOY</div>
                      <div className="stat-number">S/ 15,420</div>
                      <div className="stat-change positive">
                        <span>▲</span> +12.5%
                      </div>
                      <div className="widget-graph">
                        <div className="mini-bar" style={{ height: '40%' }}></div>
                        <div className="mini-bar" style={{ height: '65%' }}></div>
                        <div className="mini-bar" style={{ height: '55%' }}></div>
                        <div className="mini-bar" style={{ height: '85%' }}></div>
                      </div>
                    </div>
                    
                    <div className={`dashboard-widget ${animateStats ? 'animate' : ''}`} style={{ animationDelay: '0.1s' }}>
                      <div className="widget-label">FACTURAS EMITIDAS</div>
                      <div className="stat-number">248</div>
                      <div className="stat-change positive">
                        <span>▲</span> +8.3%
                      </div>
                      <div className="widget-progress">
                        <div className="progress-bar" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dashboard-chart">
                    <div className="chart-header">
                      <span>RENDIMIENTO SEMANAL</span>
                      <span className="chart-legend">
                        <span className="legend-dot"></span> Ingresos
                      </span>
                    </div>
                    <div className="chart-bars">
                      <div className="bar-wrapper">
                        <div className="bar" style={{ height: '45%' }}></div>
                        <span className="bar-label">L</span>
                      </div>
                      <div className="bar-wrapper">
                        <div className="bar" style={{ height: '70%' }}></div>
                        <span className="bar-label">M</span>
                      </div>
                      <div className="bar-wrapper">
                        <div className="bar" style={{ height: '60%' }}></div>
                        <span className="bar-label">M</span>
                      </div>
                      <div className="bar-wrapper">
                        <div className="bar" style={{ height: '90%' }}></div>
                        <span className="bar-label">J</span>
                      </div>
                      <div className="bar-wrapper">
                        <div className="bar" style={{ height: '75%' }}></div>
                        <span className="bar-label">V</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="transactions-list">
                    <div className="transaction-item">
                      <div className="transaction-icon">📄</div>
                      <div className="transaction-info">
                        <div className="transaction-name">Factura #001-4582</div>
                        <div className="transaction-time">Hace 2 minutos</div>
                      </div>
                      <div className="transaction-amount">S/ 1,250</div>
                    </div>
                    <div className="transaction-item">
                      <div className="transaction-icon">📄</div>
                      <div className="transaction-info">
                        <div className="transaction-name">Factura #001-4581</div>
                        <div className="transaction-time">Hace 15 minutos</div>
                      </div>
                      <div className="transaction-amount">S/ 3,890</div>
                    </div>
                  </div>
                </div>
                
                <div className="data-stream">
                  <div className="stream-line"></div>
                  <div className="stream-line"></div>
                  <div className="stream-line"></div>
                </div>
              </div>
              
              <div className="tech-corners">
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .product-showcase {
          position: relative;
          width: 100%;
          padding: 100px 20px;
          background: linear-gradient(135deg, #0a0e27 0%, #0f1419 50%, #0a0e27 100%);
          overflow: hidden;
        }

        .tech-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.3;
          animation: gridScroll 20s linear infinite;
        }

        @keyframes gridScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        .glow-orb {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          animation: float 8s ease-in-out infinite;
        }

        .glow-orb-1 {
          top: -100px;
          left: -100px;
          background: radial-gradient(circle, #00d4ff 0%, transparent 70%);
        }

        .glow-orb-2 {
          bottom: -100px;
          right: -100px;
          background: radial-gradient(circle, #0088ff 0%, transparent 70%);
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, 50px); }
        }

        .container {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .tech-badge {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid #00d4ff;
          border-radius: 20px;
          color: #00d4ff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 20px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .section-title {
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 20px 0;
          text-transform: uppercase;
          letter-spacing: -1px;
          position: relative;
          display: inline-block;
        }

        .tech-line {
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
        }

        .section-intro {
          max-width: 700px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
          line-height: 1.8;
        }

        .product-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .feature-card {
          display: flex;
          gap: 20px;
          padding: 25px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 15px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card:hover {
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.05);
          transform: translateX(5px);
        }

        .feature-icon-wrapper {
          position: relative;
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent);
          border-radius: 50%;
          animation: iconPulse 2s ease-in-out infinite;
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        .feature-icon {
          font-size: 2rem;
          position: relative;
          z-index: 1;
        }

        .feature-content h4 {
          color: #ffffff;
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .feature-content p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
        }

        .product-cta {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .cta-button {
          position: relative;
          padding: 18px 35px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .cta-button span {
          position: relative;
          z-index: 1;
        }

        .cta-button.primary {
          background: linear-gradient(135deg, #00d4ff, #0088ff);
          color: #000;
          border: none;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
        }

        .button-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .cta-button.primary:hover .button-glow {
          opacity: 1;
          animation: buttonShine 1.5s ease-in-out infinite;
        }

        @keyframes buttonShine {
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(-30%, -30%); }
        }

        .cta-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(0, 212, 255, 0.6);
        }

        .cta-button.secondary {
          background: transparent;
          color: #00d4ff;
          border: 2px solid #00d4ff;
        }

        .cta-button.secondary:hover {
          background: rgba(0, 212, 255, 0.1);
          transform: translateY(-2px);
        }

        .product-visual {
          position: relative;
        }

        .mockup-container {
          position: relative;
          padding: 20px;
        }

        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          animation: scan 3s ease-in-out infinite;
          z-index: 2;
        }

        @keyframes scan {
          0%, 100% { top: 0; opacity: 0; }
          50% { top: 100%; opacity: 1; }
        }

        .mockup-screen {
          background: rgba(10, 14, 39, 0.9);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 
            0 0 50px rgba(0, 212, 255, 0.3),
            inset 0 0 50px rgba(0, 212, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .mockup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 25px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }

        .mockup-controls {
          display: flex;
          gap: 8px;
        }

        .mockup-controls span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00d4ff;
          opacity: 0.6;
        }

        .mockup-controls span:nth-child(1) { background: #ff5f57; }
        .mockup-controls span:nth-child(2) { background: #ffbd2e; }
        .mockup-controls span:nth-child(3) { background: #28ca42; }

        .mockup-title {
          color: #00d4ff;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-icon {
          color: #00ff88;
          animation: blink 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .mockup-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #00ff88;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #00ff88;
          border-radius: 50%;
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px #00ff88; }
          50% { opacity: 0.5; box-shadow: 0 0 10px #00ff88; }
        }

        .mockup-content {
          padding: 30px 25px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
        }

        .dashboard-widget {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 15px;
          padding: 20px;
          opacity: 0;
          transform: translateY(20px);
        }

        .dashboard-widget.animate {
          animation: fadeInUp 0.6s ease forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .widget-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .stat-number {
          color: #ffffff;
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 8px;
          text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .stat-change {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .stat-change.positive {
          color: #00ff88;
          background: rgba(0, 255, 136, 0.1);
        }

        .widget-graph {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 30px;
          margin-top: 15px;
        }

        .mini-bar {
          flex: 1;
          background: linear-gradient(to top, #00d4ff, #0088ff);
          border-radius: 2px;
          animation: barGrow 1s ease forwards;
        }

        @keyframes barGrow {
          from { height: 0; }
        }

        .widget-progress {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 15px;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #00d4ff, #0088ff);
          border-radius: 3px;
          animation: progressFill 1.5s ease forwards;
        }

        @keyframes progressFill {
          from { width: 0; }
        }

        .dashboard-chart {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          background: #00d4ff;
          border-radius: 50%;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 120px;
          gap: 10px;
        }

        .bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .bar {
          width: 100%;
          background: linear-gradient(to top, #00d4ff, #0088ff);
          border-radius: 4px 4px 0 0;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
          animation: barGrow 1.5s ease forwards;
          position: relative;
        }

        .bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #00ff88;
          border-radius: 4px 4px 0 0;
        }

        .bar-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 212, 255, 0.1);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .transaction-item:hover {
          border-color: rgba(0, 212, 255, 0.4);
          background: rgba(0, 0, 0, 0.5);
        }

        .transaction-icon {
          font-size: 1.5rem;
        }

        .transaction-info {
          flex: 1;
        }

        .transaction-name {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .transaction-time {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
        }

        .transaction-amount {
          color: #00d4ff;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .data-stream {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40px;
          display: flex;
          gap: 5px;
          padding: 0 25px;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(0, 212, 255, 0.2);
        }

        .stream-line {
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          animation: streamFlow 2s ease-in-out infinite;
        }

        .stream-line:nth-child(2) { animation-delay: 0.3s; }
        .stream-line:nth-child(3) { animation-delay: 0.6s; }

        @keyframes streamFlow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        .tech-corners {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: #00d4ff;
        }

        .corner-tl {
          top: 0;
          left: 0;
          border-top: 2px solid;
          border-left: 2px solid;
        }

        .corner-tr {
          top: 0;
          right: 0;
          border-top: 2px solid;
          border-right: 2px solid;
        }

        .corner-bl {
          bottom: 0;
          left: 0;
          border-bottom: 2px solid;
          border-left: 2px solid;
        }

        .corner-br {
          bottom: 0;
          right: 0;
          border-bottom: 2px solid;
          border-right: 2px solid;
        }

        @media (max-width: 1024px) {
          .product-hero {
            grid-template-columns: 1fr;
            gap: 50px;
          }

          .section-title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .product-showcase {
            padding: 60px 15px;
          }

          .section-title {
            font-size: 2rem;
          }

          .section-intro {
            font-size: 1rem;
          }

          .stats-row {
            grid-template-columns: 1fr;
          }

          .mockup-header {
            padding: 15px 20px;
          }

          .mockup-content {
            padding: 20px 15px;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .product-cta {
            flex-direction: column;
          }

          .cta-button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default ProductShowcase;