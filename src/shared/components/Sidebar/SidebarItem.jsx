
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFocusable } from '../../hooks/useFocusable';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to, 
  isCollapsed, 
  badge, 
  onClick,
  active,
  solidIcon: SolidIcon,
  highlight = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const itemRef = React.useRef(null);

  // Integração com navegação por teclado
  const uniqueId = `sidebar-item-${to || label}`;
  const { isFocused } = useFocusable(uniqueId, {
    group: 'sidebar-menu',
    onSelect: () => {
      if (itemRef.current) {
        itemRef.current.click();
      }
    },
  });

  const content = (
    <motion.div
      ref={itemRef}
      whileHover={{ x: isCollapsed ? 0 : 4 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        sidebar-item flex items-center px-3 py-2.5 rounded-xl border border-transparent transition-all duration-200 relative cursor-pointer
        ${active 
          ? 'border-red-500 bg-red-600 text-white scale-[1.02] shadow-xl shadow-red-500/20' 
          : highlight
            ? 'text-red-400 hover:border-red-500 hover:bg-zinc-800/90 hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10'
            : isFocused
              ? 'border-red-500 bg-zinc-800/90 text-white scale-[1.02] shadow-lg shadow-red-500/10'
              : 'text-zinc-500 hover:border-red-500 hover:bg-zinc-800/90 hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      {}
      <motion.div
        animate={{ rotate: isHovered || active ? 0 : 0 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {isHovered || active ? (
          SolidIcon ? (
            <SolidIcon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} transition-transform ${isHovered ? 'scale-110' : ''}`} />
          ) : (
            <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} transition-transform ${isHovered ? 'scale-110' : ''}`} />
          )
        ) : (
          <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
        )}
      </motion.div>
      
      {!isCollapsed && (
        <>
          <span className={`text-sm font-medium flex-1 transition-colors ${active ? 'text-white' : ''}`}>
            {label}
          </span>
          
          {badge && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                active ? 'bg-white text-red-600' : 'bg-red-600/20 text-red-500'
              }`}
            >
              {badge}
            </motion.span>
          )}
        </>
      )}

      {isCollapsed && badge && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full shadow-lg"
        >
          {badge}
        </motion.span>
      )}

      {}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-zinc-700">
          {label}
        </div>
      )}
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full">
        {content}
      </button>
    );
  }

  return (
    <NavLink to={to} className="block">
      {({ isActive }) => (
        React.cloneElement(content, { 
          active: isActive || active 
        })
      )}
    </NavLink>
  );
};

export const ExpandableSidebarItem = ({ 
  icon, 
  label, 
  isCollapsed, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800/40 transition-all duration-200
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        {React.cloneElement(icon, { 
          className: `w-5 h-5 transition-transform ${isCollapsed ? '' : 'mr-3'} ${isOpen ? 'text-red-500' : ''}` 
        })}
        
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{label}</span>
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-3 h-3 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </>
        )}
      </button>

      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className={`${isCollapsed ? 'pl-0' : 'pl-8'} py-1 space-y-1`}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const SidebarDivider = ({ isCollapsed }) => (
  <div className={`my-4 ${isCollapsed ? 'px-3' : 'px-4'}`}>
    <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
  </div>
);

export const SidebarSectionHeader = ({ label, isCollapsed }) => {
  if (isCollapsed) {
    return (
      <div className="px-3 py-2">
        <div className="w-1 h-4 bg-gradient-to-b from-red-600 to-red-700 rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export const SidebarProgressItem = ({ icon, label, progress, isCollapsed }) => (
  <div className={`px-3 py-2 ${isCollapsed ? 'text-center' : ''}`}>
    {isCollapsed ? (
      <div className="relative group">
        <div className="bg-zinc-800/40 rounded-xl p-2 group-hover:bg-zinc-700/40 transition-all duration-200">
          {React.cloneElement(icon, { className: 'w-5 h-5 mx-auto text-zinc-500 group-hover:text-red-500 transition-colors' })}
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] flex items-center justify-center text-white font-medium shadow-lg">
          {Math.round(progress)}%
        </div>
      </div>
    ) : (
      <div className="bg-gradient-to-r from-zinc-800/20 to-transparent rounded-xl p-3 border border-zinc-800/20 hover:border-red-600/20 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {React.cloneElement(icon, { className: 'w-4 h-4 mr-2 text-red-500' })}
            <span className="text-xs text-zinc-300 font-medium">{label}</span>
          </div>
          <span className="text-xs text-red-500 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full"
          />
        </div>
      </div>
    )}
  </div>
);

export default SidebarItem;
