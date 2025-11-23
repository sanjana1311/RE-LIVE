
import React from 'react';
import { GeneratedPanel, GenerationStage } from '../types';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  stage: GenerationStage;
  panels: GeneratedPanel[];
  title: string;
}

const GenerationView: React.FC<Props> = ({ stage, panels, title }) => {
  
  const getStageMessage = () => {
    switch(stage) {
        case GenerationStage.WRITING_SCRIPT: return "Bringing your memory to life...";
        case GenerationStage.DRAWING_PANELS: return "Illustrating Panels...";
        case GenerationStage.FINALIZING: return "Typesetting Dialogue...";
        default: return "Initializing...";
    }
  };

  const completedCount = panels.filter(p => p.status === 'complete').length;
  const totalCount = panels.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 max-w-md mx-auto text-center space-y-10">
      
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-stone-200 shadow-sm relative z-10">
           {stage === GenerationStage.WRITING_SCRIPT ? (
             <span className="text-2xl grayscale">✍️</span>
           ) : (
             <span className="text-2xl grayscale">🎨</span>
           )}
        </div>
        <div className="absolute inset-0 bg-stone-400/20 blur-xl rounded-full animate-pulse" />
      </div>

      <div className="space-y-3 w-full">
        <h3 className="text-xl font-serif font-bold text-stone-900">
            {getStageMessage()}
        </h3>
        {title && <p className="text-stone-500 font-medium font-serif italic">"{title}"</p>}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 rounded-full h-1 overflow-hidden">
        <div 
            className="bg-stone-900 h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-3 w-full mt-4">
        {panels.map((panel, idx) => (
            <div 
                key={idx} 
                className={`aspect-square rounded border border-stone-100 flex items-center justify-center overflow-hidden bg-white relative transition-all duration-300 ${panel.status === 'generating' ? 'ring-1 ring-stone-900' : ''} shadow-sm`}
            >
                {panel.status === 'complete' ? (
                   <img src={`data:image/jpeg;base64,${panel.imageUrl}`} className="w-full h-full object-cover opacity-80 grayscale-[0.2]" alt="" />
                ) : panel.status === 'generating' ? (
                    <Loader2 className="text-stone-900 w-4 h-4 animate-spin" />
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                )}
                
                {panel.status === 'complete' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
                        <CheckCircle2 className="text-stone-900 w-5 h-5 fill-white" />
                    </div>
                )}
            </div>
        ))}
      </div>
      
      <p className="text-stone-400 text-xs tracking-wide uppercase">
        Weaving your memories into scenes...
      </p>
    </div>
  );
};

export default GenerationView;
