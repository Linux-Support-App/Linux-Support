import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface MediaPreviewProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  alt?: string;
}

export function MediaPreview({ imageUrl, videoUrl, alt = "Media preview" }: MediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl && !videoUrl) return null;

  if (videoUrl) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-border" data-testid="media-video">
        <div className="aspect-video relative">
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain bg-black"
          />
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div 
            className="my-4 rounded-lg overflow-hidden border border-border cursor-pointer group relative"
            data-testid="media-image"
          >
            <img
              src={imageUrl}
              alt={alt}
              className="w-full max-h-96 object-contain bg-muted"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-50"
            data-testid="button-close-lightbox"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
