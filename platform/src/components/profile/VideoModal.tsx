import React from "react";
import { X } from "lucide-react";

interface VideoModalProps {
  playingVideoId: string | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  playingVideoId,
  onClose,
}) => {
  if (!playingVideoId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[720px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 bg-black/50 border-none text-white w-8 h-8 rounded-full cursor-pointer flex items-center justify-center font-bold z-10 transition-colors duration-200 hover:bg-black/80"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        {/* 16:9 iframe wrapper */}
        <div className="relative pb-[56.25%] h-0">
          <iframe
            className="absolute top-0 left-0 w-full h-full border-none"
            src={`https://www.youtube-nocookie.com/embed/${playingVideoId}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
