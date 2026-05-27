import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, ArrowRight, X, RefreshCw, ImageIcon } from 'lucide-react';

interface Props {
  onCapture: (photo: string) => void;
  onBack: () => void;
}

const CaptureStep: React.FC<Props> = ({ onCapture, onBack }) => {
  const [mode, setMode] = useState<'choose' | 'camera' | 'upload'>('choose');
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    setMode('camera');
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Camera not available. Please upload a selfie instead.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(data);
    stopCamera();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const confirm = () => {
    if (preview) onCapture(preview);
  };

  const retake = () => {
    setPreview(null);
    setMode('choose');
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 mb-4">
            <span className="text-xs font-bold tracking-widest text-[#00D9FF]">STEP 2 OF 3</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            SHOW YOUR FACE.
          </h1>
          <p className="text-white/60">Snap a quick selfie or upload one — clear, well-lit, facing forward.</p>
        </div>

        <div className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur">
          {preview ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-[#00D9FF]/30 aspect-square max-w-sm mx-auto">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[#39FF14] text-[#0A0E27] text-xs font-bold">
                  ✓ READY
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={retake}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Retake
                </button>
                <button
                  onClick={confirm}
                  className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#39FF14] text-[#0A0E27] font-bold hover:scale-[1.02] transition-all"
                >
                  Apply Helmet & Generate
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : mode === 'camera' ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-square max-w-sm mx-auto bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute inset-0 border-4 border-dashed border-[#00D9FF]/30 m-6 rounded-full pointer-events-none" />
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                    <p className="text-sm text-white/80 text-center">{cameraError}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { stopCamera(); setMode('choose'); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={snapPhoto}
                  disabled={!!cameraError}
                  className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#39FF14] text-[#0A0E27] font-bold hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> Snap Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/5 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00D9FF]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Use Camera</h3>
                <p className="text-sm text-white/60">Snap a live selfie with your device camera</p>
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/5 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[#39FF14]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-[#39FF14]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Upload Selfie</h3>
                <p className="text-sm text-white/60">Choose an existing photo from your device</p>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          )}

          <button
            onClick={onBack}
            className="mt-6 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to details
          </button>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
          <ImageIcon className="w-5 h-5 text-[#00D9FF] shrink-0 mt-0.5" />
          <div className="text-xs text-white/60 space-y-1">
            <p className="font-semibold text-white/80">Tips for best results:</p>
            <p>• Face the camera directly with good lighting</p>
            <p>• Plain background works best</p>
            <p>• Make sure your forehead is visible (no hats)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureStep;
