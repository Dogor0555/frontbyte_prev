import { useState } from 'react';

const Services = () => {
  const [activeTab, setActiveTab] = useState('software');

  const serviceCategories = {
    software: {
      title: "Desarrollo de Software",
      icon: "💻",
      color: "#00d4ff",
      services: [
        {
          icon: "📋",
          title: "Facturación Electrónica",
          description: "Sistema completo de facturación con emisión automática de comprobantes electrónicos, validación del Ministerio de Hacienda en tiempo real y firma digital integrada.",
          features: ["Cumplimiento normativo", "Dashboard inteligente", "Reportes automáticos"],
          featured: true
        },
        {
          icon: "🌐",
          title: "Desarrollo Web",
          description: "Sitios web corporativos, tiendas online, aplicaciones web y sistemas administrativos personalizados con diseño responsivo.",
          features: ["Diseño responsivo", "SEO optimizado", "CMS personalizado", "E-commerce"]
        },
        {
          icon: "📱",
          title: "Aplicaciones Móviles",
          description: "Apps nativas e híbridas para iOS y Android, desde aplicaciones empresariales hasta soluciones de consumo masivo.",
          features: ["iOS & Android", "Push notifications", "Offline sync", "Analytics integrado"]
        },
        {
          icon: "🔧",
          title: "Software a Medida",
          description: "Desarrollo de sistemas empresariales específicos: ERP, CRM, sistemas de inventario, nómina y gestión integral.",
          features: ["Arquitectura escalable", "Base de datos robusta", "Integración APIs", "Soporte técnico"]
        }
      ]
    },
    hardware: {
      title: "Hardware & Equipos",
      icon: "🖥️",
      color: "#ff6b35",
      services: [
        {
          icon: "💻",
          title: "Computadoras & Laptops",
          description: "Venta de equipos de cómputo para oficina, gaming, diseño gráfico y uso empresarial. Marcas reconocidas con garantía extendida.",
          features: ["Configuración personalizada", "Garantía extendida", "Soporte técnico", "Financiamiento disponible"]
        },
        {
          icon: "🖨️",
          title: "Impresoras & Multifuncionales",
          description: "Impresoras láser, inyección de tinta, multifuncionales y equipos de gran formato para oficinas y empresas.",
          features: ["Instalación incluida", "Mantenimiento preventivo", "Suministros originales", "Leasing disponible"]
        },
        {
          icon: "📡",
          title: "Equipos de Red",
          description: "Routers, switches, access points, firewalls y equipos de telecomunicaciones para infraestructura empresarial.",
          features: ["Configuración profesional", "Monitoreo 24/7", "Garantía comercial", "Escalabilidad"]
        },
        {
          icon: "🔒",
          title: "Sistemas de Seguridad",
          description: "Cámaras IP, sistemas de alarma, control de acceso y videovigilancia para protección integral de instalaciones.",
          features: ["Instalación profesional", "Monitoreo remoto", "App móvil", "Respaldo en la nube"]
        }
      ]
    },
    consultoria: {
      title: "Consultoría & Servicios",
      icon: "🎯",
      color: "#28a745",
      services: [
        {
          icon: "📊",
          title: "Consultoría IT",
          description: "Asesoramiento estratégico en tecnología, auditorías de sistemas, optimización de procesos y planificación digital.",
          features: ["Auditoría completa", "Plan estratégico", "ROI medible", "Seguimiento continuo"]
        },
        {
          icon: "☁️",
          title: "Migración a la Nube",
          description: "Servicios completos de migración, configuración y gestión de infraestructura cloud con AWS, Google Cloud o Azure.",
          features: ["Migración segura", "Escalabilidad automática", "Respaldos automáticos", "Monitoreo 24/7"]
        },
        {
          icon: "🔧",
          title: "Soporte Técnico",
          description: "Mantenimiento preventivo y correctivo de equipos, redes y sistemas. Soporte remoto y presencial disponible.",
          features: ["Respuesta 24/7", "Mantenimiento preventivo", "Soporte remoto", "SLA garantizado"]
        },
        {
          icon: "🎓",
          title: "Capacitación IT",
          description: "Programas de capacitación en tecnologías específicas, uso de software empresarial y mejores prácticas digitales.",
          features: ["Cursos personalizados", "Certificaciones", "Material didáctico", "Seguimiento post-curso"]
        }
      ]
    },
    productos: {
      title: "Productos & Licencias",
      icon: "📦",
      color: "#6f42c1",
      services: [
        {
          icon: "🏢",
          title: "Microsoft Office 365",
          description: "Licencias corporativas de Office 365, Microsoft Teams, SharePoint y toda la suite de productividad empresarial.",
          features: ["Licencias originales", "Soporte técnico", "Migración incluida", "Capacitación básica"]
        },
        {
          icon: "🔒",
          title: "Antivirus Empresarial",
          description: "Soluciones de seguridad empresarial: Kaspersky, ESET, Bitdefender con gestión centralizada y reportes.",
          features: ["Gestión centralizada", "Reportes detallados", "Actualización automática", "Soporte especializado"]
        },
        {
          icon: "🎨",
          title: "Software de Diseño",
          description: "Licencias de Adobe Creative Suite, AutoCAD, SolidWorks y software especializado para diseño y arquitectura.",
          features: ["Licencias educativas", "Soporte técnico", "Capacitación básica", "Actualizaciones incluidas"]
        }
      ]
    }
  };

  return (
    <section className="services" id="servicesit">
      <div className="container">
        <div className="services-header">
          <h2 className="section-title">Nuestros Servicios Integrales</h2>
          <p className="section-subtitle">
            Byte Fusion Soluciones es tu partner tecnológico completo. Ofrecemos desde desarrollo 
            de software hasta venta de hardware, consultoría especializada y licencias de software, 
            todo bajo un mismo techo para simplificar tu gestión tecnológica.
          </p>
        </div>

        <div className="services-tabs">
          {Object.entries(serviceCategories).map(([key, category]) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              style={{ 
                '--tab-color': category.color,
                borderColor: activeTab === key ? category.color : 'transparent',
                color: activeTab === key ? category.color : '#666'
              }}
            >
              <span className="tab-icon">{category.icon}</span>
              <span className="tab-text">{category.title}</span>
            </button>
          ))}
        </div>

        <div className="services-content">
          <div className="category-header">
            <h3 style={{ color: serviceCategories[activeTab].color }}>
              {serviceCategories[activeTab].icon} {serviceCategories[activeTab].title}
            </h3>
          </div>

          <div className="services-grid">
            {serviceCategories[activeTab].services.map((service, index) => (
              <div 
                key={index} 
                className={`service-card ${service.featured ? 'featured' : ''}`}
                style={{ '--card-color': serviceCategories[activeTab].color }}
              >
                {service.featured && (
                  <div className="featured-badge">
                    ⭐ Producto Estrella
                  </div>
                )}
                <div className="service-icon">{service.icon}</div>
                <h4>{service.title}</h4>
                <p>{service.description}</p>
                
                <div className="service-features">
                  {service.features.map((feature, idx) => (
                    <span key={idx} className="feature-tag">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
                
                <div className="service-actions">
                  <button className="btn-primary">Más Información</button>
                  <button className="btn-secondary">Cotizar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="services-cta">
          <div className="cta-content">
            <h3>¿Necesitas una solución personalizada?</h3>
            <p>
              Nuestro equipo de expertos puede crear un paquete de servicios adaptado 
              específicamente a las necesidades de tu empresa.
            </p>
            <div className="cta-buttons">
              <a href="#contact" className="cta-button primary">Solicitar Consulta Gratuita</a>
            </div>
          </div>
          
          <div className="cta-stats">
            <div className="stat-item">
              <div className="stat-number">200+</div>
              <div className="stat-label">Clientes Satisfechos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Satisfacción Cliente</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Soporte Técnico</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .services {
          width: 100%;
          padding: 80px 20px;
          background: radial-gradient(circle at top left, rgba(0, 212, 255, 0.15), transparent 40%),
                      linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: #e2e8f0;        
  }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .services-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin: 0 0 20px 0;
        }

        .section-subtitle {
          max-width: 900px;
          margin: 0 auto;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #666;
        }

        .services-tabs {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-bottom: 50px;
          flex-wrap: wrap;
          padding: 0 20px;
        }

.tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 15px 25px;
  border-radius: 50px;

  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(8px);

  border: 1px solid rgba(255,255,255,0.1);

  cursor: pointer;
  transition: all 0.3s ease;

  font-weight: 600;
  font-size: 1rem;

  color: #94a3b8;
}

.tab-button:hover {
  transform: translateY(-2px);
  border-color: var(--tab-color);
  color: var(--tab-color);

  box-shadow: 0 0 15px var(--tab-color);
}
.tab-button.active {
  color: var(--tab-color);
  border-color: var(--tab-color);

  background: rgba(255,255,255,0.08);

  box-shadow: 
    0 0 20px var(--tab-color),
    inset 0 0 10px rgba(255,255,255,0.05);
}

        .tab-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        .tab-text {
          font-size: 1rem;
          line-height: 1;
        }

        .services-content {
          width: 100%;
        }

        .category-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .category-header h3 {
          font-size: 2rem;
          font-weight: 600;
          margin: 0;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
          width: 100%;
        }

        .service-card {
          position: relative;
          border-radius: 20px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          overflow: hidden;

          background: rgba(2, 6, 23, 0.9);
          backdrop-filter: blur(12px);

          border: 1px solid rgba(255,255,255,0.08);

          transition: all 0.4s ease;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-color: var(--card-color);
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

          .btn-primary {
          background: var(--card-color);
          color: #020617;
          box-shadow: 0 0 20px var(--card-color);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px var(--card-color);
        }

        .btn-secondary {
          border: 1px solid var(--card-color);
          color: var(--card-color);
        }

        .btn-secondary:hover {
          background: var(--card-color);
          color: #020617;
        }
        .service-card.featured {
          border-color: var(--card-color);
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(0, 123, 255, 0.05));
        }

        .featured-badge {
          position: absolute;
          top: -10px;
          right: 20px;
          background: var(--card-color);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: bold;
          white-space: nowrap;
        }

        .service-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: block;
          line-height: 1;
          font-size: 3rem;
          margin-bottom: 20px;
          filter: drop-shadow(0 0 10px var(--card-color));
        }

        .service-card h4 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0 0 15px 0;
        }

        .service-card p {
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 20px 0;
          flex-grow: 1;
        }

        .service-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 25px;
        }

.feature-tag {
  background: rgba(255,255,255,0.05);
  color: var(--card-color);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(6px);
}

        .service-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }



        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          color: var(--card-color);
          border: 2px solid var(--card-color);
        }

        .btn-secondary:hover {
          background: var(--card-color);
          color: white;
        }

