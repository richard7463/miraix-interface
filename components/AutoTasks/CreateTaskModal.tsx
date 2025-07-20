"use client";

import React, { useState } from "react";
import { FiX, FiClock, FiPlay, FiBell, FiEdit3, FiCalendar, FiRepeat } from "react-icons/fi";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
}

const taskTypes = [
  {
    id: 'swap',
    name: 'Swap Task',
    description: 'Automated token swaps (e.g., swap 1 SOL to USDC every hour)',
    icon: FiPlay,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'bridge',
    name: 'Bridge Task',
    description: 'Automated cross-chain bridging (e.g., bridge 1 SOL)',
    icon: FiBell,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'stake',
    name: 'Stake Task',
    description: 'Automated staking operations (e.g., stake SOL for yield)',
    icon: FiEdit3,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'report',
    name: 'Report Task',
    description: 'Automated reports and notifications (e.g., daily market report)',
    icon: FiClock,
    color: 'from-orange-500 to-red-500'
  }
];

const scheduleOptions = [
  { id: 'hourly', label: 'Every Hour', description: 'Runs every hour' },
  { id: 'daily', label: 'Daily', description: 'Runs once per day' },
  { id: 'weekly', label: 'Weekly', description: 'Runs once per week' },
  { id: 'monthly', label: 'Monthly', description: 'Runs once per month' },
  { id: 'custom', label: 'Custom', description: 'Custom schedule' }
];

export default function CreateTaskModal({ isOpen, onClose, onSubmit }: CreateTaskModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [customSchedule, setCustomSchedule] = useState('');

  const handleSubmit = () => {
    const taskData = {
      name: taskName,
      description: taskDescription,
      type: selectedType,
      schedule: selectedSchedule === 'custom' ? customSchedule : selectedSchedule,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      actions: []
    };
    onSubmit(taskData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType('');
    setSelectedSchedule('');
    setTaskName('');
    setTaskDescription('');
    setCustomSchedule('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create Auto Task
          </h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Choose Task Type
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {taskTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          selectedType === type.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-3`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {type.name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Set Schedule
                </h4>
                <div className="space-y-3">
                  {scheduleOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSchedule(option.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedSchedule === option.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FiClock className="h-5 w-5 text-gray-400" />
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">
                            {option.label}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedSchedule === 'custom' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Schedule (Cron Expression)
                    </label>
                    <input
                      type="text"
                      value={customSchedule}
                      onChange={(e) => setCustomSchedule(e.target.value)}
                      placeholder="0 8 * * * (Daily at 8 AM)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use cron expression format: minute hour day month weekday
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Task Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="Enter task name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Describe what this task does"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Task Summary</h5>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div><span className="font-medium">Type:</span> {taskTypes.find(t => t.id === selectedType)?.name}</div>
                      <div><span className="font-medium">Schedule:</span> {scheduleOptions.find(s => s.id === selectedSchedule)?.label}</div>
                      {selectedSchedule === 'custom' && customSchedule && (
                        <div><span className="font-medium">Custom:</span> {customSchedule}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            disabled={
              (step === 1 && !selectedType) ||
              (step === 2 && !selectedSchedule) ||
              (step === 3 && (!taskName || !taskDescription))
            }
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Create Task' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
} 