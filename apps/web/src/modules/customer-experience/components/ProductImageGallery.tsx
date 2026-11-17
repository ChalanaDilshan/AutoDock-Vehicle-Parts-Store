import React, { useState } from 'react';

interface ProductImageGalleryProps {
  images: Array<{
    url: string;
    isPrimary: boolean;
    altText?: string;
  }>;
  productName: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
}) => {
  const fallback =
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80';

  const initialIndex = images.findIndex((img) => img.isPrimary);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const displayImages = images.length > 0 ? images : [{ url: fallback, isPrimary: true, altText: productName }];
  const activeImage = displayImages[selectedIndex] || displayImages[0];

  return (
    <div className="space-y-4">
      {/* Primary Image View */}
      <div className="relative aspect-4/3 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
        <img
          src={activeImage.url}
          alt={activeImage.altText || productName}
          className="w-full h-full object-contain p-4 transition duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
        />
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-slate-100 transition ${
                selectedIndex === idx
                  ? 'border-blue-600 ring-2 ring-blue-500/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallback;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
