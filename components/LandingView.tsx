
import React from 'react';
import { Sparkles, ArrowRight, Palette } from 'lucide-react';
import { Character, ArtStyle } from '../types';
import CharacterInput from './CharacterInput';

interface Props {
  story: string;
  setStory: (s: string) => void;
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  artStyle: ArtStyle;
  setArtStyle: (s: ArtStyle) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const STYLES: { id: ArtStyle; label: string; desc: string }[] = [
    { id: 'Webtoon', label: 'Clean Webtoon', desc: 'Crisp lines, vertical scroll ready' },
    { id: 'Ghibli', label: 'Studio Ghibli', desc: 'Hand-painted, whimsical, nostalgic' },
    { id: 'Anime', label: 'Classic Anime', desc: '90s aesthetic, cel-shaded' },
    { id: 'Manga', label: 'Modern Manga', desc: 'B&W, screentones, dramatic' },
    { id: 'Chibi', label: 'Chibi', desc: 'Cute, small, expressive' },
    { id: 'Painterly', label: 'Painterly Illustration', desc: 'Soft, detailed, artistic' },
];

const LandingView: React.FC<Props> = ({
  story,
  setStory,
  characters,
  setCharacters,
  artStyle,
  setArtStyle,
  onGenerate,
  isGenerating,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-32 pt-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="text-center space-y-6">
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 tracking-tight">
          Relive your memories. <span className="italic text-stone-600">Rewrite your story.</span>
        </h2>
        <p className="text-stone-500 text-lg max-w-xl mx-auto font-light">
          A new way to revisit and reimagine your life’s chapters.
        </p>
      </div>

      <div className="bg-white border border-stone-200 p-8 rounded-none md:rounded-2xl shadow-sm space-y-12 relative overflow-hidden">
        
        {/* Story Input */}
        <div className="space-y-4 relative z-10">
            <label htmlFor="story" className="block text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
              01. The Narrative
            </label>
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="It started as a normal Tuesday morning, until..."
              className="w-full h-32 bg-stone-50 border border-stone-200 rounded-lg p-4 text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none resize-none transition-all font-light"
            />
        </div>

        {/* Character Upload & Customization */}
        <div className="space-y-4 relative z-10">
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
              02. The People
            </label>
            <CharacterInput characters={characters} setCharacters={setCharacters} />
        </div>

        {/* Style Selection */}
        <div className="space-y-4 relative z-10">
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 border-b border-stone-100 pb-2">
               03. Visual Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setArtStyle(style.id)}
                        className={`
                            relative p-4 rounded-lg border text-left transition-all
                            ${artStyle === style.id 
                                ? 'bg-stone-900 border-stone-900 text-stone-50' 
                                : 'bg-white border-stone-200 hover:border-stone-400 text-stone-600'}
                        `}
                    >
                        <div className={`font-bold text-sm ${artStyle === style.id ? 'text-white' : 'text-stone-900'}`}>
                            {style.label}
                        </div>
                        <div className={`text-xs mt-1 leading-snug ${artStyle === style.id ? 'text-stone-400' : 'text-stone-400'}`}>
                            {style.desc}
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-40">
        <button
          onClick={onGenerate}
          disabled={!story.trim() || isGenerating}
          className={`
            group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:-translate-y-1
            ${!story.trim() || isGenerating 
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
              : 'bg-stone-900 text-white shadow-stone-900/20'}
          `}
        >
            {isGenerating ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4 text-stone-400" />
                    <span className="tracking-wide">Generate Episode</span>
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
      </div>
      
      {/* Background decoration - very subtle */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-stone-300/20 rounded-full blur-3xl -z-10 pointer-events-none" />
    </div>
  );
};

export default LandingView;
