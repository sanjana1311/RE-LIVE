
export type ArtStyle = 'Anime' | 'Manga' | 'Chibi' | 'Painterly' | 'Webtoon' | 'Ghibli' | 'Cinematic';

export type ColorPalette = 'Soft' | 'Bright' | 'Neutral' | 'Dark';

export interface Character {
  id: string;
  name: string;
  imageBase64: string;
  mimeType?: string; // Mime type of the image (e.g., 'image/jpeg')
  hairStyle?: string;
  outfit?: string;
  accessories: string[];
  colorPalette?: ColorPalette;
  description?: string; // Optional user description (e.g. Ethnicity, Vibe)
  cib?: string; // Character Identity Block - The canonical text anchor
}

export interface PanelScript {
  panelId: number;
  visualDescription: string;
  dialogue?: string;
  speaker?: string;
  narration?: string;
  panelOutfit?: string;
}

export interface GeneratedPanel extends PanelScript {
  imageUrl: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export interface SavedStory {
  id: string;
  title: string;
  date: number; // Timestamp
  panels: GeneratedPanel[];
  artStyle: ArtStyle;
}

export interface WebtoonState {
  step: 'input' | 'generating' | 'complete' | 'memories';
  story: string;
  characters: Character[];
  title: string;
  panels: GeneratedPanel[];
  currentGenerationIndex: number;
  artStyle: ArtStyle;
}

export enum GenerationStage {
  IDLE = 'IDLE',
  WRITING_SCRIPT = 'WRITING_SCRIPT',
  DRAWING_PANELS = 'DRAWING_PANELS',
  FINALIZING = 'FINALIZING'
}
