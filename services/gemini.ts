
import { GoogleGenAI, Type } from "@google/genai";
import { PanelScript, Character, ArtStyle } from "../types";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper: Retry mechanism for 429 errors
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for Rate Limit (429) or Service Unavailable (503)
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.status === 503)) {
      console.warn(`API Rate Limit hit. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- Script & CIB Generation (The Director) ---

export const generateWebtoonScript = async (
  story: string, 
  characters: Character[],
  artStyle: ArtStyle
): Promise<{ title: string; panels: PanelScript[]; characterIdentityBlocks: Record<string, string> }> => {
  
  return retryWithBackoff(async () => {
    // Prepare input parts: Text Prompt + Character Images
    const inputParts: any[] = [];

    // 1. Add Character Images so the Director can see them to write the CIB
    characters.forEach(char => {
      inputParts.push({
        inlineData: {
          mimeType: char.mimeType || "image/jpeg",
          data: char.imageBase64
        }
      });
      inputParts.push({ text: `REFERENCE IMAGE FOR: ${char.name}. Description/Notes: ${char.description || "None"}` });
    });

    // 2. Add the Strict Director Prompt
    const prompt = `
      You are the "Relive" Webtoon Director AI.
      Your GOAL is to create an EMOTIONAL MASTERPIECE.
      Do not just list events. Make the user CRY (from sadness or joy).
      Focus on the internal journey, the struggle, and the ultimate release.

      STORY: "${story}"
      ART STYLE: ${artStyle}
      CHARACTERS PROVIDED: ${characters.map(c => c.name).join(', ')}

      ===========================================================
      PHASE 1: CHARACTER IDENTITY BLOCK (CIB) GENERATION - THE ANCHOR
      ===========================================================
      Analyze the provided images AND the character names/descriptions.
      For each character, write a "Character Identity Block" (CIB).
      
      This CIB is the FIXED TEXTUAL IDENTITY. It must be exhaustive.
      
      CRITICAL: You must explicitly define and include in the text:
      - ETHNICITY: (Inferred from Name + Image + Description)
      - SKIN TONE: (Describe precise shade, e.g., "Warm beige", "Deep cool brown", "Pale olive")
      - FACE SHAPE: (e.g. "Angular", "Round", "Oval", "Square")
      - JAWLINE & CHIN: (e.g. "Sharp/Chiseled", "Soft", "Pointed", "Cleft chin")
      - NOSE STRUCTURE: (e.g. "Button", "Aquiline", "Flat", "High bridge")
      - EYE SHAPE & SPACING: (e.g. "Almond", "Round", "Monolid", "Wide-set")
      - EYEBROW SHAPE: (e.g. "Thick and straight", "Thin and arched")
      - LIP SHAPE: (e.g. "Full", "Thin upper lip", "Cupid's bow")
      - HAIR DETAILS: Length, Texture, Color, Parting style.
      - UNIQUE MARKERS: (Moles, freckles, glasses, scars, dimples)
      
      CRITICAL: **DO NOT INCLUDE CLOTHING IN THIS BLOCK.** 
      Clothing must be dynamic and defined per panel in Phase 3.
      
      *User Overrides:*
      ${characters.map(c => `- ${c.name}: ${c.hairStyle ? 'FORCE HAIR TO: '+c.hairStyle : 'KEEP HAIR EXACTLY AS PHOTO'}, ${c.outfit ? 'FORCE OUTFIT TO: '+c.outfit : 'AUTO: ADAPT OUTFIT TO SCENE'}, Context: ${c.description || ''}`).join('\n')}

      The CIB text should be a single, dense, descriptive paragraph focusing ONLY on physical features.

      ===========================================================
      PHASE 2: SCENE ARCHETYPES & VISUAL LOGIC
      ===========================================================
      You must map story beats to specific visual archetypes. DO NOT GUESS.

      1. **REJECTION / BAD NEWS / STRUGGLE (Make it hurt):**
         - VISUAL: Looking at a laptop/phone screen with a crushed expression. Or sitting on floor, head in hands.
         - SETTING: **Bedroom (Dimly lit, cluttered with papers/books), Dark Cafe, or Lonely Park Bench**.
         - CONSTRAINT: **NO FOOD OR DIRTY DISHES.** The mess should be intellectual (papers, notes) or emotional (unmade bed), not gross/food-related.
         - ATMOSPHERE: Dim lighting, isolation, rain, or harsh monitor glow.

      2. **INTERNSHIP / WORKING (The Grind):**
         - VISUAL: Actively working (Typing, Soldering, Analyzing). Focus faces.
         - SETTING: **Lab, Office Cubicle, Tech Bench**. NOT holding a phone. NOT just walking.
         - NOTE: If they are working at a specific company (e.g., Infineon, Tesla), show that environment (Logos, machinery).

      3. **CONTRACT SIGNING / OFFER ACCEPTANCE (The Relief):**
         - VISUAL: Pen in hand, paper on desk, or shaking hands. Tears of joy are okay here.
         - OUTFIT: **Smart Casual / Business Professional** (Blazer, Shirt).
         - SETTING: HR Office or sleek desk.

      4. **UNIVERSITY INTERNSHIP (e.g., ASU Job):**
         - VISUAL: Working at a desk or lab on campus.
         - PRIORITY: **WORK > CAMPUS**. Show them working, not walking on the lawn.
         
      5. **AGE & TIMELINE CONSISTENCY (MANDATORY):**
         - If story mentions "Childhood" -> Describe character as Child/Teen.
         - If "College" -> Young Adult (approx 20s).
         - If "Present" -> Current Age (based on photo).
         
      6. **UNIVERSITY BRANDING LOOKUP:**
         - If "ASU" (Arizona State) -> Gown: Maroon with Gold Stole. Background: Palm trees, desert mountains.
         - If "NYU" -> Gown: Violet. Background: Washington Square Park.
         - If "Oxford/Cambridge" -> Subfusc/Robes.

      ===========================================================
      PHASE 2.5: EMOTIONAL AMPLIFICATION (THE "CRY" FACTOR)
      ===========================================================
      - **SAD MOMENTS:** Focus on small details. The shaking hand. The empty room. The silence. Narration should be internal monologue (e.g., "I wondered if I was enough.").
      - **HAPPY MOMENTS:** Focus on scale and light. The world opening up. The sun hitting their face. Narration should feel like a deep breath release (e.g., "Finally. It was real.").
      - **USE SILENCE:** For the biggest emotional peak (good or bad), use NO DIALOGUE. Let the image carry the weight.
      
      SPECIAL RULES FOR FIRST & LAST PANELS:
      - **PANEL 1 (The Hook):** Conceptual Montage if appropriate. Don't just show them sitting. Show the *weight* of the situation (e.g. surrounded by floating rejection letters, or chaos).
      - **FINAL PANEL (The Legacy):** Symbolic Resolution. Looking at a reflection of younger self, or walking towards a bright horizon. Show growth, not just the event.

      ===========================================================
      PHASE 3: SCENE & PANEL BREAKDOWN
      ===========================================================
      1. Break story into scenes based on EMOTIONAL PACING.
      2. Panel Count: Range 6 to 12 panels. Use "Breathing Panels" (scenery, silence) between major emotional beats.

      3. OUTFIT LOGIC TABLE (MANDATORY):
         You MUST generate a 'panelOutfit' for every panel using this logic map.
         **FASHION ERA: MODERN 2020s** (Unless story specifies a past year).
         
         | Scene Context       | Outfit Description                                      |
         |---------------------|---------------------------------------------------------|
         | Rejection/Sad       | **Home Clothes**: Hoodie, messy hair, sweatpants, T-shirt (NO food stains) |
         | Study/Library       | **Clean Casual**: Hoodie, glasses, casual (Exhausted look)|
         | Campus/Class        | **College Fit**: Tote bag, denim jacket, sneakers, casual |
         | Work/Internship     | **Smart Casual**: Techwear, Polo shirt, ID Badge, neat jeans |
         | Signing/Interview   | **Professional**: Blazer, Collared Shirt, Neat Hair     |
         | Graduation          | **GOWN + CAP** (Check University Branding Lookup)       |
         | Big Achievement     | **Neat/Modern**: Stylish shirt, confident look          |
         | Travel/Airport      | **Comfort**: Sweater, jeans, backpack, suitcase         |
         | Party/Night Out     | **Stylish**: Modern 2020s Fashion, layered, accessories |
         | Romance             | **Flattering Casual**: Soft textures, nice shirt/blouse |

         RULE: Never repeat the same outfit in unrelated scenes.

      4. TEXT PLACEMENT RULES:
         - Visual descriptions must allow for HEADROOM.
         - "Mid-shot with space above head" or "Wide shot with space below".

      ===========================================================
      PHASE 4: SELF-EVALUATION
      ===========================================================
      Check:
      1. Is the emotion raw? 
      2. Did I use specific University Colors (e.g. ASU Maroon)?
      3. Is the outfit correct for the scene?
      4. Is the background specific (Tesla Lab vs Generic Office)?
      5. Did I avoid gross messes (food) in sad scenes?

      ===========================================================
      OUTPUT FORMAT (JSON)
      ===========================================================
      Return a JSON object:
      {
        "title": "Story Title",
        "characterIdentityBlocks": [
           { "name": "Character Name", "identityBlock": "The CIB Text (Physical Traits Only)..." }
        ],
        "panels": [
          {
            "panelId": 1,
            "panelOutfit": "Specific outfit description for this panel",
            "visualDescription": "Detailed visual prompt... MUST start with 'Wearing [panelOutfit]...'",
            "dialogue": "Speech bubble text (Optional for silent panels)",
            "speaker": "Speaker Name",
            "narration": "Internal monologue / Caption"
          }
        ]
      }
    `;

    inputParts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: inputParts },
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a strict creative director. You prioritize visual consistency, real-world accuracy, and DEEP EMOTIONAL IMPACT.",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            characterIdentityBlocks: {
               type: Type.ARRAY,
               description: "List of character identity blocks",
               items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      identityBlock: { type: Type.STRING }
                  },
                  required: ["name", "identityBlock"]
               }
            },
            panels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  panelId: { type: Type.INTEGER },
                  panelOutfit: { type: Type.STRING, description: "Mandatory outfit description for this specific panel context" },
                  visualDescription: { type: Type.STRING },
                  dialogue: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                  narration: { type: Type.STRING },
                },
                required: ["panelId", "visualDescription", "panelOutfit"],
              },
            },
          },
          required: ["title", "panels", "characterIdentityBlocks"],
        },
      },
    });

    if (!response.text) throw new Error("Failed to generate script");
    
    const result = JSON.parse(response.text);
    
    // Transform the Array back to a Map/Record for the app to use
    const cibs: Record<string, string> = {};
    if (result.characterIdentityBlocks && Array.isArray(result.characterIdentityBlocks)) {
        result.characterIdentityBlocks.forEach((item: any) => {
            if (item.name && item.identityBlock) {
                cibs[item.name] = item.identityBlock;
            }
        });
    }
    
    return {
      title: result.title,
      panels: result.panels,
      characterIdentityBlocks: cibs
    };
  });
};

// --- Image Generation (The Illustrator) ---

export const generatePanelImage = async (
  visualDescription: string, 
  artStyle: ArtStyle,
  mainCharacter?: Character,
  cib?: string, // The fixed anchor text
  seed?: number,
  panelOutfit?: string // Passed from the script generator
): Promise<string> => {
  
  return retryWithBackoff(async () => {
    const modelName = "gemini-2.5-flash-image"; 
    
    // 1. Style Definition
    let styleRules = "";
    switch (artStyle) {
      case 'Cinematic': styleRules = "Cinematic Realism, 8k resolution, photorealistic textures, dramatic lighting, detailed background, depth of field, movie still aesthetic."; break;
      case 'Manga': styleRules = "Modern Manga, black and white ink, screentones, dramatic angles, emotional hatching."; break;
      case 'Ghibli': styleRules = "Studio Ghibli style, hand-painted watercolor backgrounds, lush atmosphere, Hayao Miyazaki aesthetic, emotional skies."; break;
      case 'Webtoon': styleRules = "Premium Webtoon style, crisp cel-shading, vibrant colors, vertical format, detailed background, expressive eyes."; break;
      case 'Anime': styleRules = "High-quality Anime, Kyoto Animation style, cinematic lighting, Makoto Shinkai inspired, emotional lens flare."; break;
      case 'Painterly': styleRules = "Digital painting, soft brushstrokes, atmospheric, semi-realistic, emotional palette."; break;
      case 'Chibi': styleRules = "Chibi style, cute, super deformed, large heads, expressive."; break;
    }

    // 2. Construct the Fixed Prompt Template (3-LAYER PIPELINE + EMOTION)
    const promptText = `
      CREATE A ${artStyle.toUpperCase()} PANEL.

      ===========================================================
      LAYER 0: MANDATORY OUTFIT (OVERRIDES EVERYTHING)
      ===========================================================
      OUTFIT: ${panelOutfit || "Consistent with scene context"}
      STYLE DATE: Modern 2020s Fashion. Avoid dated 2000s styles unless requested.
      
      CRITICAL: The character MUST be wearing the outfit described above. 
      IGNORE any clothing details found in the Reference Image.
      IGNORE any default clothing found in the CIB.
      Redraw the body/clothes completely to match this outfit.
      
      IF OUTFIT SPECIFIES COLORS (e.g. Maroon Gown), YOU MUST USE THOSE COLORS.

      ===========================================================
      LAYER 1: THE ANCHOR (CIB - PHYSICAL TRAITS ONLY)
      ===========================================================
      ${cib || "No specific character focus."}
      
      MANDATORY: The generated character MUST match the physical description above ≥90%.
      AGE CONSISTENCY: If the story implies a different age (Childhood, College), adjust proportions but keep facial identity.

      ===========================================================
      LAYER 2: FACE LOCK (REFERENCE IMAGE)
      ===========================================================
      Use the attached reference image(s) as a HARD CONSTRAINT for:
      - Facial Structure (Jaw, Nose, Eyes)
      - Skin Tone
      - Hair Texture
      - Ethnicity
      
      DO NOT USE THE REFERENCE IMAGE FOR CLOTHING. USE IT FOR FACE/HAIR ONLY.

      ===========================================================
      LAYER 3: SCENE & BACKGROUND
      ===========================================================
      SCENE: ${visualDescription}
      STYLE: ${styleRules}

      RULES:
      - BACKGROUNDS: Must be detailed and specific to the location (e.g. specific university landmarks, specific cities). Avoid generic blurs.
      - **NO FOOD, NO TRASH, NO DIRTY DISHES** in background unless scene explicitly asks for a meal.
      - Keep hairstyle consistent with CIB (unless scene explicitly changes it).
      - Do NOT alter ethnicity or skin tone.
      - Vertical portrait ratio.
      - No text/speech bubbles rendered in the image.

      ===========================================================
      LAYER 4: ATMOSPHERE & EMOTIONAL LIGHTING (THE "CRY" FACTOR)
      ===========================================================
      - IF SCENE IS SAD/STRUGGLE: Use cold color temperature (Blues, Greys). Low key lighting. Harsh shadows or Overcast soft light. Rain on windows. Isolation.
      - IF SCENE IS HAPPY/SUCCESS: Use warm color temperature (Golden Hour, Sunbeams). High saturation. Lens flares. Sparkles. Bloom.
      - IF SCENE IS NEUTRAL: Use natural cinematic lighting. Depth of field.
      
      EXPRESSIONS: Use micro-expressions. Tears in eyes. Quivering lips. Genuine smiles. Wide-eyed wonder. 
      Do not make faces generic. Make them feel the weight of the moment.
      Allow Surreal/Symbolic Elements (Floating letters, split screens) for First/Last panels if requested.

      ===========================================================
      COMPOSITION & FRAMING (CRITICAL)
      ===========================================================
      - **RULE: Character must occupy the LOWER 2/3 of the image.**
      - **RULE: Upper 1/3 must be empty/negative space (sky, wall, ceiling) for text placement.**
      - DO NOT place the face in the top 30% of the frame.
    `;

    const parts: any[] = [{ text: promptText }];

    // 3. Attach the "Face Lock" Reference Image
    if (mainCharacter) {
      parts.push({
        inlineData: {
          mimeType: mainCharacter.mimeType || "image/jpeg", 
          data: mainCharacter.imageBase64
        }
      });
    }

    // 4. Call Model
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        seed: seed // Use consistent seed for style stability
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
    throw new Error("No image generated");
  });
};
