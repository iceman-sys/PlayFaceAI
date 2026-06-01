export type InlineImage = { mimeType: string; base64: string };

export type GeneratePortraitInput = {
  selfie: string;
  sceneUrl: string;
  helmetUrl: string;
  campaignId?: string;
  targetPlayer?: string;
};

export type GeneratePortraitResult = {
  imageUrl: string;
  model: string;
  provider?: ImageProvider;
  /** Pipeline stages completed, e.g. ["face","headgear","harmonize"] */
  passes?: string[];
};

export type ImageProvider = 'openai' | 'gemini' | 'pipeline' | 'hybrid';
