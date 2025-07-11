export interface CardStyle {
  name: string;
  id: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  accentColor: string;
  borderRadius: number;
  padding: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  gradient?: {
    start: string;
    end: string;
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface MarkdownContent {
  type: string;
  content: string;
  level?: number;
  items?: string[];
  language?: string;
  headers?: string[];
  rows?: string[][];
}

export interface CardConfig {
  width: number;
  height: number;
  style: CardStyle;
  content: MarkdownContent[];
  title?: string;
  watermark?: string;
  format?: 'png' | 'jpg' | 'jpeg';
  quality?: number;
  autoHeight?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  imageUrl?: string;
}