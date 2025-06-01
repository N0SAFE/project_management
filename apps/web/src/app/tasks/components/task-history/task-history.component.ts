import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskHistory, TaskHistoryService } from '../../services/task-history/task-history.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmBadgeDirective,
    HlmH3Directive,
    HlmMutedDirective
  ],
  templateUrl: './task-history.component.html',
  styleUrl: './task-history.component.scss'
})
export class TaskHistoryComponent implements OnInit {
  @Input() taskId?: number;
  @Input() projectId?: number;
  @Input() showTaskHistory: boolean = true; // Show task-specific history
  @Input() showProjectActivity: boolean = false; // Show project-wide activity
  @Input() maxItems: number = 20;

  history: TaskHistory[] = [];
  loading = false;
  error: string | null = null;

  private taskHistoryService = inject(TaskHistoryService);

  ngOnInit() {
    this.loadHistory();
  }

  async loadHistory() {
    if (!this.taskId && !this.projectId) {
      this.error = 'Either taskId or projectId must be provided';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      if (this.showTaskHistory && this.taskId) {
        // Load task-specific history
        if (this.maxItems > 0) {
          const page = await this.taskHistoryService.getTaskHistory(this.taskId, 0, this.maxItems);
          this.history = page.content;
        } else {
          this.history = await this.taskHistoryService.getAllTaskHistory(this.taskId);
        }
      } else if (this.showProjectActivity && this.projectId) {
        // Load project-wide activity
        this.history = await this.taskHistoryService.getRecentProjectActivity(this.projectId);
      }
    } catch (error) {
      console.error('Failed to load task history:', error);
      this.error = 'Failed to load task history';
    } finally {
      this.loading = false;
    }
  }

  formatAction(action: TaskHistory['action']): string {
    return this.taskHistoryService.formatAction(action);
  }

  formatFieldName(fieldName: string): string {
    return this.taskHistoryService.formatFieldName(fieldName);
  }

  getChangeSummary(historyItem: TaskHistory): string {
    return this.taskHistoryService.getChangeSummary(historyItem);
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  getActionIcon(action: TaskHistory['action']): string {
    const iconMap = {
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'ASSIGN': '👤',
      'UNASSIGN': '👤',
      'STATUS_CHANGE': '🔄',
      'PRIORITY_CHANGE': '⚡'
    };
    return iconMap[action] || '📝';
  }

  getActionColor(action: TaskHistory['action']): string {
    const colorMap = {
      'CREATE': 'bg-green-500',
      'UPDATE': 'bg-blue-500',
      'DELETE': 'bg-destructive',
      'ASSIGN': 'bg-purple-500',
      'UNASSIGN': 'bg-muted-foreground',
      'STATUS_CHANGE': 'bg-orange-500',
      'PRIORITY_CHANGE': 'bg-yellow-500'
    };
    return colorMap[action] || 'bg-muted-foreground';
  }

  getActionColorClass(action: TaskHistory['action']): string {
    return this.getActionColor(action);
  }

  trackByHistoryId(index: number, item: TaskHistory): number {
    return item.id;
  }

  async loadMoreHistory() {
    if (this.loading) {
      return;
    }
    
    // For now, just reload the history with a larger limit
    // In a full implementation, this would handle pagination
    if (this.maxItems < 100) {
      this.maxItems += 20;
      await this.loadHistory();
    }
  }
}
