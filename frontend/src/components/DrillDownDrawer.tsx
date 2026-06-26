import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
}

export default function DrillDownDrawer({ open, onClose, title, subtitle, children, width = 520 }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(11,31,58,0.35)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width, maxWidth: '95vw', zIndex: 201,
          background: '#ffffff',
          boxShadow: '-4px 0 32px rgba(0,30,60,0.16)',
          transform: open ? 'translateX(0)' : `translateX(${width}px)`,
          transition: 'transform 0.3s cubic-bezier(0.32, 0, 0.15, 1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0 sticky top-0 z-10"
          style={{ background: '#ffffff', borderBottom: '1px solid #f0f4f8' }}
        >
          <div>
            {title && (
              <h2 className="text-base font-bold" style={{ color: '#0d1f30' }}>{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0 ml-4"
            style={{ color: '#8ba3be', background: '#f0f4f8' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5eaf0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f0f4f8'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
