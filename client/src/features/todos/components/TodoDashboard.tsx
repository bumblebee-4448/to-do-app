import { useMemo, useRef } from 'react';
import {
  CircleCheck,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { Sidebar, type SidebarFeatureId } from '../../../components/ui/Sidebar';
import { useTodoDashboard } from '../hooks/useTodoDashboard';
import { KanbanColumn } from './KanbanColumn';
import { DashboardFilters } from './DashboardFilters';
import { DashboardTopbar } from './DashboardTopbar';
import { DashboardViewTabs } from './DashboardViewTabs';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/AlertDialog';
import {
  Dialog,
  DialogContent,
} from '../../../components/ui/Dialog';

export const TodoDashboard = () => {
  const dashboard = useTodoDashboard();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeSidebarFeature: SidebarFeatureId = useMemo(() => {
    if (dashboard.view === 'list') {
      return 'list';
    }
    return 'board';
  }, [dashboard.view]);

  const renderBoard = () => (
    <section className="kanban-board">
      {(!dashboard.status || dashboard.status === 'pending') && (
        <KanbanColumn
          column="list"
          id="list-col"
          title="Danh sách công việc"
          icon={<ListChecks size={16} strokeWidth={2.5} style={{ color: '#a1a1aa' }} />}
          todos={dashboard.board.columns.list}
          isLoading={dashboard.board.queries.pending.isLoading}
          isError={dashboard.board.queries.pending.isError}
          error={dashboard.board.queries.pending.error}
          enterClass="col-enter-1"
          onDelete={dashboard.handleDelete}
          onEdit={dashboard.handleOpenEdit}
          onToggle={dashboard.handleToggle}
          onDropTodo={dashboard.handleDropTodo}
          onAddTask={() => dashboard.handleOpenCreate('list')}
          pagination={{
            page: dashboard.board.pages.pending,
            totalPages: dashboard.board.queries.pending.data?.pagination?.totalPages ?? 1,
            hasNextPage: Boolean(dashboard.board.queries.pending.data?.pagination?.hasNextPage),
            hasPrevPage: Boolean(dashboard.board.queries.pending.data?.pagination?.hasPrevPage),
            onPageChange: (nextPage) => dashboard.board.setColumnPage('pending', nextPage),
          }}
        />
      )}

      {(!dashboard.status || dashboard.status === 'incomplete') && (
        <KanbanColumn
          column="incomplete"
          id="incomplete-col"
          title="Chưa hoàn thành"
          icon={<Sparkles size={16} style={{ color: '#f59e0b' }} />}
          todos={dashboard.board.columns.incomplete}
          isLoading={dashboard.board.queries.incomplete.isLoading}
          isError={dashboard.board.queries.incomplete.isError}
          error={dashboard.board.queries.incomplete.error}
          enterClass="col-enter-2"
          onDelete={dashboard.handleDelete}
          onEdit={dashboard.handleOpenEdit}
          onToggle={dashboard.handleToggle}
          onDropTodo={dashboard.handleDropTodo}
          onAddTask={() => dashboard.handleOpenCreate('incomplete')}
          pagination={{
            page: dashboard.board.pages.incomplete,
            totalPages: dashboard.board.queries.incomplete.data?.pagination?.totalPages ?? 1,
            hasNextPage: Boolean(dashboard.board.queries.incomplete.data?.pagination?.hasNextPage),
            hasPrevPage: Boolean(dashboard.board.queries.incomplete.data?.pagination?.hasPrevPage),
            onPageChange: (nextPage) => dashboard.board.setColumnPage('incomplete', nextPage),
          }}
        />
      )}

      {(!dashboard.status || dashboard.status === 'completed') && (
        <KanbanColumn
          column="done"
          id="done-col"
          title="Hoàn thành"
          icon={<CircleCheck size={16} style={{ color: '#22c55e' }} />}
          todos={dashboard.board.columns.done}
          isLoading={dashboard.board.queries.completed.isLoading}
          isError={dashboard.board.queries.completed.isError}
          error={dashboard.board.queries.completed.error}
          enterClass="col-enter-3"
          onDelete={dashboard.handleDelete}
          onEdit={dashboard.handleOpenEdit}
          onToggle={dashboard.handleToggle}
          onDropTodo={dashboard.handleDropTodo}
          pagination={{
            page: dashboard.board.pages.completed,
            totalPages: dashboard.board.queries.completed.data?.pagination?.totalPages ?? 1,
            hasNextPage: Boolean(dashboard.board.queries.completed.data?.pagination?.hasNextPage),
            hasPrevPage: Boolean(dashboard.board.queries.completed.data?.pagination?.hasPrevPage),
            onPageChange: (nextPage) => dashboard.board.setColumnPage('completed', nextPage),
          }}
        />
      )}
    </section>
  );

  const renderList = () => (
    <section className="dashboard-panel-view dashboard-panel-view--list">
      <TodoList
        error={dashboard.todosQuery.error}
        page={dashboard.page}
        totalPages={dashboard.totalPages}
        hasNextPage={Boolean(dashboard.todosQuery.data?.pagination?.hasNextPage)}
        hasPrevPage={Boolean(dashboard.todosQuery.data?.pagination?.hasPrevPage)}
        isError={dashboard.todosQuery.isError}
        isLoading={dashboard.todosQuery.isLoading}
        todos={dashboard.todos}
        onDelete={dashboard.handleDelete}
        onEdit={dashboard.handleOpenEdit}
        onPageChange={dashboard.setPage}
        onToggle={dashboard.handleToggle}
      />
    </section>
  );

  const renderContent = () => {
    if (dashboard.view === 'list') {
      return renderList();
    }
    return renderBoard();
  };

  return (
    <ErrorBoundary>
      <div
        className={`app-shell app-shell--floating-sidebar app-shell--unified-surface shell-enter dashboard-enter ${
          dashboard.isSidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''
        }`}
      >
        {/* Sidebar */}
        <Sidebar 
          isOpen={dashboard.isSidebarOpen}
          onClose={() => dashboard.setIsSidebarOpen(false)}
          onCreateTodo={() => dashboard.handleOpenCreate('list')}
          onFocusSearch={() => searchInputRef.current?.focus()}
          onSelectBoard={() => dashboard.showAllTasksInView('board')}
          onSelectList={() => dashboard.showAllTasksInView('list')}
          activeFeature={activeSidebarFeature}
          isCollapsed={dashboard.isSidebarCollapsed}
          onToggleCollapse={() => dashboard.setIsSidebarCollapsed(!dashboard.isSidebarCollapsed)}
          className="sidebar-enter dashboard-enter__sidebar"
        />

        {/* Main */}
        <main className="main-content main-content--floating-sidebar main-content--plain-surface content-enter dashboard-enter__main">

          {/* ── Topbar / Combined Header ───────────────────────── */}
          <DashboardTopbar
            isSidebarCollapsed={dashboard.isSidebarCollapsed}
            onOpenSidebar={dashboard.handleOpenSidebar}
          />

          {/* ── View tabs + actions row ───────────────────────── */}
          <div className="dashboard-actions-row">
            <DashboardViewTabs view={dashboard.view} onViewChange={dashboard.setView} />
            <DashboardFilters
              isOpen={dashboard.isFilterOpen}
              search={dashboard.search}
              searchInputRef={searchInputRef}
              sortBy={dashboard.sortBy}
              status={dashboard.status}
              onAddTodo={() => dashboard.handleOpenCreate('list')}
              onSearchChange={dashboard.handleSearchChange}
              onSortByChange={dashboard.handleSortByChange}
              onStatusChange={dashboard.handleStatusChange}
              onToggleFilters={() => dashboard.setIsFilterOpen(!dashboard.isFilterOpen)}
            />
          </div>

          <section
            className={`dashboard-content dashboard-content--${dashboard.view} dashboard-enter__content`}
            aria-label="Nội dung dashboard"
            data-view={dashboard.view}
          >
            {renderContent()}
          </section>
        </main>

        {/* ── Confirm Delete Dialog ─────────────────────────── */}
        <AlertDialog open={!!dashboard.todoToDelete} onOpenChange={(open) => !open && dashboard.setTodoToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Công việc "{dashboard.todoToDelete?.title}" sẽ bị xóa vĩnh viễn khỏi danh sách.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={dashboard.handleConfirmDelete}>Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Task Modal ─────────────────────────────────────── */}
        <Dialog open={dashboard.isFormOpen} onOpenChange={dashboard.setIsFormOpen}>
          <DialogContent aria-describedby={undefined}>
            <TodoForm
              editingTodo={dashboard.editingTodo}
              isSaving={dashboard.createTodo.isPending || dashboard.updateTodo.isPending}
              onCancelEdit={() => dashboard.setIsFormOpen(false)}
              onSubmit={dashboard.handleSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};
export default TodoDashboard;
