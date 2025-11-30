
import React, { useRef, useState } from 'react';
import { Plus, X, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { Character, ColorPalette } from '../types';

interface Props {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
}

const OUTFIT_PRESETS = ["Casual Hoodie", "School Uniform", "Cyberpunk Gear", "Fantasy Armor", "Business Suit", "Summer Dress", "Sportswear", "Traditional Robe", "Formal Wedding Attire", "Traditional Indian", "Pajamas/Sleepwear"];
const HAIR_PRESETS = ["Short & Messy", "Long & Flowing", "Bob Cut", "Spiky Anime", "Ponytail", "Braided", "Bald", "Undercut"];
const PALETTE_PRESETS: ColorPalette[] = ["Soft", "Bright", "Neutral", "Dark"];

// Comprehensive list of daily accessories
const DAILY_ACCESSORIES = [
    // Eyewear
    "Prescription Glasses", "Sunglasses", "Reading Glasses", "Round Frames", "Cat-Eye Glasses",
    // Headwear
    "Baseball Cap", "Beanie", "Wide-brim Hat", "Bucket Hat", "Headband", "Bandana", "Hijab", "Turban", "Hair Clip", "Scrunchie",
    // Jewelry
    "Gold Necklace", "Silver Chain", "Pearl Necklace", "Choker", "Pendant",
    "Stud Earrings", "Hoop Earrings", "Dangle Earrings",
    "Wristwatch", "Smart Watch", "Bracelet", "Bangle", "Ring", "Nose Piercing", "Septum Ring",
    // Tech & Other
    "Over-ear Headphones", "Wireless Earbuds", "Scarf", "Face Mask", "Bow Tie", "Tie", "Bindi"
].sort();

const CharacterInput: React.FC<Props> = ({ characters, setCharacters }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Helper to resize and compress images to avoid "Payload Too Large" API errors
  const processImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1024; // Limit max dimension to 1024px

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             // Always convert to JPEG for consistent handling and better compression
             const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
             resolve({
               base64: dataUrl.split(',')[1],
               mimeType: 'image/jpeg'
             });
          } else {
             reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (characters.length >= 3) {
      alert("Max 3 people allowed");
      return;
    }

    try {
        const { base64, mimeType } = await processImage(file);
        
        const newChar: Character = {
          id: Date.now().toString(),
          name: `Person ${characters.length + 1}`,
          imageBase64: base64,
          mimeType: mimeType,
          outfit: undefined, 
          hairStyle: undefined, 
          accessories: [],
          colorPalette: undefined,
          description: ''
        };
        setCharacters([...characters, newChar]);
    } catch (err) {
        console.error("Error processing image", err);
        alert("Failed to process image. Please try another.");
    }

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

  const addAccessory = (index: number, accessory: string) => {
    if (!accessory) return;
    const char = characters[index];
    const current = char.accessories || [];
    if (!current.includes(accessory)) {
        updateCharacter(index, 'accessories', [...current, accessory]);
    }
  };

  const removeAccessory = (index: number, accessory: string) => {
    const char = characters[index];
    const current = char.accessories || [];
    updateCharacter(index, 'accessories', current.filter(a => a !== accessory));
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
                        src={`data:${char.mimeType || 'image/jpeg'};base64,${char.imageBase64}`} 
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
                        {expandedId === char.id ? "Close Options" : "Add Details (Optional)"}
                        {expandedId === char.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                </div>
            </div>
            
            {/* Expandable Customization Panel */}
            {expandedId === char.id && (
                <div className="px-4 pb-6 pt-2 bg-stone-50/50 border-t border-stone-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 gap-5 mt-2">
                        
                        {/* Description Text Area */}
                        <div>
                             <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2 block">
                                Additional Details (Recommended)
                             </label>
                             <textarea 
                                className="w-full bg-white border border-stone-200 rounded text-xs text-stone-700 p-3 focus:border-stone-400 outline-none transition-all resize-none h-20"
                                placeholder="e.g. Ethnicity (Indian, Korean, etc.), specific vibe, or important details."
                                value={char.description || ''}
                                onChange={(e) => updateCharacter(idx, 'description', e.target.value)}
                             />
                        </div>

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
                                    <option value="">Auto (Adapts to Scene)</option>
                                    {OUTFIT_PRESETS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {/* Daily Accessories Dropdown */}
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2 block">Accessories</label>
                            
                            <select 
                                className="w-full bg-white border border-stone-200 rounded text-xs text-stone-700 p-2.5 focus:border-stone-400 outline-none transition-all cursor-pointer mb-2"
                                onChange={(e) => {
                                    addAccessory(idx, e.target.value);
                                    e.target.value = ""; // Reset dropdown
                                }}
                            >
                                <option value="">+ Select Accessory</option>
                                {DAILY_ACCESSORIES.map(acc => (
                                    <option key={acc} value={acc} disabled={char.accessories.includes(acc)}>
                                        {acc}
                                    </option>
                                ))}
                            </select>

                            {/* Selected Accessories Tags */}
                            <div className="flex flex-wrap gap-2 min-h-[24px]">
                                {char.accessories?.map((acc) => (
                                    <span 
                                        key={acc}
                                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-stone-800 text-white font-medium"
                                    >
                                        {acc}
                                        <button 
                                            onClick={() => removeAccessory(idx, acc)}
                                            className="hover:text-red-300 transition-colors ml-1"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                {!char.accessories?.length && (
                                    <span className="text-[10px] text-stone-400 italic px-1">None selected</span>
                                )}
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
