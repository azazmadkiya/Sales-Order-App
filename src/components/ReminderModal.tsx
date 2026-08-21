import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { SalesOrder } from '../types';
import { formatDateDisplay } from '../utils/taxCalculator';

interface ReminderModalProps {
  order: SalesOrder;
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (orderId: string, reminderData: {
    hasReminder: boolean;
    reminderDate?: string;
    reminderTime?: string;
    reminderNotes?: string;
    isReminderCompleted?: boolean;
    priority?: 'Normal' | 'High' | 'Urgent';
  }) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSaveReminder,
}) => {
  const [reminderDate, setReminderDate] = useState<string>(
    order.reminderDate || new Date().toISOString().split('T')[0]
  );
  const [reminderTime, setReminderTime] = useState<string>(order.reminderTime || '11:00');
  const [reminderNotes, setReminderNotes] = useState<string>(
    order.reminderNotes || `Follow up with ${order.partyName} for order dispatch.`
  );
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>(
    order.priority || 'High'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(
    order.isReminderCompleted || false
  );

  if (!isOpen) return null;

  const handleSetPresetDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setReminderDate(d.toISOString().split('T')[0]);
  };

  const handleSave = () => {
    onSaveReminder(order.id, {
      hasReminder: true,
      reminderDate,
      reminderTime,
      reminderNotes: reminderNotes.trim(),
      isReminderCompleted: isCompleted,
      priority,
    });
    onClose();
  };

  const handleRemoveReminder = () => {
    onSaveReminder(order.id, {
      hasReminder: false,
      reminderDate: undefined,
      reminderTime: undefined,
      reminderNotes: undefined,
      isReminderCompleted: false,
      priority: 'Normal',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-amber-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Order Follow-up Reminder
              </h3>
              <p className="text-xs text-amber-100 font-mono">
                Order: {order.orderNo} • {order.partyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Quick Date Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick Schedule:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSetPresetDate(0)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium text-xs border border-slate-300"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium text-xs border border-slate-300"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(3)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium text-xs border border-slate-300"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetDate(7)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium text-xs border border-slate-300"
              >
                In 1 Week
              </button>
            </div>
          </div>

          {/* Date & Time Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reminder Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Normal', 'High', 'Urgent'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    priority === lvl
                      ? lvl === 'Urgent'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : lvl === 'High'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {lvl === 'Urgent' ? '🔥 Urgent' : lvl === 'High' ? '⚡ High' : '🔵 Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Follow-up Message / Task Note
            </label>
            <textarea
              rows={3}
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              placeholder="e.g. Call transporter for vehicle loading, Confirm dispatch with party..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            />
          </div>

          {/* Completed Checkbox */}
          {order.hasReminder && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="completeReminder"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="completeReminder" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Mark Reminder as Done / Resolved
              </label>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          {order.hasReminder ? (
            <button
              type="button"
              onClick={handleRemoveReminder}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Reminder</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Save Reminder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
