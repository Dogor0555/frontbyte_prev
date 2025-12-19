// components/TechStack.jsx
const TechStack = () => {
  return (
    <section className="tech-stack" id="tech">
      <div className="cyber-container">
        {/* Título con efecto GLITCH */}
        <div className="cyber-header">
          <h2 className="cyber-title glitch" data-text="TECH STACK FOCK-3000">
            <span>TECH STACK</span>
            <span className="fock-text">FACTURADOR</span>
          </h2>
          <div className="cyber-divider"></div>
        </div>

        {/* Grid de tecnologías con efecto MATRIX */}
        <div className="cyber-grid">
          {[
            {
              icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
              name: "NEXT.JS",
              desc: "Framework React para renderizado híbrido (SSR/SSG) y alta performance"
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
              name: "POSTGRE-SQL",
              desc: "Sistema de gestión de base de datos relacional robusto y escalable"
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
              name: "NODE.JS",
              desc: "Entorno de ejecución JavaScript para el backend"
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
              name: "EXPRESS.JS",
              desc: "Framework minimalista para construir APIs RESTful"
            },
            {
              icon: "https://jwt.io/img/pic_logo.svg",
              name: "JWT-X",
              desc: "Autenticación segura mediante JSON Web Tokens"
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/digitalocean/digitalocean-original.svg",
              name: "VPS", 
              desc: "Infraestructura cloud para despliegue escalable"
            }
          ].map((tech, index) => (
            <div 
              key={index} 
              className="cyber-card"
              data-tech={tech.name.split('.')[0]}
            >
              <div className="card-hologram"></div>
              <div className="card-grid"></div>
              <div className="tech-icon">
                <img src={tech.icon} alt={tech.name} className="tech-logo" />
              </div>
              <h3 className="tech-name">
                {tech.name.split('').map((letter, i) => (
                  <span key={i} className="tech-letter">{letter}</span>
                ))}
              </h3>
              <p className="tech-desc">{tech.desc}</p>
              <div className="tech-stats">
                <span className="stat-bar" style={{'--power': '100%'}}></span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer con efecto terminal */}
        <div className="cyber-footer">
          <div className="terminal-line">
            <span className="prompt">root@bytefusion:~$</span>
            <span className="command">init tech_stack --ultra</span>
            <span className="cursor">|</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ESTILOS CYBERPUNK 3000 */
        .tech-stack {
          padding: 5rem 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(0, 100, 255, 0.1) 0%, transparent 30%),
            linear-gradient(to bottom, #0a0a12, #12121a);
          position: relative;
          overflow: hidden;
          border-top: 1px solid rgba(0, 212, 255, 0.2);
        }

        .tech-stack::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%2300d4ff' opacity='0.05' d='M10 10h10v10H10z'/%3E%3C/svg%3E"),
            linear-gradient(to right, 
              rgba(0, 212, 255, 0) 0%, 
              rgba(0, 212, 255, 0.02) 50%, 
              rgba(0, 212, 255, 0) 100%);
          pointer-events: none;
        }

        .cyber-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
        }

        /* HEADER STYLES */
        .cyber-header {
          text-align: center;
          margin-bottom: 4rem;
          position: relative;
        }

        .cyber-title {
          font-size: 4rem;
          font-weight: 700;
          color: #00d4ff;
          text-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff;
          margin-bottom: 1.5rem;
          font-family: 'Rajdhani', sans-serif;
          letter-spacing: 2px;
          position: relative;
          display: inline-block;
        }

        .cyber-title.glitch {
          animation: glitch 2s linear infinite;
        }

        .cyber-title.glitch::before {
          content: attr(data-text);
          position: absolute;
          left: -2px;
          text-shadow: -2px 0 #ff00aa;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }

        .fock-text {
          color: #ff00aa;
          text-shadow: 0 0 10px #ff00aa;
          margin-left: 1rem;
          font-size: 5rem;
          display: inline-block;
          transform: rotate(-5deg);
        }

        .cyber-divider {
          height: 3px;
          width: 200px;
          background: linear-gradient(90deg, 
            transparent, 
            #00d4ff, 
            #ff00aa, 
            #00d4ff, 
            transparent);
          margin: 0 auto;
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
        }

        /* GRID STYLES */
        .cyber-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .cyber-card {
          background: rgba(20, 20, 30, 0.7);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 5px;
          padding: 2.5rem 2rem;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
          backdrop-filter: blur(5px);
        }

        .cyber-card:hover {
          transform: translateY(-10px) scale(1.03);
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
          border-color: #00d4ff;
        }

        .cyber-card::before {
          content: attr(data-tech);
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 0.8rem;
          color: rgba(0, 212, 255, 0.5);
          font-family: 'Courier New', monospace;
        }

        .card-hologram {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 212, 255, 0.05) 0%,
            rgba(255, 0, 170, 0.05) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .cyber-card:hover .card-hologram {
          opacity: 1;
        }

        .card-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.2;
        }

        .tech-icon {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .tech-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          filter: drop-shadow(0 0 5px #00d4ff) brightness(1.2);
          transition: all 0.3s ease;
        }

        .cyber-card:hover .tech-logo {
          transform: scale(1.2) rotate(5deg);
          filter: drop-shadow(0 0 10px #ff00aa) brightness(1.5);
        }

        .tech-name {
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
          font-family: 'Rajdhani', sans-serif;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
        }

        .tech-letter {
          display: inline-block;
          transition: all 0.3s ease;
        }

        .cyber-card:hover .tech-letter {
          color: #00d4ff;
          transform: translateY(-3px);
          text-shadow: 0 0 5px #00d4ff;
        }

        .tech-letter:nth-child(even):hover {
          color: #ff00aa;
          text-shadow: 0 0 5px #ff00aa;
        }

        .tech-desc {
          color: #aaa;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          text-align: center;
          font-family: 'Courier New', monospace;
          min-height: 60px;
        }

        .tech-stats {
          display: flex;
          align-items: center;
          color: #00d4ff;
          font-size: 0.9rem;
          font-family: 'Courier New', monospace;
        }

        .stat-bar {
          height: 5px;
          width: var(--power);
          background: linear-gradient(90deg, #ff00aa, #00d4ff);
          margin-right: 10px;
          position: relative;
          overflow: hidden;
        }

        .stat-bar::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.8),
            transparent
          );
          animation: statAnimation 2s infinite linear;
        }

        /* FOOTER STYLES */
        .cyber-footer {
          margin-top: 3rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }

        .terminal-line {
          color: #00d4ff;
          display: flex;
          align-items: center;
        }

        .prompt {
          color: #ff00aa;
          margin-right: 10px;
        }

        .command {
          color: white;
        }

        .cursor {
          animation: blink 1s infinite;
          margin-left: 5px;
        }

        /* ANIMATIONS */
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

        @keyframes statAnimation {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .cyber-title {
            font-size: 2.5rem;
          }
          
          .fock-text {
            font-size: 3rem;
            display: block;
            margin-left: 0;
          }
          
          .cyber-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .cyber-grid {
            grid-template-columns: 1fr;
          }
          
          .cyber-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
};

export default TechStack;