.services-cta {
  position: relative;
  overflow: hidden;

  background: rgba(2, 6, 23, 0.9);
  backdrop-filter: blur(12px);

  border-radius: 25px;
  padding: 50px;

  border: 1px solid rgba(255,255,255,0.08);

  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  align-items: center;
    animation: floatCard 6s ease-in-out infinite;

}
  .services-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 40px #00d4ff;  }

        .cta-content h3 {
  font-size: 2rem;
  margin: 0 0 15px 0;
  color: #e2e8f0;
        }

        .cta-content p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0 0 30px 0;
  color: #94a3b8;
        }

        .cta-buttons {
          display: flex;
          gap: 15px;
        }

        .cta-button {
          padding: 15px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .cta-button.primary {
  background: #00d4ff;
  color: #020617;
  box-shadow: 0 0 25px #00d4ff;
        }

        .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 40px #00d4ff;        
        }

        .cta-stats {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

.stat-item {
  padding: 20px;
  border-radius: 15px;

  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(8px);

  border: 1px solid rgba(255,255,255,0.1);

  transition: 0.3s;
}
  .stat-item:hover {
  transform: translateY(-5px);
  border-color: #00d4ff;
}
.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #00d4ff;
  text-shadow: 0 0 15px #00d4ff;
}

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 10px 0 0 0;
        }

        @media (max-width: 992px) {
          .services-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .services {
            padding: 60px 15px;
          }

          .section-title {
            font-size: 2rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .services-tabs {
            flex-direction: column;
            align-items: stretch;
            padding: 0;
          }
          
          .tab-button {
            width: 100%;
            justify-content: center;
          }
          
          .services-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .services-cta {
            grid-template-columns: 1fr;
            padding: 30px 20px;
          }

          .cta-content h3 {
            font-size: 1.5rem;
          }

          .cta-content p {
            font-size: 1rem;
          }
          
          .cta-buttons {
            flex-direction: column;
          }
          
          .cta-stats {
            flex-direction: row;
            justify-content: space-around;
          }

          .stat-number {
            font-size: 2rem;
          }

          .stat-label {
            font-size: 0.8rem;
          }
            @keyframes floatCard {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}
  @keyframes rotateBorder {
  0% {
    transform: rotate(0deg) scale(1.5);
  }
  100% {
    transform: rotate(360deg) scale(1.5);
  }
}
        }
      `}</style>
    </section>
  );
};

export default Services;