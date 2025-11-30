
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView';
import GenerationView from './components/GenerationView';
import ComicPanel from './components/ComicPanel';
import MemoriesView from './components/MemoriesView';
import { Character, GeneratedPanel, GenerationStage, WebtoonState, SavedStory } from './types';
import { generateWebtoonScript, generatePanelImage } from './services/gemini';
import { saveMemory } from './services/storage';
import { Share2, RefreshCw, Save, ArrowRight, Download } from 'lucide-react';

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
  const [isSaved, setIsSaved] = useState(false);
  const [consistencySeed, setConsistencySeed] = useState<number>(0);
  const [isDownloadingFull, setIsDownloadingFull] = useState(false);

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
    setIsSaved(false);
  };

  const navigateToMemories = () => {
    setState(prev => ({ ...prev, step: 'memories' }));
  };

  const loadMemory = (saved: SavedStory) => {
    setState(prev => ({
        ...prev,
        step: 'complete',
        title: saved.title,
        panels: saved.panels,
        artStyle: saved.artStyle
    }));
    setIsSaved(true); // Already saved since it came from memory
  };

  const generateComic = useCallback(async () => {
    if (!state.story) return;

    setStage(GenerationStage.WRITING_SCRIPT);
    setState(prev => ({ ...prev, step: 'generating', panels: [] }));
    setError(null);
    setIsSaved(false);

    // Generate a fixed seed for this entire comic session
    const seed = Math.floor(Math.random() * 1000000);
    setConsistencySeed(seed);

    try {
      // 1. Generate Script AND CIBs
      const scriptData = await generateWebtoonScript(state.story, state.characters, state.artStyle);

      // 1b. Update Characters with their new CIBs (The Anchor)
      const updatedCharacters = state.characters.map(char => ({
        ...char,
        cib: scriptData.characterIdentityBlocks[char.name] || `A person named ${char.name}`
      }));
      
      setState(prev => ({
        ...prev,
        title: scriptData.title,
        characters: updatedCharacters
      }));

      const initialPanels: GeneratedPanel[] = scriptData.panels.map(p => ({
        ...p,
        imageUrl: '',
        status: 'pending'
      }));

      setState(prev => ({
        ...prev,
        title: scriptData.title,
        characters: updatedCharacters, // Save CIBs to state
        panels: initialPanels
      }));

      setStage(GenerationStage.DRAWING_PANELS);

      // 2. Generate Images sequentially
      const updatedPanels = [...initialPanels];
      // Assume the first character is the protagonist for single-ref-image panels for now
      // In a real app, 'speaker' or 'characters_present' would map to specific IDs.
      const mainCharacter = updatedCharacters.length > 0 ? updatedCharacters[0] : undefined;

      for (let i = 0; i < updatedPanels.length; i++) {
        updatedPanels[i].status = 'generating';
        setState(prev => ({ ...prev, panels: [...updatedPanels], currentGenerationIndex: i }));

        try {
            // Pass the strict CIB generated in step 1
            const base64Image = await generatePanelImage(
                updatedPanels[i].visualDescription, 
                state.artStyle,
                mainCharacter,
                mainCharacter?.cib, // <--- THE ANCHOR
                seed,
                updatedPanels[i].panelOutfit // <--- THE OUTFIT
            );
            updatedPanels[i].imageUrl = base64Image;
            updatedPanels[i].status = 'complete';
            
            // Artificial delay to prevent Rate Limiting (429) errors on Free Tier
            await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (e) {
            console.error(`Failed to generate panel ${i}`, e);
            updatedPanels[i].status = 'error';
        }
        
        setState(prev => ({ ...prev, panels: [...updatedPanels] }));
      }

      setStage(GenerationStage.FINALIZING);
      
      // 3. Complete & Auto-Save
      const storyToSave: SavedStory = {
        id: Date.now().toString(),
        title: scriptData.title || 'Untitled Memory',
        date: Date.now(),
        panels: updatedPanels,
        artStyle: state.artStyle
      };

      await saveMemory(storyToSave);
      setIsSaved(true);

      setTimeout(() => {
          setState(prev => ({ ...prev, step: 'complete' }));
      }, 800);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong generating the comic.");
      setState(prev => ({ ...prev, step: 'input' }));
    }
  }, [state.story, state.characters, state.artStyle]);

  // Handler for Regenerating a single panel
  const handleRegeneratePanel = async (panelId: number) => {
      // Find panel
      const panelsCopy = [...state.panels];
      const idx = panelsCopy.findIndex(p => p.panelId === panelId);
      if (idx === -1) return;

      // Set to loading
      panelsCopy[idx].status = 'generating';
      setState(prev => ({ ...prev, panels: panelsCopy }));

      try {
          const mainCharacter = state.characters[0]; // Simplified for single protagonist
          
          // Slightly shift seed for regeneration to get a variation
          const newSeed = consistencySeed + Math.floor(Math.random() * 1000);

          const base64Image = await generatePanelImage(
            panelsCopy[idx].visualDescription,
            state.artStyle,
            mainCharacter,
            mainCharacter?.cib, // REUSE THE CIB VERBATIM
            newSeed,
            panelsCopy[idx].panelOutfit // REUSE OUTFIT
          );

          panelsCopy[idx].imageUrl = base64Image;
          panelsCopy[idx].status = 'complete';
          setState(prev => ({ ...prev, panels: panelsCopy }));
          
          // Update memory in background
          if (state.title) {
             const storyToSave: SavedStory = {
                id: Date.now().toString(), // Ideally reuse ID, but simplistic update here
                title: state.title,
                date: Date.now(),
                panels: panelsCopy,
                artStyle: state.artStyle
             };
             saveMemory(storyToSave);
          }

      } catch (e) {
          panelsCopy[idx].status = 'error';
          setState(prev => ({ ...prev, panels: panelsCopy }));
      }
  };

  // Helper to download a single panel with html2canvas (captures text bubbles)
  const handleDownloadPanel = async (panelId: number) => {
    // 1. Target the specific container ID defined in ComicPanel.tsx
    const element = document.getElementById(`panel-container-${panelId}`);
    
    if (!element || !(window as any).html2canvas) {
        // Fallback: Just download the raw image if capturing fails
        const panel = state.panels.find(p => p.panelId === panelId);
        if (panel && panel.imageUrl) {
            const link = document.createElement('a');
            link.href = `data:image/jpeg;base64,${panel.imageUrl}`;
            link.download = `relive-panel-${panelId}.jpg`;
            link.click();
        }
        return;
    }

    try {
        // 2. Safe html2canvas options for Base64 images
        const canvas = await (window as any).html2canvas(element, {
            useCORS: true,       // Essential for loading images
            scale: 3,            // High resolution (Retina quality)
            backgroundColor: "#ffffff", // Prevent transparent backgrounds
            logging: false,
            imageTimeout: 0,     // Wait indefinitely for images to render
            allowTaint: false,   // Must be false to use toDataURL
            scrollY: -window.scrollY, // FIX: Adjusts for user scroll position so image isn't blank
            onclone: (clonedDoc: any) => {
                // Force visibility in the clone just in case
                const clonedElement = clonedDoc.getElementById(`panel-container-${panelId}`);
                if (clonedElement) {
                    clonedElement.style.opacity = '1';
                    clonedElement.style.visibility = 'visible';
                }
            }
        });
        
        const link = document.createElement('a');
        link.download = `relive-panel-${panelId}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    } catch (err) {
        console.error("Panel download failed", err);
        alert("Could not capture panel. Try scrolling to the top and trying again.");
    }
  };

  // Helper to download the FULL webtoon with text bubbles
  const handleDownloadFullWebtoon = async () => {
    const element = document.getElementById('webtoon-strip');
    if (!element || !(window as any).html2canvas) {
        alert("Download module not ready. Please try again in a moment.");
        return;
    }

    setIsDownloadingFull(true);
    try {
      const canvas = await (window as any).html2canvas(element, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#fafaf9',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        imageTimeout: 0,
        allowTaint: false,
        scrollY: -window.scrollY // Fix for full strip download when scrolled down
      });
      
      const link = document.createElement('a');
      link.download = `${state.title.replace(/\s+/g, '-').toLowerCase()}-full-episode.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.85);
      link.click();
    } catch (err) {
      console.error("Full download failed", err);
      alert("Could not generate full image. The story might be too long for your device's memory. Try downloading individual panels.");
    } finally {
      setIsDownloadingFull(false);
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: state.title,
          text: `Check out my memory "${state.title}" created with RE:LIVE!`,
          url: window.location.href, // In a real app, this would be a permalink
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback
      alert("Sharing is supported on mobile devices. You can download the panels to share them manually!");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20 selection:bg-stone-200 selection:text-stone-900 transition-colors duration-500 font-sans">
      <Header onMemoriesClick={navigateToMemories} />

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

        {state.step === 'memories' && (
            <MemoriesView 
                onLoadStory={loadMemory}
                onBack={handleReset}
            />
        )}

        {state.step === 'complete' && (
          <div className="animate-in fade-in duration-1000 px-4 py-8">
             {/* Result Header */}
             <div className="text-center mb-12 space-y-3">
                <h2 className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">Production Complete</h2>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900">{state.title}</h1>
                <div className="flex justify-center gap-2 mt-4 items-center">
                    <span className="text-[10px] uppercase tracking-wider px-3 py-1 bg-white rounded-full text-stone-500 border border-stone-200 shadow-sm">{state.artStyle}</span>
                    {isSaved && (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-3 py-1 bg-stone-100 rounded-full text-stone-600 border border-stone-200">
                            <Save size={10} /> Memory Saved
                        </span>
                    )}
                </div>
             </div>

             {/* Comic Strip Container (Target for Download) */}
             <div id="webtoon-strip" className="flex flex-col items-center bg-stone-50 min-h-screen gap-0 py-8">
                {state.panels.map((panel) => (
                    <ComicPanel 
                        key={panel.panelId} 
                        panel={panel} 
                        onRegenerate={handleRegeneratePanel}
                        onDownload={handleDownloadPanel}
                    />
                ))}
                
                {/* Branding footer for the downloaded image */}
                <div className="pt-8 pb-4 text-center opacity-40 grayscale">
                    <div className="font-serif font-bold text-xl tracking-tight text-stone-900">RE:LIVE</div>
                    <div className="text-[10px] uppercase tracking-widest text-stone-500">Memories Reimagined</div>
                </div>
             </div>

             {/* Footer Actions (What's Next) */}
             <div className="max-w-2xl mx-auto mt-10 pt-10 border-t border-stone-200 space-y-6">
                
                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={handleDownloadFullWebtoon}
                        disabled={isDownloadingFull}
                        className="flex items-center justify-center gap-2 px-8 py-5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold transition-all shadow-xl shadow-stone-900/10 text-sm uppercase tracking-wide group w-full"
                    >
                        {isDownloadingFull ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        {isDownloadingFull ? "Stitching Episode..." : "Download Full Episode"}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold transition-all text-xs uppercase tracking-wide"
                    >
                        <Share2 size={14} />
                        Share
                    </button>
                    
                    <button 
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold transition-all text-xs uppercase tracking-wide"
                    >
                        <RefreshCw size={14} />
                        New Story
                    </button>
                </div>
                
                <div className="text-center">
                    <button 
                        onClick={navigateToMemories}
                        className="text-stone-400 hover:text-stone-700 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 mx-auto"
                    >
                        View All Memories <ArrowRight size={12} />
                    </button>
                </div>
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
