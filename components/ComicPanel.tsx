import React from 'react';
import { GeneratedPanel } from '../types';

interface Props {
  panel: GeneratedPanel;
}

const ComicPanel: React.FC<Props> = ({ panel }) => {
  if (!panel.imageUrl) return null;

  const isEven = panel.panelId % 2 === 0;
  const hasNarration = !!panel.narration;
  
  // Dynamic positioning to prevent overlap
  // If there is narration at the top, force speech bubble to the bottom
  const bubblePositionClass = hasNarration 
    ? (isEven ? 'bottom-6 right-4' : 'bottom-6 left-4')
    : (isEven ? 'bottom-6 right-4' : 'top-6 left-4');

  // Tail logic: 
  // If bubble is at bottom, tail should point UP (towards the scene).
  // If bubble is at top, tail should point DOWN.
  const isBubbleAtBottom = hasNarration || isEven;
  
  return (
    <div className="relative w-full max-w-xl mx-auto mb-10 group px-2">
      {/* The Image */}
      <div className="w-full rounded-sm overflow-hidden shadow-2xl bg-white border-2 border-stone-900 relative">
        <img 
          src={`data:image/jpeg;base64,${panel.imageUrl}`} 
          alt={panel.visualDescription}
          className="w-full h-auto block"
          loading="lazy"
        />
        
        {/* Subtle vignette for cinematic feel */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none"></div>
      </div>

      {/* Dialogue Bubbles */}
      {panel.dialogue && (
        <div className={`
            absolute 
            ${bubblePositionClass} 
            max-w-[75%] 
            z-30 
            transform 
            transition-transform 
            duration-500 
            hover:scale-[1.02]
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
                        ? '-top-2 border-t-2 border-l-2 transform rotate-45 left-6' // Points Up
                        : '-bottom-2 border-b-2 border-r-2 transform rotate-45 left-6' // Points Down
                    }
                `}></div>
            </div>
        </div>
      )}

      {/* Narration Box */}
      {panel.narration && (
        <div className="absolute top-5 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none">
             <div className="bg-[#fefce8] border-2 border-stone-900 px-5 py-3 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] max-w-[95%] transform -rotate-1 pointer-events-auto">
                <p className="text-xs md:text-sm font-bold font-comic text-stone-800 uppercase tracking-widest text-center leading-relaxed">
                    {panel.narration}
                </p>
             </div>
        </div>
      )}
    </div>
  );
};

export default ComicPanel;