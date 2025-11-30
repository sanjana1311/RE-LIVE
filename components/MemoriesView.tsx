
import React, { useEffect, useState } from 'react';
import { SavedStory } from '../types';
import { getAllMemories, deleteMemory } from '../services/storage';
import { Trash2, Calendar, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';

interface Props {
  onLoadStory: (story: SavedStory) => void;
  onBack: () => void;
}

const MemoriesView: React.FC<Props> = ({ onLoadStory, onBack }) => {
  const [memories, setMemories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await getAllMemories();
      setMemories(data);
    } catch (error) {
      console.error("Failed to load memories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to forget this memory?")) {
        await deleteMemory(id);
        await loadMemories();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
  };

  return (
    <div className="px-4 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4 mb-8 border-b border-stone-200 pb-6">
        <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
        >
            <ArrowLeft size={20} />
        </button>
        <div>
            <h2 className="text-3xl font-serif font-bold text-stone-900">Your Memories</h2>
            <p className="text-stone-500 text-sm font-light">Revisit the stories you've created.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-2">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-widest">Loading memories...</span>
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-20 space-y-4 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="text-stone-300" size={32} />
            </div>
            <div className="space-y-1">
                <h3 className="text-stone-900 font-medium">No memories yet</h3>
                <p className="text-stone-500 text-sm max-w-xs mx-auto">Create your first story to see it appear here.</p>
            </div>
            <button 
                onClick={onBack}
                className="text-stone-900 text-sm font-bold underline underline-offset-4 hover:text-stone-600"
            >
                Create a Story
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {memories.map((memory) => (
                <div 
                    key={memory.id}
                    onClick={() => onLoadStory(memory)}
                    className="group relative bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                    {/* Thumbnail (First Panel) */}
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                         {memory.panels.length > 0 && memory.panels[0].imageUrl ? (
                            <img 
                                src={`data:image/jpeg;base64,${memory.panels[0].imageUrl}`} 
                                alt={memory.title}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <span className="text-xs">No Preview</span>
                            </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent opacity-60" />
                         
                         <div className="absolute bottom-3 left-4 text-white">
                             <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                                {memory.artStyle}
                             </span>
                         </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                        <div className="space-y-1">
                            <h3 className="font-serif font-bold text-lg text-stone-900 line-clamp-1 group-hover:text-stone-600 transition-colors">
                                {memory.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
                                <Calendar size={12} />
                                {formatDate(memory.date)}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                            <span className="text-xs font-bold uppercase tracking-wide text-stone-400 group-hover:text-stone-900 transition-colors flex items-center gap-1">
                                Read Story <ChevronRight size={12} />
                            </span>
                            
                            <button 
                                onClick={(e) => handleDelete(e, memory.id)}
                                className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                title="Delete Memory"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MemoriesView;
