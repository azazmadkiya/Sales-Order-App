import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  MoreVertical, 
  PlusSquare, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, triggerInstall, hasNativePrompt } = usePwaInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const installed = await triggerInstall();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md font-bold text-sm">
              SOA
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 leading-tight">Install Android App</h3>
              <p className="text-xs text-slate-400">Add shortcut to home screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {installSuccess || isInstalled ? (
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-emerald-300 text-sm">App Successfully Installed!</p>
              <p className="text-xs text-slate-300">
                You can now open "Sales Order App" directly from your phone's Home Screen or App Drawer.
              </p>
            </div>
          ) : (
            <>
              {/* Primary 1-Click Install Button (When prompt is ready) */}
              {hasNativePrompt ? (
                <div className="space-y-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 cursor-pointer text-sm"
                  >
                    <Download className="w-5 h-5" />
                    <span>Click To Install Android App</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    Creates 1-click standalone app shortcut on your phone
                  </p>
                </div>
              ) : (
                /* Android Chrome Manual Guide (Like user screenshot) */
                <div className="space-y-3">
                  <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2.5">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                      How to Install & Create Shortcut on Android:
                    </span>

                    <div className="flex items-start space-x-3 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        Tap the <strong className="text-slate-100 font-bold">3 dots (⋮)</strong> menu icon at the top-right corner of your browser.
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        Select <strong className="text-emerald-400 font-bold underline decoration-emerald-500/50">"Install and create shortcut"</strong> or <strong className="text-slate-100 font-bold">"Add to Home screen"</strong>.
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        Tap <strong className="text-slate-100 font-bold">"Install"</strong> to add the icon to your Android home screen!
                      </div>
                    </div>
                  </div>

                  {/* Visual Hint Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center space-x-3 text-xs text-slate-400">
                    <div className="p-2 bg-blue-950 text-blue-400 rounded-lg shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">Full Screen Standalone Mode</p>
                      <p className="text-[11px] text-slate-400">Opens without browser URL bar for fast daily order entry.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Points */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5 bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Fast Instant Loading</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Secure Cloud Sync</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
