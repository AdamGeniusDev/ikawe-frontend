// types/notification.ts

export type NotificationType =
  | 'task_assigned'
  | 'annotation_validated'
  | 'annotation_rejected'
  | 'dataset_shared'
  | 'payment_ready'
  | 'new_member'

export interface AppNotification {
  id:        string
  userId:    string
  type:      NotificationType
  title:     string
  message:   string
  read:      boolean
  createdAt: Date
  link?:     string
}