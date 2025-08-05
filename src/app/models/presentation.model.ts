export interface SlideElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  $type: 'text' | 'image';
}

export interface TextBlock extends SlideElementBase {
  $type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}
export interface ImageBlock extends SlideElementBase {
  $type: 'image';
  url: string;
}
export type SlideElement = TextBlock | ImageBlock;

export interface Slide {
  id: string;
  order: number;
  elements: SlideElement[];
}

export interface Presentation {
  id: string;
  title: string;
  creatorName: string;
  slides: Slide[];
}
