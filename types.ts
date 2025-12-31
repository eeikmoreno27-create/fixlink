
export type DrumType = 'SNARE' | 'TOM' | 'FLOOR_TOM' | 'KICK';
export type TuningSide = 'BATTER' | 'RESONANT';
export type MusicalGenre = 'VERSATILE' | 'NORTENO' | 'NORTENO_SAX' | 'CUMBIA' | 'HUAPANGO' | 'ZAPATEADO' | 'ROCK_POP' | 'METAL' | 'JAZZ';
export type TuningStrategy = 'UNISON' | 'RESO_HIGHER' | 'BATTER_HIGHER';

export interface DrumSpecs {
  id?: string;
  name?: string;
  brand: string;
  model: string;
  material: 'WOOD' | 'METAL' | 'ACRYLIC';
  diameter: number;
  depth: number;
  lugs: number;
  type: DrumType;
  genre: MusicalGenre;
  strategy: TuningStrategy;
  
  batterBrand: string;
  batterModel: string;
  resonantBrand: string;
  resonantModel: string;
  
  targetPitchBatter: number;
  targetPitchReso: number;
  targetNote?: string;
}
