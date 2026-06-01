export type Point = { x: number; y: number };

export type FaceLandmarks = {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  mouth: Point;
  jaw: Point;
};

export type FaceDetection = {
  box: { x: number; y: number; width: number; height: number };
  landmarks: FaceLandmarks;
  score: number;
};

export type SceneAnchor = {
  sceneId: string;
  imageWidth: number;
  imageHeight: number;
  centerFace: FaceDetection;
  skinSample: { x: number; y: number; width: number; height: number };
  helmet: { widthRatio: number; topOffsetRatio: number };
};

export type PipelineStage =
  | 'detect'
  | 'align'
  | 'swap'
  | 'headgear'
  | 'harmonize'
  | 'qc';

export type PipelineProgress = { stage: PipelineStage; message: string };

export type QcResult = {
  pass: boolean;
  headScaleRatio: number;
  skinToneDelta: number;
  issues: string[];
};
