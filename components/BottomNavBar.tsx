import React from 'react';
import { ClipboardList, Sparkles, Package } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

type MobileView = 'storyboard' | 'canvas' | 'assets';

interface BottomNavBarProps {
  activeView: MobileView;
  onViewChange: (view: MobileView) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange }) => {
  const { t } = useTranslation();

  const navItems = [
    { view: 'assets', icon: Package, label: t('navAssets') },
    { view: 'canvas', icon: Sparkles, label: t('navCanvas') },
    { view: 'storyboard', icon: ClipboardList, label: t('navStoryboard') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 flex justify-around items-center z-20 lg:hidden">
      {navItems.map(item => (
        <button
          key={item.view}
          onClick={() => onViewChange(item.view as MobileView)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            activeView === item.view
              ? 'text-blue-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'
          }`}
        >
          <item.icon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNavBar;