
import { GoogleGenAI, Type } from "@google/genai";
import { PanelScript, Character, ArtStyle } from "../types";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper: Construct Character Identity Block ---
const constructCharacterIdentityBlock = (char: Character): string => {
  const outfitSpec = char.outfit ? `FIXED OUTFIT: ${char.outfit}` : 'OUTFIT: Change based on scene context (casual/formal/work) but keep style consistent.';
  const hairSpec = char.hairStyle ? `FIXED HAIR: ${char.hairStyle}` : 'HAIR: Match Reference Image exactly.';
  
  return `
    CHARACTER IDENTITY BLOCK (CIB) - STRICT ADHERENCE REQUIRED
    ---------------------------------------------------------
    NAME: ${char.name}
    FACE & IDENTITY: 
      - Use the attached reference image as the GROUND TRUTH for facial structure, eye shape, nose, and jawline.
      - Do NOT alter ethnicity or key facial features.
      - Do NOT "beautify" or genericize the face. It must look like the specific person in the photo.
    
    APPEARANCE RULES:
      - ${hairSpec}
      - ${outfitSpec}
      - ACCESSORIES: ${char.accessories.join(', ') || 'None'}
    ---------------------------------------------------------
  `;
};

// --- Script Generation ---

export const generateWebtoonScript = async (
  story: string, 
  characters: Character[]
): Promise<{ title: string; panels: PanelScript[] }> => {
  
  // We tell the script writer that outfit is 'variable' if not strictly defined by the user
  const characterDescriptions = characters.map(c => 
    `${c.name} (Hair: ${c.hairStyle || 'consistent with photo'}, Outfit: ${c.outfit || 'variable based on story context'})`
  ).join("; ");

  const names = characters.length > 0 ? characterDescriptions : "the protagonist";
  
  const prompt = `
    You are a master Webtoon Director and Screenwriter.
    Your goal is to turn the user's story into a VISUALLY coherent, chronologically smooth Webtoon episode.

    User Story: "${story}"
    Characters: ${names}.

    CRITICAL INSTRUCTIONS:
    1. **PANEL COUNT IS DYNAMIC:** Do NOT stick to a small number of panels. Determine the optimal number of panels to tell this story fully and emotionally (Minimum 6, Maximum 25). 
       - If the story is detailed, use MORE panels to let moments breathe.
       - Do not rush the pacing.
    
    2. **REAL-WORLD LOCATION ACCURACY:** 
       - If the user mentions a real place (e.g., "Tempe Town Lake", "Times Square", "Kyoto"), do NOT just describe a generic version.
       - You MUST describe specific visual landmarks in the 'visualDescription'.
       - Example: "Tempe Town Lake" -> Describe "The distinct modern Mill Avenue bridges spanning the water, with arid desert mountains in the distant background and reflective water."

    3. **Translate "Jobs" to "Cinematic Actions":** If the user mentions a job or activity, make it visual.
       - Example: "Working at Tesla" -> Show the character inside a sleek autonomous car, hands off the wheel, looking cool.

    4. **Chronological Flow:** Ensure Panel 1 leads logically to Panel 2.

    Return a JSON object with a 'title' and an array of 'panels'.
    For each panel, provide:
    - panelId: Integer.
    - visualDescription: A highly detailed prompt for an image generator. 
      *IMPORTANT*: Focus on the SETTING and the LIGHTING. 
      *CLOTHING*: If the user has a set outfit, use it. If not, ensure the outfit makes sense for the *action* (e.g. sleek jacket for the car scene).
    - dialogue: Short, punchy dialogue bubbles.
    - speaker: Character name.
    - narration: Text box for context.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          panels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                panelId: { type: Type.INTEGER },
                visualDescription: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                speaker: { type: Type.STRING },
                narration: { type: Type.STRING },
              },
              required: ["panelId", "visualDescription"],
            },
          },
        },
        required: ["title", "panels"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate script");
  }

  return JSON.parse(response.text);
};

// --- Image Generation ---

export const generatePanelImage = async (
  visualDescription: string, 
  style: ArtStyle,
  mainCharacter?: Character,
  seed?: number
): Promise<string> => {
  
  const modelName = "gemini-2.5-flash-image"; 
  
  // Construct style guidelines based on selection
  let stylePrompt = "";
  switch (style) {
    case 'Manga':
      stylePrompt = "Modern Manga style, black and white ink with screentones, highly detailed background, dramatic composition.";
      break;
    case 'Chibi':
      stylePrompt = "Chibi style, super deformed, cute, large head ratio, simple shading.";
      break;
    case 'Painterly':
      stylePrompt = "Digital Painterly style, soft brushstrokes, atmospheric lighting, detailed background art.";
      break;
    case 'Ghibli':
      stylePrompt = "Studio Ghibli style, Hayao Miyazaki aesthetic, hand-painted watercolor backgrounds, lush greenery, soft natural lighting, nostalgic atmosphere, clean character lines.";
      break;
    case 'Webtoon':
      stylePrompt = "Premium Webtoon style, crisp lineart, vibrant cel-shading, manhwa aesthetic, vertical format composition, highly detailed backgrounds.";
      break;
    case 'Anime':
    default:
      stylePrompt = "High-quality Anime art style, Kyoto Animation aesthetic, detailed eyes, cinematic lighting, beautiful scenery.";
      break;
  }

  // Identity Block (CIB)
  let identityBlock = "";
  if (mainCharacter) {
    identityBlock = constructCharacterIdentityBlock(mainCharacter);
  }

  // Base prompt structure
  const promptText = `
    ${identityBlock}

    ART STYLE: ${stylePrompt}
    
    SCENE: ${visualDescription}
    
    INSTRUCTIONS:
    - Maintain 100% identity consistency with the reference image (if provided).
    - Do NOT change the character’s facial structure.
    - Render in a vertical comic panel format.
  `;

  const parts: any[] = [
    { text: promptText }
  ];

  if (mainCharacter) {
    // Add reference image as high priority context
    parts.push({
      inlineData: {
        mimeType: "image/jpeg", 
        data: mainCharacter.imageBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        // Use seed for consistency if provided
        seed: seed || undefined
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        if (content.parts) {
            for (const part of content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return part.inlineData.data; 
                }
            }
        }
    }
    
    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};
