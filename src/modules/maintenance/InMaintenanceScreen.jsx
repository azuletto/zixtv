import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import favicon from '/favicon.png'; // Importa o favicon corretamente

const InMaintenance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 2);
  returnDate.setHours(20, 0, 0, 0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Efeito do mouse (apenas desktop)
  const handleMouseMove = (e) => {
    if (isMobile) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  // Efeito de onda líquida no toque (mobile)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { id, x, y }]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id));
      }, 800);
    }
  };
  
  const timeRemaining = returnDate - currentTime;
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  const isTimeValid = timeRemaining > 0;
  
  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      className="fixed inset-0 bg-zinc-950 w-full h-full overflow-hidden z-50 cursor-default"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900" />
      
      {/* Elemento decorativo central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
      
      {/* Partículas extremamente discretas no fundo */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0, 30, 0],
              x: [0, 20, -15, 15, 0],
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: 15 + i * 1.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
            className="absolute w-0.5 h-0.5 bg-red-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      {/* Efeito de luz do mouse - APENAS DESKTOP (maior e mais transparente) */}
      {!isMobile && (
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 500px at ${mousePosition.x}px ${mousePosition.y}px, rgba(239, 68, 68, 0.06), transparent 85%)`,
            opacity: mousePosition.x > 0 || mousePosition.y > 0 ? 1 : 0
          }}
        />
      )}
      
      {/* Ondas líquidas no toque (mobile) */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed rounded-full"
            style={{
              left: ripple.x - 50,
              top: ripple.y - 50,
              width: 100,
              height: 100,
              background: `radial-gradient(circle, rgba(239, 68, 68, 0.2), transparent 70%)`,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          />
        ))}
      </AnimatePresence>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg mx-auto"
        >
          {/* Logo Zix TV com animação */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              {/* Anel pulsante ao redor */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-red-500/20"
              />
              {/* Logo - usando a imagem importada */}
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                <img 
                  src={favicon}
                  alt="Zix TV" 
                  className="w-9 h-9 md:w-10 md:h-10 object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-3 tracking-tight"
          >
            Em manutenção
          </motion.h1>

          {/* Versão abaixo do título */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mb-4"
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                ALPHA 1.2.0
              </span>
            </div>
          </motion.div>

          {/* Linha divisória */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-px bg-red-500/40 mx-auto mb-5"
          />

          {/* Descrição */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-zinc-400 text-sm md:text-base text-center mb-8 max-w-sm mx-auto"
          >
            Estamos preparando algo especial para você
          </motion.p>

          {/* Card de informações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-5 md:p-6"
          >
            <div className="text-center">
              {/* Label */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-zinc-500 text-xs uppercase tracking-wider">Previsão de retorno</span>
              </div>
              
              {/* Data */}
              <div className="text-lg md:text-xl font-semibold text-white mb-1.5">
                {returnDate.toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              
              {/* Horário */}
              <div className="text-red-400 text-base md:text-lg font-mono mb-5">
                {returnDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Contador */}
              {isTimeValid && (
                <div className="border-t border-zinc-800 pt-5">
                  <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-xs mx-auto">
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-white font-mono">
                        {String(daysRemaining).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-zinc-500">dias</div>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-white font-mono">
                        {String(hoursRemaining).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-zinc-500">horas</div>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-white font-mono">
                        {String(minutesRemaining).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-zinc-500">min</div>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-red-500 font-mono">
                        {String(secondsRemaining).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-zinc-500">seg</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default InMaintenance;