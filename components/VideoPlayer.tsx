
import React from 'react';
import { Film, Download, RefreshCw } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface VideoPlayerProps {
  videoUrl: string;
  onClear: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onClear }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Film className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('videoReadyTitle')}</h2>
      </div>
      
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 mb-6 border border-slate-300 dark:border-slate-700">
        <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain">
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href={videoUrl}
          download="baby-gear-video.mp4"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transition-transform transform hover:scale-105"
        >
          <Download className="h-5 w-5" />
          <span>{t('downloadVideo')}</span>
        </a>
        <button
          onClick={onClear}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-transform transform hover:scale-105"
        >
          <RefreshCw className="h-5 w-5" />
          <span>{t('generateAnother')}</span>
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
