import { useEffect, useState, useRef } from 'react';

// Hook para escribir como máquina de escribir
const useTypewriter = (texts, speed = 50, pauseDuration = 2000) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const textsRef = useRef(Array.isArray(texts) ? texts : [texts]);

  useEffect(() => {
    let timer;
    const currentText = textsRef.current[currentIndex];
    let i = 0;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    if (isTyping) {
      timer = setInterval(() => {
        if (i < currentText.length) {
          setDisplayedText(currentText.substring(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
          setIsTyping(false);
          if (textsRef.current.length > 1) {
            setTimeout(() => setIsTyping(true), pauseDuration);
            setCurrentIndex((prev) => (prev + 1) % textsRef.current.length);
          }
        }
      }, speed);
    } else if (textsRef.current.length > 1) {
      timer = setInterval(() => {
        if (i > 0) {
          setDisplayedText(currentText.substring(0, i - 1));
          i--;
        } else {
          clearInterval(timer);
          setIsTyping(true);
          setCurrentIndex((prev) => (prev + 1) % textsRef.current.length);
        }
      }, speed / 2);
    }

    return () => {
      clearInterval(timer);
      clearInterval(cursorInterval);
    };
  }, [isTyping, currentIndex, speed, pauseDuration]);

  return {
    text: displayedText,
    cursor: showCursor
  };
};

const Hero = () => {
  const titlePhrases = ["Byte Fusion Soluciones"];
  const subtitlePhrases = [
    "¿Necesitas soluciones tecnológicas integrales para tu negocio?",
    "Desarrollo web, facturación electrónica y consultoría IT",
    "Transformamos tu empresa con tecnología de vanguardia"
  ];

  const title = useTypewriter(titlePhrases, 100);
  const subtitle = useTypewriter(subtitlePhrases, 30, 1500);

  return (
    <section className="hero" id="home">
      <div className="hero-container-text-only">
        <div className="hero-content">
          <h1>
            {title.text}
            <span className={`cursor ${title.cursor ? 'visible' : 'hidden'}`}>|</span>
          </h1>
          <p className="typewriter-paragraph">
            {subtitle.text}
            <span className={`cursor ${subtitle.cursor ? 'visible' : 'hidden'}`}>|</span>
          </p>
          <p className="static-text">
            Con <strong>Byte Fusion Soluciones</strong>, accede a un ecosistema completo de servicios tecnológicos.<br />
            Desde desarrollo web hasta facturación electrónica, ofrecemos soluciones inteligentes que impulsan tu crecimiento.
          </p>
          <div className="cta-buttons">
            <a href="#services" className="cta-button">Conocer Servicios</a>
            <a href="/auth/login" className="cta-button cta-secondary">Ir al Facturador</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .hero {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(138, 43, 226, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .hero-container-text-only {
          max-width: 1200px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          text-align: center;
          color: #ffffff;
        }

        h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #00d4ff 0%, #8a2be2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .typewriter-paragraph {
          min-height: 60px;
          margin-bottom: 15px;
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          color: #00d4ff;
          font-weight: 500;
        }

        .static-text {
          opacity: 0;
          animation: fadeIn 1s ease-out 3s forwards;
          font-size: clamp(1rem, 2vw, 1.2rem);
          line-height: 1.8;
          margin-bottom: 40px;
          color: rgba(255, 255, 255, 0.8);
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .static-text strong {
          color: #00d4ff;
          font-weight: 600;
        }

        .cta-buttons {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .cta-button {
          display: inline-block;
          padding: 15px 35px;
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: #0a0e27;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
          border: 2px solid transparent;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 212, 255, 0.5);
        }

        .cta-secondary {
          background: transparent;
          border: 2px solid #00d4ff;
          color: #00d4ff;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2);
        }

        .cta-secondary:hover {
          background: #00d4ff;
          color: #0a0e27;
          box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
        }

        .cursor {
          color: #00d4ff;
          font-weight: bold;
          margin-left: 2px;
          transition: opacity 0.3s;
        }

        .cursor.visible {
          opacity: 1;
        }

        .cursor.hidden {
          opacity: 0;
        }

        @keyframes fadeIn {
          to { opacity: 0.9; }
        }

        @media (max-width: 768px) {
          .hero {
            padding: 40px 20px;
          }

          .cta-buttons {
            flex-direction: column;
            width: 100%;
          }

          .cta-button {
            width: 100%;
            max-width: 300px;
          }

          .static-text {
            font-size: 1rem;
            padding: 0 10px;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;