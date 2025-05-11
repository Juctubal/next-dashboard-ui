export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: string;
  status?: string;
  oneTimeId?: string;
  recurrentId?: string;
  completionId?: string;
  scheduleStartDate?: Date;
  scheduleEndDate?: Date;
  taskType?: string;
  taskCategory?: string;
  description?: string;
  completed?: boolean;
  taskDate?: Date;
  completionStatus?: boolean;
  repeatIndefinitely?: boolean;
}
