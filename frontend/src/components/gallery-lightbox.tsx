'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/api';

interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  type: 'PHOTO' | 'VIDEO';
  url: string;
}

interface GalleryLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function GalleryLightbox({ items, currentIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const item = items[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < items.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, items.length, onClose, onNavigate]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/10 z-10"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
            onClick={() => onNavigate(currentIndex - 1)}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {currentIndex < items.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
            onClick={() => onNavigate(currentIndex + 1)}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}

        <div className="flex items-center justify-center">
          {item.type === 'PHOTO' ? (
            <img
              src={getImageUrl(item.url)}
              alt={item.title || 'Gallery image'}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
          ) : (
            <video
              src={getImageUrl(item.url)}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full rounded-lg"
            />
          )}
        </div>

        {(item.title || item.description) && (
          <div className="mt-4 text-center">
            {item.title && <h3 className="text-white text-lg font-semibold">{item.title}</h3>}
            {item.description && <p className="text-white/70 text-sm mt-1">{item.description}</p>}
          </div>
        )}

        <div className="mt-3 text-center text-white/50 text-sm">
          {currentIndex + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
