import React from 'react';
import { X, Database, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { AivideoautoModel } from '../types';

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  aivideoautoImageModels: AivideoautoModel[];
  aivideoautoVideoModels: AivideoautoModel[];
}

const ModelInfoModal: React.FC<ModelInfoModalProps> = ({
  isOpen,
  onClose,
  aivideoautoImageModels,
  aivideoautoVideoModels,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col w-full max-w-4xl mx-auto h-[90vh] relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-info-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="model-info-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-500" /> {t('modelInfoTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            aria-label={t('cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* AIVideoAuto Image Models */}
          <section>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-slate-500" />
                {t('aivideoautoImageModels')}
            </h3>
            <div className="space-y-4">
              {aivideoautoImageModels.length > 0 ? (
                aivideoautoImageModels.map(model => (
                  <div key={model.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{model.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{model.description || 'No description available.'}</p>
                    <p className="text-xs text-slate-500 mt-2"><b>{t('modelId')}:</b> {model.id}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">{t('noModelsFound')}</p>
              )}
            </div>
          </section>

          {/* AIVideoAuto Video Models */}
          <section>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Video className="h-5 w-5 text-slate-500" />
                {t('aivideoautoVideoModels')}
            </h3>
            <div className="space-y-4">
              {aivideoautoVideoModels.length > 0 ? (
                aivideoautoVideoModels.map(model => (
                    <div key={model.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{model.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{model.description || 'No description available.'}</p>
                        <p className="text-xs text-slate-500 mt-2"><b>{t('modelId')}:</b> {model.id}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">{t('noModelsFound')}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ModelInfoModal;