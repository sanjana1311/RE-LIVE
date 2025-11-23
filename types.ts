
export type ArtStyle = 'Anime' | 'Manga' | 'Chibi' | 'Painterly' | 'Webtoon' | 'Ghibli';

export type ColorPalette = 'Soft' | 'Bright' | 'Neutral' | 'Dark';

export interface Character {
  id: string;
  name: string;
  imageBase64: string;
  hairStyle?: string;
  outfit?: string;
  accessories: string[];
  colorPalette?: ColorPalette;
}

export interface PanelScript {
  panelId: number;
  visualDescription: string;
  dialogue?: string;
  speaker?: string;
  narration?: string;
}

export interface GeneratedPanel extends PanelScript {
  imageUrl: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export interface WebtoonState {
  step: 'input' | 'generating' | 'complete';
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
