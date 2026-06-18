import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformOpenUrl, SHARE_GUIDE_STEPS, type SocialPlatform } from '@/lib/socialShare';

interface Props {
  platform: SocialPlatform | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareGuideDialog({ platform, open, onOpenChange }: Props) {
  if (!platform) return null;

  const guide = SHARE_GUIDE_STEPS[platform];

  const openPlatform = () => {
    window.open(platformOpenUrl(platform), '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a1f44] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{guide.title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Facebook and Instagram cannot auto-fill your photo and caption from a website. Follow
            these steps:
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal list-inside space-y-3 text-sm text-slate-200 text-left">
          {guide.steps.map((step) => (
            <li key={step} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={openPlatform}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition"
          >
            <ExternalLink size={16} />
            {guide.openLabel}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
