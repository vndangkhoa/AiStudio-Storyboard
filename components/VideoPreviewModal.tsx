import React from 'react';
import { X } from 'lucide-react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  videoUrl: string;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ isOpen, videoUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the video player itself
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 rounded-full text-white hover:bg-white/20 transition"
          aria-label="Close video preview"
        >
          <X className="h-6 w-6" />
        </button>

        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          loop 
          className="w-full h-full object-contain rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default VideoPreviewModal;