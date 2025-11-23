import { PanelScript, Character, ArtStyle } from "../types";

const API_KEY = process.env.API_KEY || '';

// --- Helper: Construct Character Identity Block ---
const constructCharacterIdentityBlock = (char: Character): string => {
  const outfitSpec = char.outfit ? `FIXED OUTFIT: ${char.outfit}` : 'OUTFIT: Change based on scene context (casual/formal/work) but keep style consistent.';
  const hairSpec = char.hairStyle ? `FIXED HAIR: ${char.hairStyle}` : 'HAIR: Consistent with a typical person of this description.';
  
  return `
    CHARACTER IDENTITY BLOCK (CIB)
    ---------------------------------------------------------
    NAME: ${char.name}
    APPEARANCE RULES:
      - ${hairSpec}
      - ${outfitSpec}
      - ACCESSORIES: ${char.accessories.join(', ') || 'None'}
      - PALETTE: ${char.colorPalette || 'Natural'}
    ---------------------------------------------------------
  `;
};

// --- Script Generation (GPT-4o) ---

export const generateWebtoonScript = async (
  story: string, 
  characters: Character[]
): Promise<{ title: string; panels: PanelScript[] }> => {
  
  const characterDescriptions = characters.map(c => 
    `${c.name} (Hair: ${c.hairStyle || 'variable'}, Outfit: ${c.outfit || 'variable'})`
  ).join("; ");

  const names = characters.length > 0 ? characterDescriptions : "the protagonist";
  
  const systemPrompt = `
    You are a master Webtoon Director and Screenwriter.
    Your goal is to turn the user's story into a VISUALLY coherent, chronologically smooth Webtoon episode.
    
    CRITICAL INSTRUCTIONS:
    1. **PANEL COUNT IS DYNAMIC:** Determine the optimal number of panels (Min 6, Max 25).
    2. **REAL-WORLD LOCATION ACCURACY:** Describe specific visual landmarks for real places.
    3. **VISUAL ACTION:** Translate abstract "jobs" or thoughts into cinematic visual actions.
    4. **FORMAT:** Return ONLY valid JSON.
  `;

  const userPrompt = `
    User Story: "${story}"
    Characters: ${names}.

    Return a JSON object with this structure:
    {
      "title": "Story Title",
      "panels": [
        {
          "panelId": 1,
          "visualDescription": "Highly detailed visual prompt for DALL-E 3 focusing on setting, lighting, and action.",
          "dialogue": "Speech bubble text (optional)",
          "speaker": "Speaker name (optional)",
          "narration": "Narration box text (optional)"
        }
      ]
    }
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (!content) throw new Error("No content generated");
    
    return JSON.parse(content);

  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
};

// --- Image Generation (DALL-E 3) ---

export const generatePanelImage = async (
  visualDescription: string, 
  style: ArtStyle,
  mainCharacter?: Character,
  seed?: number
): Promise<string> => {
  
  // Construct style guidelines
  let stylePrompt = "";
  switch (style) {
    case 'Manga':
      stylePrompt = "Modern Manga style, black and white ink, screentones, dramatic shading.";
      break;
    case 'Chibi':
      stylePrompt = "Chibi style, cute, large head ratio, simple flat coloring.";
      break;
    case 'Painterly':
      stylePrompt = "Digital Painterly style, soft brushstrokes, atmospheric lighting, detailed background art.";
      break;
    case 'Ghibli':
      stylePrompt = "Studio Ghibli style, Hayao Miyazaki aesthetic, hand-painted watercolor backgrounds, lush greenery, soft natural lighting.";
      break;
    case 'Webtoon':
      stylePrompt = "Premium Webtoon style, crisp lineart, vibrant cel-shading, manhwa aesthetic.";
      break;
    case 'Anime':
    default:
      stylePrompt = "High-quality Anime art style, Kyoto Animation aesthetic, detailed eyes, cinematic lighting.";
      break;
  }

  // Identity Block (CIB)
  let identityBlock = "";
  if (mainCharacter) {
    identityBlock = constructCharacterIdentityBlock(mainCharacter);
  }

  // DALL-E 3 Prompt construction
  const fullPrompt = `
    A vertical comic panel.
    ART STYLE: ${stylePrompt}
    
    ${identityBlock}
    
    SCENE DESCRIPTION: ${visualDescription}
    
    Ensure the character matches the description in the Identity Block.
    High quality, detailed, cinematic composition.
  `.trim().slice(0, 4000); // DALL-E limit is 4000 chars

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1792", // Vertical aspect ratio
        response_format: "b64_json",
        quality: "hd",
        style: "vivid"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI DALL-E Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].b64_json;

  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};