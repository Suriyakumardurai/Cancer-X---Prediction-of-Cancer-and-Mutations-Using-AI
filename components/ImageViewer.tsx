import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { ImageAnalysis } from '../types';

interface ImageViewerProps {
  imageUrl: string;
  analysis?: ImageAnalysis;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, analysis }) => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (imgRef.current && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const img = imgRef.current;
        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        if (imgAspectRatio > containerAspectRatio) {
            setImgDimensions({
                width: containerWidth,
                height: containerWidth / imgAspectRatio,
            });
        } else {
            setImgDimensions({
                width: containerHeight * imgAspectRatio,
                height: containerHeight,
            });
        }
      }
    };
    
    const imgElement = imgRef.current;
    if (imgElement) {
        const handleLoad = () => updateDimensions();
        imgElement.addEventListener('load', handleLoad);
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        if(imgElement.complete && imgElement.naturalWidth > 0) {
            handleLoad();
        }
    
        return () => {
          imgElement.removeEventListener('load', handleLoad);
          resizeObserver.disconnect();
        };
    }
  }, [imageUrl]);
  
  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex-shrink-0 mb-6">
         <p className="text-sm font-medium text-teal-600 mb-1">Scan Analysis</p>
         <h2 className="text-2xl md:text-3xl font-bold text-stone-800">{`Displaying findings for: ${analysis?.fileName}`}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow h-full min-h-0">
        <div ref={containerRef} className="lg:col-span-2 relative w-full h-full bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Medical Scan"
            className="object-contain"
            style={{ width: imgDimensions.width, height: imgDimensions.height }}
          />
          {showOverlay && analysis && imgDimensions.width > 0 && (
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: imgDimensions.width, height: imgDimensions.height }}
              viewBox={`0 0 ${imgDimensions.width} ${imgDimensions.height}`}
            >
              {analysis.regionsOfInterest?.map((box, index) => {
                const x = box.x_min * imgDimensions.width;
                const y = box.y_min * imgDimensions.height;
                const width = (box.x_max - box.x_min) * imgDimensions.width;
                const height = (box.y_max - box.y_min) * imgDimensions.height;
                const probabilityPercent = (box.probability * 100).toFixed(0);

                return (
                  <g key={index}>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      className="fill-teal-500/20 stroke-teal-400"
                      strokeWidth="2"
                    />
                     <text
                      x={x + 5}
                      y={y + 18}
                      className="fill-white text-[10px] sm:text-[12px] font-semibold"
                      style={{paintOrder: "stroke", stroke: "#000", strokeWidth: "2px", strokeLinejoin: "round"}}
                    >
                      {`${box.label}: ${probabilityPercent}%`}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        
        <div className="lg:col-span-1 bg-white border border-stone-200 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-stone-700 mb-4 flex-shrink-0">Analysis Details</h3>
            <div className="flex-grow space-y-5 overflow-y-auto light-scrollbar pr-2">
                <div>
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Scan Description</h4>
                    <p className="text-sm text-stone-600 mt-1">{analysis?.imageDescription || 'N/A'}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Findings Summary</h4>
                    <p className="text-sm text-stone-600 mt-1">{analysis?.findingsSummary || 'No summary available.'}</p>
                </div>
            </div>
            <div className="mt-6 flex-shrink-0 border-t border-teal-500/20 pt-4">
                <label htmlFor="toggle-overlay" className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-stone-700">AI Overlay</span>
                    <div className="relative">
                    <input
                        type="checkbox"
                        id="toggle-overlay"
                        className="sr-only peer"
                        checked={showOverlay}
                        onChange={() => setShowOverlay(!showOverlay)}
                    />
                    <div className="block bg-stone-300 w-14 h-8 rounded-full peer-checked:bg-teal-600 transition"></div>
                    <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};