"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/Themes";
import { FiPlus, FiClock, FiPlay, FiPause, FiTrash2, FiEdit3, FiBell } from "react-icons/fi";
import CreateTaskModal from "@/components/AutoTasks/CreateTaskModal";
import toast from "react-hot-toast";

// 任务类型定义
interface AutoTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  status: 'active' | 'paused' | 'draft';
  type: 'swap' | 'bridge' | 'stake' | 'report';
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  actions: string[];
}

// 示例任务数据
const mockTasks: AutoTask[] = [
  {
    id: "1",
    name: "Daily Market Report",
    description: "Automated daily market analysis and trending tokens report delivered via Discord",
    schedule: "Daily at 8:00 AM EST",
    status: 'active',
    type: 'report',
    lastRun: "2024-01-15T08:00:00Z",
    nextRun: "2024-01-16T08:00:00Z",
    createdAt: "2024-01-10T10:00:00Z",
    actions: ["Generate market report", "Send to Discord"]
  },
  {
    id: "2",
    name: "Hourly SOL to USDC Swap",
    description: "Automatically swap 1 SOL to USDC every hour for DCA strategy",
    schedule: "Every 1 hour",
    status: 'paused',
    type: 'swap',
    lastRun: "2024-01-15T14:00:00Z",
    nextRun: "2024-01-15T15:00:00Z",
    createdAt: "2024-01-12T15:30:00Z",
    actions: ["Swap 1 SOL to USDC", "Log transaction"]
  },
  {
    id: "3",
    name: "Bridge SOL to Ethereum",
    description: "Automatically bridge 1 SOL to Ethereum when gas fees are low",
    schedule: "Daily at 2:00 AM EST",
    status: 'active',
    type: 'bridge',
    lastRun: "2024-01-15T02:00:00Z",
    nextRun: "2024-01-16T02:00:00Z",
    createdAt: "2024-01-13T09:15:00Z",
    actions: ["Check gas fees", "Bridge 1 SOL", "Log transaction"]
  },
  {
    id: "4",
    name: "Stake SOL for Yield",
    description: "Automatically stake available SOL for maximum yield",
    schedule: "Every 6 hours",
    status: 'draft',
    type: 'stake',
    createdAt: "2024-01-14T16:45:00Z",
    actions: ["Check available SOL", "Find best staking rate", "Execute stake"]
  }
];

const taskTypes = [
  { id: 'all', name: 'All Tasks', icon: FiClock },
  { id: 'swap', name: 'Swap Tasks', icon: FiPlay },
  { id: 'bridge', name: 'Bridge Tasks', icon: FiBell },
  { id: 'stake', name: 'Stake Tasks', icon: FiEdit3 },
  { id: 'report', name: 'Reports', icon: FiClock }
];

export default function AutoTasksPage() {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AutoTask[]>(mockTasks);

  // Filter tasks by type
  const filteredTasks = tasks.filter(
    (task) => selectedType === "all" || task.type === selectedType
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'draft':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'draft':
        return 'Draft';
      default:
        return 'Unknown';
    }
  };

  const formatSchedule = (schedule: string) => {
    return schedule;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateTask = (taskData: any) => {
    const newTask: AutoTask = {
      ...taskData,
      id: Date.now().toString(),
      actions: getDefaultActions(taskData.type)
    };
    setTasks(prev => [newTask, ...prev]);
    toast.success('Task created successfully!');
  };

  const getDefaultActions = (type: string): string[] => {
    switch (type) {
      case 'swap':
        return ['Execute swap', 'Log transaction', 'Update balance'];
      case 'bridge':
        return ['Check gas fees', 'Execute bridge', 'Log transaction'];
      case 'stake':
        return ['Check available funds', 'Find best rate', 'Execute stake'];
      case 'report':
        return ['Generate report', 'Send notification', 'Store data'];
      default:
        return [];
    }
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'active' ? 'paused' : 'active';
        return { ...task, status: newStatus };
      }
      return task;
    }));
    toast.success('Task status updated!');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted!');
  };

  return (
    <main
      className="min-h-screen pt-24 pb-16 overflow-y-auto relative"
      style={{ backgroundColor: theme === "light" ? "#F8F9FB" : "#27272a" }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
            Auto Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create and manage automated DeFi tasks that run on schedule. Set up swaps, bridges, staking, and reports.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Task Type Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {taskTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`inline-flex items-center gap-2 rounded-full border text-sm font-medium transition-all duration-300 cursor-pointer px-4 py-2 whitespace-nowrap ${
                    selectedType === type.id
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                      : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200/50 dark:border-gray-700/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {type.name}
                </button>
              );
            })}
          </div>

          {/* Create Task Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="h-4 w-4" />
            Create Task
          </button>
        </div>

        {/* Task Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-6 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                hoveredTask === task.id ? "ring-2 ring-green-500" : ""
              }`}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              {/* Card decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 truncate">
                      {task.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FiClock className="h-4 w-4" />
                  <span>{formatSchedule(task.schedule)}</span>
                </div>

                {/* Last/Next Run */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {task.lastRun && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                      <div className="text-gray-700 dark:text-gray-300 font-medium">
                        {formatDateTime(task.lastRun)}
                      </div>
                    </div>
                  )}
                  {task.nextRun && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                      <div className="text-gray-700 dark:text-gray-300 font-medium">
                        {formatDateTime(task.nextRun)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Actions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {task.actions.map((action, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskStatus(task.id);
                      }}
                      className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      title={task.status === 'active' ? 'Pause Task' : 'Activate Task'}
                    >
                      {task.status === 'active' ? (
                        <FiPause className="h-4 w-4" />
                      ) : (
                        <FiPlay className="h-4 w-4" />
                      )}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement edit functionality
                        toast.success('Edit functionality coming soon!');
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <FiEdit3 className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Task"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FiClock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {selectedType === 'all' 
                ? "Get started by creating your first automated task."
                : `No ${selectedType} tasks found. Try creating one!`
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              <FiPlus className="h-4 w-4" />
              Create Your First Task
            </button>
          </div>
        )}

        {/* Coming Soon Notice */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FiBell className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              Coming Soon
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced DeFi automation features will be available soon. You'll be able to create complex workflows, 
            conditional triggers based on market conditions, and integrate with external services.
          </p>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
      />
    </main>
  );
} 