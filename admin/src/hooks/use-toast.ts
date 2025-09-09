import { useState, useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    console.log(`Toast: ${options.title} - ${options.description}`);
    // In a real implementation, this would trigger a toast notification
    // For now, we'll just console.log the message
    setToasts(prev => [...prev, options]);
    
    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== options));
    }, options.duration || 3000);
  }, []);

  return { toast, toasts };
}