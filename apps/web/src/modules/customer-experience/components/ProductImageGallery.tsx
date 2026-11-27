import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageGalleryProps {
  images: Array<{ url: string; isPrimary?: boolean; altText?: string }>;
  productName: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
}) => {
  const initialIndex = Math.max(
    0,
    images.findIndex((img) => img.isPrimary)
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const activeImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] w-full bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
        {activeImage?.url ? (
          <img
            src={activeImage.url}
            alt={activeImage.altText || productName}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Package className="w-12 h-12 stroke-[1.5]" aria-hidden="true" />
            <span className="text-xs">No image available</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`aspect-square rounded-md border overflow-hidden bg-white transition-colors ${
                selectedIndex === idx
                  ? 'border-[#E11D30] ring-2 ring-[#E11D30]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `${productName} view ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
