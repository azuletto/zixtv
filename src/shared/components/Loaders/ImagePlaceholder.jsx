import React from 'react';

const VARIANT_CLASS = {
  card: 'rounded-lg',
  square: 'rounded-md',
  list: 'rounded-lg',
  banner: 'rounded-none',
  avatar: 'rounded-full'
};

const ImagePlaceholder = ({
  variant = 'card',
  className = '',
  showLabel = false,
  label = 'Sem Imagem'
}) => {
  const rounded = VARIANT_CLASS[variant] || VARIANT_CLASS.card;

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 24%, rgba(220, 38, 38, 0.20), transparent 26%),
            radial-gradient(circle at 78% 30%, rgba(255, 255, 255, 0.08), transparent 22%),
            radial-gradient(circle at 62% 74%, rgba(220, 38, 38, 0.12), transparent 28%)
          `
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center px-3">
          <span className="rounded-md border border-zinc-700 bg-zinc-900/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-300">
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImagePlaceholder;
