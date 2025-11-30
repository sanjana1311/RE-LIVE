
import React from 'react';
import { GeneratedPanel } from '../types';
import { RefreshCw, Download } from 'lucide-react';

interface Props {
  panel: GeneratedPanel;
  onRegenerate: (id: number) => void;
  onDownload: (id: number) => void;
}

const ComicPanel: React.FC<Props> = ({ panel, onRegenerate, onDownload }) => {
  if (!panel.imageUrl && panel.status !== 'generating') return null;

  const isEven = panel.panelId % 2 === 0;
  const hasNarration = !!panel.narration;
  const isGenerating = panel.status === 'generating';
  
  // Dynamic positioning to prevent overlap
  const bubblePositionClass = hasNarration 
    ? (isEven ? 'bottom-6 right-4' : 'bottom-6 left-4')
    : (isEven ? 'bottom-6 right-4' : 'top-6 left-4');

  const isBubbleAtBottom = hasNarration || isEven;
  
  return (
    <div className="relative w-full max-w-xl mx-auto mb-16 group px-2 comic-panel-container">
      
      {/* 
         WRAPPER ID FOR HTML2CANVAS 
         We removed transition/animation classes from this specific div 
         to ensure the screenshot capture is stable and doesn't render a blank state.
      */}
      <div 
        id={`panel-container-${panel.panelId}`}
        className="w-full rounded-sm bg-white border-2 border-stone-900 relative shadow-xl overflow-hidden"
      >
        
        {/* The Image */}
        <div className="relative overflow-hidden aspect-[3/4] bg-stone-100">
            {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 z-10 gap-3">
                    <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Redrawing...</span>
                </div>
            ) : (
                <img 
                  src={`data:image/jpeg;base64,${panel.imageUrl}`} 
                  alt={panel.visualDescription}
                  className="w-full h-full object-cover block"
                  // Vital: No loading="lazy", No crossOrigin for Data URIs
                />
            )}
            
            {/* Subtle vignette layer */}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none"></div>
        </div>

        {/* Dialogue Bubbles */}
        {!isGenerating && panel.dialogue && (
            <div className={`
                absolute 
                ${bubblePositionClass} 
                max-w-[75%] 
                z-30 
            `}>
                <div className="relative bg-white text-stone-900 p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(28,25,23,0.15)] font-comic border-2 border-stone-900 text-sm md:text-base leading-snug">
                    <p>
                        {panel.speaker && <span className="block text-[10px] text-stone-500 font-bold uppercase mb-1 tracking-wider">{panel.speaker}</span>}
                        {panel.dialogue}
                    </p>
                    
                    {/* Bubble Tail */}
                    <div className={`
                        absolute w-4 h-4 bg-white border-stone-900
                        ${isBubbleAtBottom 
                            ? '-top-2 border-t-2 border-l-2 transform rotate-45 left-6' 
                            : '-bottom-2 border-b-2 border-r-2 transform rotate-45 left-6'
                        }
                    `}></div>
                </div>
            </div>
        )}

        {/* Narration Box */}
        {!isGenerating && panel.narration && (
            <div className="absolute top-5 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none">
                <div className="bg-[#fefce8] border-2 border-stone-900 px-5 py-3 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] max-w-[95%] transform -rotate-1 pointer-events-auto">
                    <p className="text-xs md:text-sm font-bold font-comic text-stone-800 uppercase tracking-widest text-center leading-relaxed">
                        {panel.narration}
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* Action Bar (Below Panel) - Explicitly ignored by html2canvas via data attribute */}
      <div 
        className="flex items-center justify-between mt-3 px-1"
        data-html2canvas-ignore="true" 
      >
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Panel {panel.panelId}</span>
         </div>
         
         <div className="flex items-center gap-2">
             <button 
                onClick={() => onRegenerate(panel.panelId)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-400 hover:text-stone-900 transition-all disabled:opacity-50"
             >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                {isGenerating ? "Fixing..." : "Regenerate"}
             </button>

             <button 
                onClick={() => onDownload(panel.panelId)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-400 hover:text-stone-900 transition-all disabled:opacity-50"
             >
                <Download size={12} />
                Save Image
             </button>
         </div>
      </div>

    </div>
  );
};

export default ComicPanel;
