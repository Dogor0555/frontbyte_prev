import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const emailTemplate = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;">
        <div style="background:#0f0f0f;padding:20px;text-align:center;margin-bottom:20px;">
          <h1 style="color:#fff;margin:0;font-size:24px;">NUEVO MENSAJE - BYTEFUSION</h1>
        </div>
        <div style="background:#fff;padding:20px;border-radius:5px;">
          <p><strong style="color:#7e00ff;">Nombre:</strong> ${formData.name}</p>
          <p><strong style="color:#7e00ff;">Email:</strong> ${formData.email}</p>
          <p><strong style="color:#7e00ff;">Mensaje:</strong> ${formData.message}</p>
        </div>
        <div style="margin-top:20px;text-align:center;font-size:12px;color:#777;">
          <p>Enviado desde <a href="https://bytefusionsv.com" style="color:#7e00ff;">bytefusionsv.com</a></p>
        </div>
      </div>
      `;

      const response = await fetch('https://formsubmit.co/ajax/gerencia@bytefusionsv.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          _subject: '🚀 Nuevo Mensaje - ByteFusion Soluciones',
          _template: 'custom',
          _template_content: emailTemplate,
          _replyto: formData.email,
          _autoresponse: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <div style="background:#0f0f0f;padding:20px;text-align:center;">
                <h2 style="color:#fff;margin:0;">BYTEFUSION SOLUCIONES</h2>
              </div>
              <div style="background:#fff;padding:20px;">
                <p>Hola ${formData.name},</p>
                <p>Hemos recibido tu mensaje:</p>
                <blockquote style="border-left:3px solid #7e00ff;padding-left:15px;margin:15px 0;">
                  ${formData.message}
                </blockquote>
                <p>Nos pondremos en contacto contigo pronto.</p>
              </div>
            </div>
          `,
          _blacklist: 'no-reply, test, example.com'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="tech-grid"></div>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>
      
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">¿Listo para Innovar?</h2>
          <p className="section-subtitle">
            Completa el formulario y nuestro equipo se pondrá en contacto contigo para llevar 
            tu proyecto al siguiente nivel con soluciones tecnológicas a medida.
          </p>
        </div>
        
        {submitStatus === 'success' && (
          <div className="alert alert-success">
            <div className="alert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="alert-content">
              <h3>MENSAJE ENVIADO CON ÉXITO</h3>
              <p>Hemos recibido tu solicitud. Te contactaremos en menos de 24 horas.</p>
            </div>
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="alert alert-error">
            <div className="alert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="alert-content">
              <h3>ERROR AL ENVIAR</h3>
              <p>
                Ocurrió un error al enviar tu mensaje. Por favor intenta nuevamente o contáctanos 
                directamente a <span className="email-link">gerencia@bytefusionsv.com</span>
              </p>
            </div>
          </div>
        )}

        <div className="contact-form">
          <div className="form-group">
            <label htmlFor="name">
              <span className="label-icon">👤</span>
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ej: Carlos Martínez"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <span className="label-icon">📧</span>
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Ej: contacto@empresa.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="message">
              <span className="label-icon">💬</span>
              Mensaje
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Describe tu proyecto, necesidades o consulta..."
              rows={6}
              value={formData.message}
              onChange={handleChange}
            />
          </div>
          
          <button 
            onClick={handleSubmit}
            className="submit-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                ENVIANDO...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ENVIAR MENSAJE
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .contact {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 100px 20px;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          overflow: hidden;
        }

        .tech-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.5;
        }

        .glow-orb {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.2;
          pointer-events: none;
          animation: float 8s ease-in-out infinite;
        }

        .glow-orb-1 {
          top: -200px;
          left: -200px;
          background: radial-gradient(circle, #7e00ff 0%, transparent 70%);
        }

        .glow-orb-2 {
          bottom: -200px;
          right: -200px;
          background: radial-gradient(circle, #00d4ff 0%, transparent 70%);
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
        }

        .container {
          max-width: 700px;
          margin: 0 auto;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 3rem;
          font-weight: 800;
          margin: 0 0 20px 0;
          background: linear-gradient(90deg, #00d4ff 0%, #7e00ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .section-subtitle {
          font-size: 1.1rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .alert {
          background: rgba(30, 30, 30, 0.8);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: flex-start;
          gap: 20px;
          animation: slideDown 0.5s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .alert-success {
          border: 1px solid rgba(0, 212, 255, 0.4);
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.2);
        }

        .alert-error {
          border: 1px solid rgba(255, 71, 87, 0.4);
          box-shadow: 0 0 30px rgba(255, 71, 87, 0.2);
        }

        .alert-icon {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .alert-success .alert-icon {
          background: rgba(0, 212, 255, 0.1);
          color: #00d4ff;
        }

        .alert-error .alert-icon {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content h3 {
          margin: 0 0 8px 0;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .alert-success .alert-content h3 {
          color: #00d4ff;
        }

        .alert-error .alert-content h3 {
          color: #ff4757;
        }

        .alert-content p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
        }

        .email-link {
          color: #00d4ff;
          font-weight: 600;
        }

        .contact-form {
          background: rgba(30, 30, 30, 0.7);
          padding: 40px;
          border-radius: 20px;
          border: 1px solid rgba(0, 212, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .form-group {
          margin-bottom: 30px;
        }

        .form-group:last-of-type {
          margin-bottom: 40px;
        }

        label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          font-weight: 600;
        }

        .label-icon {
          font-size: 1.2rem;
        }

        input,
        textarea {
          width: 100%;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid rgba(0, 212, 255, 0.3);
          background: rgba(15, 15, 15, 0.8);
          color: #ffffff;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
          outline: none;
        }

        input:focus,
        textarea:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
          background: rgba(15, 15, 15, 0.95);
        }

        input::placeholder,
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        textarea {
          resize: vertical;
          min-height: 150px;
          line-height: 1.6;
        }

        .submit-button {
          width: 100%;
          padding: 18px 40px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(90deg, #7e00ff 0%, #00d4ff 100%);
          color: #ffffff;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 0 30px rgba(126, 0, 255, 0.4);
          position: relative;
          overflow: hidden;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .submit-button:hover::before {
          left: 100%;
        }

        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(126, 0, 255, 0.6);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-button svg {
          width: 20px;
          height: 20px;
        }

        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .contact {
            padding: 60px 15px;
          }

          .section-title {
            font-size: 2rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }

          .contact-form {
            padding: 30px 25px;
          }

          .alert {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .alert-icon {
            width: 60px;
            height: 60px;
          }
        }

        @media (max-width: 480px) {
          .section-title {
            font-size: 1.75rem;
          }

          .contact-form {
            padding: 25px 20px;
          }

          input,
          textarea {
            padding: 14px 16px;
            font-size: 0.95rem;
          }

          .submit-button {
            padding: 16px 32px;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Contact;