import React from 'react';
import { motion } from 'framer-motion';
const DEFAULT_STEPS = ['Verificando playlist', 'Baixando conteúdo', 'Organizando a tela'];

const SpinnerMark = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-14 w-14' : 'h-9 w-9';

  return (
    <div className={`relative ${sizeClass}`}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-zinc-700 border-t-red-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-[28%] rounded-full bg-red-500/15"
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

const StepRail = ({ steps, activeStep }) => (
  <div className="mt-4 flex items-center gap-2">
    {steps.map((step, index) => {
      const active = index === activeStep;
      const done = index < activeStep;

      return (
        <div key={step} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${active ? 'bg-red-500' : done ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
          <span className={`text-[11px] ${active ? 'text-zinc-100' : done ? 'text-zinc-300' : 'text-zinc-500'}`}>
            {step}
          </span>
        </div>
      );
    })}
  </div>
);

const ModernLoader = ({
  title = 'Carregando',
  subtitle = 'Preparando tudo para você',
  steps = DEFAULT_STEPS,
  activeStep = 0,
  variant = 'full',
  showSteps = true
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={isCompact ? 'flex items-center gap-3' : 'w-full flex items-center justify-center'}>
      <div className={isCompact ? 'flex items-center gap-3' : 'w-full max-w-sm text-center'}>
        <div className={isCompact ? 'shrink-0' : 'mx-auto'}>
          <div className={`${isCompact ? 'rounded-full border border-zinc-800 bg-zinc-950 p-2' : 'rounded-full border border-zinc-800 bg-zinc-950 p-3'}`}>
            <SpinnerMark size={isCompact ? 'sm' : 'lg'} />
          </div>
        </div>

        <div className={isCompact ? 'min-w-0' : 'mt-4'}>
          <p className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-white leading-tight`}>
            {title}
          </p>
          <p className={`${isCompact ? 'text-[11px]' : 'text-sm'} text-zinc-500 mt-1 leading-relaxed`}>
            {subtitle}
          </p>

          {showSteps && isCompact && (
            <div className="mt-2 text-[11px] text-zinc-500">
              {steps[activeStep] || steps[0]}
            </div>
          )}

          {showSteps && !isCompact && (
            <>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full w-1/3 rounded-full bg-red-500/80"
                  animate={{ x: ['-35%', '135%'] }}
                  transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <StepRail steps={steps} activeStep={activeStep} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernLoader;