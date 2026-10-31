import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TaskModal } from '../components/tasks/TaskModal';
import { Task, TaskPriority, TaskStatus } from '../lib/types';
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  Kanban,
  List,
  Edit,
} from 'lucide-react';
import { formatDate, getPriorityBadge } from '../lib/utils';
import { Link } from 'react-router-dom';

export const TasksPage: React.FC = () => {
  const { tasks, toggleTaskStatus, candidates, companies, team } = useData();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    }
    return true;
  });

  const kanbanColumns: TaskStatus[] = ['To Do', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Follow-up Action Items"
        subtitle={`Coordinating ${tasks.length} critical actions across candidate preparation, partner requests, and drive logistics.`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Task
          </Button>
        }
      />

      {/* Filter and View Toolbar */}
      <Card className="p-4 border border-charcoal-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 font-medium text-charcoal-800"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 font-medium text-charcoal-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-charcoal-200">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'list' ? 'bg-white text-brand-600 shadow-xs' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-brand-600 shadow-xs' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" /> Kanban
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-charcoal-400 bg-white rounded-xl border border-charcoal-200">
              No tasks matched your criteria.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'Completed';
              const isOverdue = !isCompleted && task.status !== 'Cancelled' && new Date(task.due_date) < new Date();
              const cand = candidates.find((c) => c.id === task.related_candidate_id);
              const comp = companies.find((c) => c.id === task.related_company_id);
              const owner = team.find((t) => t.id === task.owner_id);

              return (
                <Card
                  key={task.id}
                  className={`p-4 transition-all border ${
                    isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-charcoal-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 text-charcoal-400 hover:text-brand-600 transition-colors"
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-charcoal-300" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs font-bold leading-tight ${
                              isCompleted ? 'line-through text-charcoal-400' : 'text-charcoal-900'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.2 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-charcoal-500 mt-1 leading-normal">{task.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-charcoal-400 mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-brand-500" />
                            Due: {formatDate(task.due_date)}
                          </span>

                          {cand && (
                            <Link to={`/candidates/${cand.id}`} className="text-brand-600 hover:underline">
                              Candidate: {cand.full_name}
                            </Link>
                          )}

                          {comp && (
                            <Link to={`/companies/${comp.id}`} className="text-brand-600 hover:underline">
                              Company: {comp.name}
                            </Link>
                          )}

                          {owner && <span>Owner: {owner.full_name}</span>}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTask(task);
                        setTaskModalOpen(true);
                      }}
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div key={col} className="bg-surface-50 rounded-2xl p-3 border border-charcoal-200 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-charcoal-200">
                  <h4 className="text-xs font-bold text-charcoal-900">{col}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white border border-charcoal-200 text-charcoal-700">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-charcoal-400">No tasks in this lane</div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setEditingTask(t);
                          setTaskModalOpen(true);
                        }}
                        className="p-3 bg-white rounded-xl border border-charcoal-200 shadow-card hover:shadow-card-hover cursor-pointer transition-all space-y-1.5"
                      >
                        <span
                          className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                        <h5 className="text-xs font-bold text-charcoal-900 leading-snug">{t.title}</h5>
                        <p className="text-[10px] text-charcoal-400">Due: {formatDate(t.due_date)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        initialTask={editingTask}
      />
    </div>
  );
};
