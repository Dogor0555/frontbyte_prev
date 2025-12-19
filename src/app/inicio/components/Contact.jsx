

"use client";
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
    // Template simplificado pero efectivo
    const emailTemplate = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;">
      <div style="background:#0f0f0f;padding:20px;text-align:center;margin-bottom:20px;">
        <h1 style="color:#fff;margin:0;font-size:24px;">NUEVO MENSAJE - BYTEFUSION</h1>
      </div>
      <div style="background:#fff;padding:20px;border-radius:5px;">
        <p><strong style="color:#7e00ff;">Nombre:</strong> {{name}}</p>
        <p><strong style="color:#7e00ff;">Email:</strong> {{email}}</p>
        <p><strong style="color:#7e00ff;">Mensaje:</strong> {{message}}</p>
      </div>
      <div style="margin-top:20px;text-align:center;font-size:12px;color:#777;">
        <p>Enviado el {{date}} desde <a href="https://bytefusionsv.com" style="color:#7e00ff;">bytefusionsv.com</a></p>
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
    <section className="contact" id="contact" style={{
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      color: '#fff',
      padding: '4rem 0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h2 className="section-title" style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #00d4ff 0%, #7e00ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>¿Listo para Innovar?</h2>
        
        <p style={{
          fontSize: '1.1rem',
          textAlign: 'center',
          marginBottom: '3rem',
          color: '#b0b0b0',
          maxWidth: '700px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.6'
        }}>Completa el formulario y nuestro equipo se pondrá en contacto contigo para llevar tu proyecto al siguiente nivel con soluciones tecnológicas a medida.</p>
        
        {submitStatus === 'success' && (
          <div style={{
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.5)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            backdropFilter: 'blur(5px)',
            animation: 'neon-pulse 2s infinite alternate'
          }}>
            <h3 style={{
              color: '#00d4ff',
              marginBottom: '0.5rem',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MENSAJE ENVIADO CON ÉXITO
            </h3>
            <p style={{ color: '#e0e0e0', margin: 0, fontSize: '0.95rem' }}>
              Hemos recibido tu solicitud. Te contactaremos en menos de 24 horas.
            </p>
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.5)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(255, 71, 87, 0.3)',
            backdropFilter: 'blur(5px)'
          }}>
            <h3 style={{
              color: '#ff4757',
              marginBottom: '0.5rem',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ERROR AL ENVIAR
            </h3>
            <p style={{ color: '#e0e0e0', margin: 0, fontSize: '0.95rem' }}>
              Ocurrió un error al enviar tu mensaje. Por favor intenta nuevamente o contáctanos directamente a <span style={{ color: '#00d4ff' }}>gerencia@bytefusionsv.com</span>
            </p>
          </div>
        )}

        <form 
          className="contact-form" 
          onSubmit={handleSubmit}
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            background: 'rgba(30, 30, 30, 0.7)',
            padding: '2.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="form-group" style={{ marginBottom: '1.8rem' }}>
            <label htmlFor="name" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b0b0b0',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ej: Carlos Martínez"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(15, 15, 15, 0.8)',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.8rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b0b0b0',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Ej: contacto@empresa.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(15, 15, 15, 0.8)',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label htmlFor="message" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b0b0b0',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>Mensaje</label>
            <textarea
              id="message"
              name="message"
              placeholder="Describe tu proyecto, necesidades o consulta..."
              rows="6"
              value={formData.message}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(15, 15, 15, 0.8)',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                resize: 'vertical',
                minHeight: '150px'
              }}
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="cta-button"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(90deg, #7e00ff 0%, #00d4ff 100%)',
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(126, 0, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem'
            }}
          >
            {isSubmitting ? (
              <>
                <span style={{ 
                  display: 'inline-block', 
                  width: '18px', 
                  height: '18px', 
                  border: '3px solid rgba(255,255,255,0.3)', 
                  borderTopColor: '#fff', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></span>
                ENVIANDO...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ENVIAR MENSAJE
              </>
            )}
          </button>
        </form>
      </div>

      {/* Efectos de fondo */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '0',
        opacity: '0.1',
        background: `
          radial-gradient(circle at 20% 30%, rgba(126, 0, 255, 0.8) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(0, 212, 255, 0.8) 0%, transparent 40%),
          linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)
        `,
        pointerEvents: 'none'
      }}></div>

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes neon-pulse {
          0% { box-shadow: 0 0 15px rgba(0, 212, 255, 0.3); }
          100% { box-shadow: 0 0 25px rgba(0, 212, 255, 0.6); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Contact;