import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView';
import GenerationView from './components/GenerationView';
import ComicPanel from './components/ComicPanel';
import { Character, GeneratedPanel, GenerationStage, WebtoonState, ArtStyle } from './types';
import { generateWebtoonScript, generatePanelImage } from './services/openai';
import { Share2, RefreshCw } from 'lucide-react';

export default function App() {
  // Application State
  const [state, setState] = useState<WebtoonState>({
    step: 'input',
    story: '',
    characters: [],
    title: '',
    panels: [],
    currentGenerationIndex: 0,
    artStyle: 'Webtoon'
  });

  const [stage, setStage] = useState<GenerationStage>(GenerationStage.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setState(prev => ({
        ...prev,
        step: 'input',
        title: '',
        panels: [],
        currentGenerationIndex: 0
    }));
    setStage(GenerationStage.IDLE);
    setError(null);
  };

  const generateComic = useCallback(async () => {
    if (!state.story) return;

    setStage(GenerationStage.WRITING_SCRIPT);
    setState(prev => ({ ...prev, step: 'generating', panels: [] }));
    setError(null);

    // Generate a fixed seed for this entire comic session to ensure style/character consistency
    const consistencySeed = Math.floor(Math.random() * 1000000);

    try {
      // 1. Generate Script
      const scriptData = await generateWebtoonScript(state.story, state.characters);

      const initialPanels: GeneratedPanel[] = scriptData.panels.map(p => ({
        ...p,
        imageUrl: '',
        status: 'pending'
      }));

      setState(prev => ({
        ...prev,
        title: scriptData.title,
        panels: initialPanels
      }));

      setStage(GenerationStage.DRAWING_PANELS);

      // 2. Generate Images sequentially
      const updatedPanels = [...initialPanels];
      const mainCharacter = state.characters.length > 0 ? state.characters[0] : undefined;

      for (let i = 0; i < updatedPanels.length; i++) {
        updatedPanels[i].status = 'generating';
        setState(prev => ({ ...prev, panels: [...updatedPanels], currentGenerationIndex: i }));

        try {
            const base64Image = await generatePanelImage(
                updatedPanels[i].visualDescription, 
                state.artStyle,
                mainCharacter,
                consistencySeed // Pass the shared seed
            );
            updatedPanels[i].imageUrl = base64Image;
            updatedPanels[i].status = 'complete';
        } catch (e) {
            console.error(`Failed to generate panel ${i}`, e);
            updatedPanels[i].status = 'error';
        }
        
        setState(prev => ({ ...prev, panels: [...updatedPanels] }));
      }

      setStage(GenerationStage.FINALIZING);
      setTimeout(() => {
          setState(prev => ({ ...prev, step: 'complete' }));
      }, 800);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong generating the comic.");
      setState(prev => ({ ...prev, step: 'input' }));
    }
  }, [state.story, state.characters, state.artStyle]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20 selection:bg-stone-200 selection:text-stone-900 transition-colors duration-500 font-sans">
      <Header />

      <main className="container mx-auto max-w-4xl">
        {state.step === 'input' && (
          <LandingView 
            story={state.story} 
            setStory={(s) => setState(prev => ({ ...prev, story: s }))}
            characters={state.characters}
            setCharacters={(chars) => setState(prev => ({ ...prev, characters: chars as Character[] }))}
            artStyle={state.artStyle}
            setArtStyle={(s) => setState(prev => ({ ...prev, artStyle: s }))}
            onGenerate={generateComic}
            isGenerating={stage !== GenerationStage.IDLE}
          />
        )}

        {state.step === 'generating' && (
          <GenerationView 
            stage={stage} 
            panels={state.panels} 
            title={state.title} 
          />
        )}

        {state.step === 'complete' && (
          <div className="animate-in fade-in duration-1000 px-4 py-8">
             {/* Result Header */}
             <div className="text-center mb-12 space-y-3">
                <h2 className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">Production Complete</h2>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900">{state.title}</h1>
                <div className="flex justify-center gap-2 mt-4">
                    <span className="text-[10px] uppercase tracking-wider px-3 py-1 bg-white rounded-full text-stone-500 border border-stone-200 shadow-sm">{state.artStyle}</span>
                </div>
             </div>

             {/* Comic Strip */}
             <div className="flex flex-col items-center bg-stone-50 min-h-screen gap-0">
                {state.panels.map((panel) => (
                    <ComicPanel key={panel.panelId} panel={panel} />
                ))}
             </div>

             {/* Footer Actions */}
             <div className="max-w-xl mx-auto mt-20 pt-10 border-t border-stone-200 flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-700 font-medium transition-all text-sm uppercase tracking-wide"
                >
                    <RefreshCw size={16} />
                    Create New
                </button>
                <button className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-stone-900 hover:bg-black text-white font-medium transition-all shadow-xl shadow-stone-900/10 text-sm uppercase tracking-wide">
                    <Share2 size={16} />
                    Share Story
                </button>
             </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-stone-800 border border-stone-200 px-6 py-4 rounded shadow-2xl z-50 flex items-center gap-4">
                <p className="font-medium text-sm">{error}</p>
                <button onClick={() => setError(null)} className="hover:bg-stone-100 rounded-full p-1 transition-colors">
                    <RefreshCw size={14} />
                </button>
            </div>
        )}
      </main>
    </div>
  );
}