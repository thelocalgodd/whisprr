// Main API client and types
export * from '@/lib/api';

// Authentication services
export * from './auth';

// User management services
export * from './user';

// Conversation and messaging services
export * from './conversation';

// Group services
export * from './group';

// Resource services
export * from './resource';

// Counselor services
export * from './counselor';

// Notification and search services
export * from './notification';

// Re-export the main API client as default
export { default as apiClient } from '@/lib/api';