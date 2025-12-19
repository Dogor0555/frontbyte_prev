// components/Services.jsx
const Services = () => {
  return (
    <section className="services" id="services">
      <div className="cyber-container">
        <div className="neon-header">
          <h2 className="neon-title glitch" data-text="CARACTERÍSTICAS DEL FACTURADOR">CARACTERÍSTICAS DEL FACTURADOR</h2>
          <div className="neon-line"></div>
        </div>
        
        <div className="cyber-grid">
          {/* Tarjeta 1 */}
          <div className="cyber-card" data-glitch="Facturación">
            <div className="card-corner tl"></div>
            <div className="card-corner tr"></div>
            <div className="card-corner bl"></div>
            <div className="card-corner br"></div>
            <div className="neon-icon">📋</div>
            <h3 className="cyber-text">FACTURACIÓN <span className="neon-effect">ELECTRÓNICA</span></h3>
            <p className="cyber-desc">Emisión automática de comprobantes electrónicos con validación del Ministerio de Hacienda en tiempo real y firma digital integrada.</p>
            <div className="cyber-line"></div>
          </div>
          
          {/* Tarjeta 2 */}
          <div className="cyber-card" data-glitch="Control">
            <div className="card-corner tl"></div>
            <div className="card-corner tr"></div>
            <div className="card-corner bl"></div>
            <div className="card-corner br"></div>
            <div className="neon-icon">💰</div>
            <h3 className="cyber-text">CONTROL <span className="neon-effect">FINANCIERO</span></h3>
            <p className="cyber-desc">Dashboard completo con métricas de ventas, flujo de caja y cuentas por cobrar para un control total de tus finanzas.</p>
            <div className="cyber-line"></div>
          </div>
          
          {/* Tarjeta 3 */}
          <div className="cyber-card" data-glitch="Reportes">
            <div className="card-corner tl"></div>
            <div className="card-corner tr"></div>
            <div className="card-corner bl"></div>
            <div className="card-corner br"></div>
            <div className="neon-icon">📊</div>
            <h3 className="cyber-text">REPORTES <span className="neon-effect">INTELIGENTES</span></h3>
            <p className="cyber-desc">Generación automática de reportes gerenciales con exportación a Excel y PDF para facilitar la toma de decisiones.</p>
            <div className="cyber-line"></div>
          </div>
          
          {/* Tarjeta 4 */}
          <div className="cyber-card" data-glitch="Multiplataforma">
            <div className="card-corner tl"></div>
            <div className="card-corner tr"></div>
            <div className="card-corner bl"></div>
            <div className="card-corner br"></div>
            <div className="neon-icon">📱</div>
            <h3 className="cyber-text">MULTI-<span className="neon-effect">PLATAFORMA</span></h3>
            <p className="cyber-desc">Acceso desde web, móvil y tablet con sincronización en tiempo real y funcionamiento offline.</p>
            <div className="cyber-line"></div>
          </div>
          
          {/* Tarjeta 5 */}
          <div className="cyber-card" data-glitch="Usabilidad">
            <div className="card-corner tl"></div>
            <div className="card-corner tr"></div>
            <div className="card-corner bl"></div>
            <div className="card-corner br"></div>
            <div className="neon-icon">⚙️</div>
            <h3 className="cyber-text">FÁCIL <span className="neon-effect">DE USAR</span></h3>
            <p className="cyber-desc">Interfaz intuitiva y fácil configuración que se adapta a las necesidades específicas de tu negocio.</p>
            <div className="cyber-line"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .services {
          padding: 80px 0;
          background-color: #0a0a0a;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 212, 255, 0.1) 0%, transparent 50%);
          position: relative;
          overflow: hidden;
        }
        
        .services::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          box-shadow: 0 0 10px #00d4ff;
        }
        
        .cyber-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          position: relative;
        }
        
        .neon-header {
          text-align: center;
          margin-bottom: 80px;
          position: relative;
        }
        
        .neon-title {
          font-size: 3rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #fff;
          text-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff;
          position: relative;
          margin-bottom: 30px;
          font-family: 'Rajdhani', sans-serif;
        }
        
        .neon-title.glitch {
          animation: glitch 2s linear infinite;
        }
        
        .neon-title.glitch::before {
          content: attr(data-text);
          position: absolute;
          left: -2px;
          text-shadow: -5px 0 #ff00c1;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        
        .neon-line {
          height: 3px;
          width: 200px;
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          margin: 0 auto;
          box-shadow: 0 0 15px #00d4ff;
        }
        
        .cyber-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 40px;
        }
        
        .cyber-card {
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 0;
          padding: 40px 30px;
          position: relative;
          transition: all 0.4s ease;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
        }
        
        .cyber-card:hover {
          transform: translateY(-10px);
          border-color: #00d4ff;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
        }
        
        .cyber-card:hover::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
          animation: rotate 4s linear infinite;
        }
        
        .card-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: #00d4ff;
          border-style: solid;
          border-width: 0;
          opacity: 0.7;
        }
        
        .card-corner.tl {
          top: 0;
          left: 0;
          border-top-width: 2px;
          border-left-width: 2px;
        }
        
        .card-corner.tr {
          top: 0;
          right: 0;
          border-top-width: 2px;
          border-right-width: 2px;
        }
        
        .card-corner.bl {
          bottom: 0;
          left: 0;
          border-bottom-width: 2px;
          border-left-width: 2px;
        }
        
        .card-corner.br {
          bottom: 0;
          right: 0;
          border-bottom-width: 2px;
          border-right-width: 2px;
        }
        
        .cyber-card:hover .card-corner {
          opacity: 1;
          border-color: #00d4ff;
        }
        
        .neon-icon {
          font-size: 3.5rem;
          margin-bottom: 25px;
          display: inline-block;
          text-shadow: 0 0 15px #00d4ff;
          filter: drop-shadow(0 0 5px #00d4ff);
        }
        
        .cyber-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Rajdhani', sans-serif;
        }
        
        .neon-effect {
          color: #00d4ff;
          text-shadow: 0 0 10px #00d4ff;
          display: inline-block;
        }
        
        .cyber-desc {
          color: #aaa;
          line-height: 1.7;
          margin-bottom: 25px;
          font-size: 0.95rem;
        }
        
        .cyber-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent);
          margin-top: 25px;
        }
        
        /* Animaciones */
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(-3px, -3px); }
          60% { transform: translate(3px, 3px); }
          80% { transform: translate(3px, -3px); }
          100% { transform: translate(0); }
        }
        
        @keyframes glitch-anim {
          0% { clip: rect(31px, 9999px, 94px, 0); }
          10% { clip: rect(112px, 9999px, 76px, 0); }
          20% { clip: rect(85px, 9999px, 77px, 0); }
          30% { clip: rect(27px, 9999px, 97px, 0); }
          40% { clip: rect(64px, 9999px, 98px, 0); }
          50% { clip: rect(61px, 9999px, 85px, 0); }
          60% { clip: rect(99px, 9999px, 114px, 0); }
          70% { clip: rect(34px, 9999px, 115px, 0); }
          80% { clip: rect(98px, 9999px, 129px, 0); }
          90% { clip: rect(43px, 9999px, 96px, 0); }
          100% { clip: rect(82px, 9999px, 64px, 0); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .neon-title {
            font-size: 2rem;
          }
          
          .cyber-grid {
            grid-template-columns: 1fr;
          }
          
          .cyber-card {
            padding: 30px 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default Services;