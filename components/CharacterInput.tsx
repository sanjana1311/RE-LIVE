import React, { useRef, useState } from 'react';
import { Plus, X, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { Character, ColorPalette } from '../types';

interface Props {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
}

const OUTFIT_PRESETS = ["Casual Hoodie", "School Uniform", "Cyberpunk Gear", "Fantasy Armor", "Business Suit", "Summer Dress", "Sportswear", "Traditional Robe"];
const HAIR_PRESETS = ["Short & Messy", "Long & Flowing", "Bob Cut", "Spiky Anime", "Ponytail", "Braided", "Bald", "Undercut"];
const ACCESSORY_PRESETS = ["Glasses", "Scar", "Hat", "Headphones", "Earrings", "Bandage", "Mask", "Cat Ears"];
const PALETTE_PRESETS: ColorPalette[] = ["Soft", "Bright", "Neutral", "Dark"];

const CharacterInput: React.FC<Props> = ({ characters, setCharacters }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (characters.length >= 3) {
      alert("Max 3 people allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const rawBase64 = base64String.split(',')[1]; 
      
      const newChar: Character = {
        id: Date.now().toString(),
        name: `Person ${characters.length + 1}`,
        imageBase64: rawBase64,
        outfit: undefined, 
        hairStyle: undefined, 
        accessories: [],
        colorPalette: undefined 
      };
      setCharacters([...characters, newChar]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const updateCharacter = (index: number, field: keyof Character, value: any) => {
    const newChars = [...characters];
    (newChars[index] as any)[field] = value;
    setCharacters(newChars);
  };

  const toggleAccessory = (index: number, accessory: string) => {
    const char = characters[index];
    const current = char.accessories || [];
    const newAccessories = current.includes(accessory)
        ? current.filter(a => a !== accessory)
        : [...current, accessory];
    updateCharacter(index, 'accessories', newAccessories);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-stone-600">
            People in this Story
        </label>
        <span className="text-xs text-stone-400 font-medium">{characters.length}/3 Selected</span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {characters.map((char, idx) => (
          <div key={char.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Main Character Row */}
            <div className="p-4 flex gap-4 relative items-center">
                <button
                    onClick={() => removeCharacter(char.id)}
                    className="absolute top-2 right-2 text-stone-300 hover:text-red-500 transition-colors z-10 p-1"
                >
                    <X size={16} />
                </button>

                {/* Avatar */}
                <div className="w-14 h-14 flex-shrink-0 rounded bg-stone-100 border border-stone-100 overflow-hidden">
                    <img 
                        src={`data:image/jpeg;base64,${char.imageBase64}`} 
                        alt="Character" 
                        className="w-full h-full object-cover grayscale-[0.1]"
                    />
                </div>

                {/* Name Input */}
                <div className="flex flex-col justify-center gap-0.5 flex-grow">
                     <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Name</label>
                     <input 
                        type="text" 
                        className="bg-transparent border-b border-transparent hover:border-stone-200 focus:border-stone-400 outline-none text-base text-stone-900 font-bold w-full transition-colors p-0 pb-1 font-serif"
                        value={char.name}
                        onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                        placeholder="e.g. Me, Sarah, My Brother"
                    />
                    
                    <button 
                        onClick={() => toggleExpand(char.id)}
                        className="text-[10px] text-stone-500 font-semibold flex items-center gap-1 mt-1 hover:text-stone-800 w-fit uppercase tracking-wide"
                    >
                        <Settings2 size={10} />
                        {expandedId === char.id ? "Close Options" : "Customize Look"}
                        {expandedId === char.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                </div>
            </div>
            
            {/* Expandable Customization Panel */}
            {expandedId === char.id && (
                <div className="px-4 pb-6 pt-2 bg-stone-50/50 border-t border-stone-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 gap-5 mt-2">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1 block">Hair Override</label>
                                <select 
                                    className="w-full bg-white border border-stone-200 rounded text-xs text-stone-700 p-2.5 focus:border-stone-400 outline-none transition-all cursor-pointer"
                                    value={char.hairStyle || ""}
                                    onChange={(e) => updateCharacter(idx, 'hairStyle', e.target.value || undefined)}
                                >
                                    <option value="">Matches Photo (Default)</option>
                                    {HAIR_PRESETS.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1 block">Outfit Override</label>
                                <select 
                                    className="w-full bg-white border border-stone-200 rounded text-xs text-stone-700 p-2.5 focus:border-stone-400 outline-none transition-all cursor-pointer"
                                    value={char.outfit || ""}
                                    onChange={(e) => updateCharacter(idx, 'outfit', e.target.value || undefined)}
                                >
                                    <option value="">Matches Photo (Default)</option>
                                    {OUTFIT_PRESETS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2 block">Accessories</label>
                            <div className="flex flex-wrap gap-2">
                                {ACCESSORY_PRESETS.map((acc) => {
                                    const isSelected = char.accessories?.includes(acc);
                                    return (
                                        <button
                                            key={acc}
                                            onClick={() => toggleAccessory(idx, acc)}
                                            className={`
                                                text-[10px] px-3 py-1.5 rounded-full border transition-all
                                                ${isSelected 
                                                    ? 'bg-stone-800 border-stone-800 text-white' 
                                                    : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'}
                                            `}
                                        >
                                            {acc}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2 block">Color Palette</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateCharacter(idx, 'colorPalette', undefined)}
                                    className={`
                                        flex-1 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all
                                        ${!char.colorPalette
                                            ? 'bg-stone-800 text-white border-stone-800' 
                                            : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}
                                    `}
                                >
                                    Match Photo
                                </button>
                                 {PALETTE_PRESETS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => updateCharacter(idx, 'colorPalette', p)}
                                        className={`
                                            flex-1 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all
                                            ${char.colorPalette === p 
                                                ? 'bg-stone-200 text-stone-900 border-stone-300' 
                                                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}
                                        `}
                                    >
                                        {p}
                                    </button>
                                 ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        ))}

        {characters.length < 3 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-lg border border-dashed border-stone-300 flex items-center justify-center gap-2 text-stone-500 hover:border-stone-500 hover:text-stone-700 transition-all bg-stone-50/50 hover:bg-white group"
          >
            <div className="bg-white p-1 rounded shadow-sm border border-stone-200 group-hover:border-stone-300 transition-all text-stone-400 group-hover:text-stone-600">
                <Plus size={16} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Add Person</span>
          </button>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default CharacterInput;