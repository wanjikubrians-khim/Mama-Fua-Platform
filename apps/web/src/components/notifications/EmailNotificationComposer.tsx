'use client';
// Mama Fua — Email Notification Composer Component
// KhimTech | 2026

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Mail, 
  Send, 
  Users, 
  Calendar, 
  Star, 
  MessageSquare, 
  CreditCard, 
  BellRing,
  Eye,
  EyeOff,
  Save,
  X,
  Plus,
  Trash2,
  Clock,
  CheckCheck,
  Info
} from 'lucide-react';
import { userApi } from '@/lib/api';

const emailNotificationSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  recipientType: z.enum(['all', 'clients', 'cleaners', 'verified_cleaners', 'inactive_users']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  sendImmediately: z.boolean().default(false),
  scheduledTime: z.string().optional(),
});

type EmailNotification = z.infer<typeof emailNotificationSchema>;

interface EmailNotificationComposerProps {
  className?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmailNotificationComposer({ 
  className = '',
  onSuccess,
  onCancel 
}: EmailNotificationComposerProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const form = useForm<EmailNotification>({
    resolver: zodResolver(emailNotificationSchema),
    defaultValues: {
      subject: '',
      message: '',
      recipientType: 'all',
      priority: 'medium',
      sendImmediately: true,
      scheduledTime: '',
    },
  });

  const recipientOptions = [
    { value: 'all', label: 'All Users', description: 'Send to every registered user', count: 0 },
    { value: 'clients', label: 'Clients Only', description: 'Send to all client users', count: 0 },
    { value: 'cleaners', label: 'All Cleaners', description: 'Send to all cleaner users', count: 0 },
    { value: 'verified_cleaners', label: 'Verified Cleaners', description: 'Send to verified cleaners only', count: 0 },
    { value: 'inactive_users', label: 'Inactive Users', description: 'Send to users inactive for 30+ days', count: 0 },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  ];

  const templates = [
    {
      name: 'Welcome New Users',
      subject: 'Welcome to Mama Fua!',
      message: 'Thank you for joining Mama Fua! We\'re excited to have you on board. Get started by booking your first cleaning service and experience the convenience of professional cleaning at your fingertips.',
      category: 'onboarding',
    },
    {
      name: 'Promotional Offer',
      subject: 'Special Offer: 20% Off Your Next Booking!',
      message: 'As a valued customer, we\'re offering you 20% off your next booking. Use code CLEAN20 at checkout. This offer is valid for the next 7 days. Book now and save!',
      category: 'promotion',
    },
    {
      name: 'Service Update',
      subject: 'New Service Available: Deep Cleaning',
      message: 'We\'re excited to announce that deep cleaning services are now available on Mama Fua! Our professional deep cleaning service includes thorough cleaning of all surfaces, carpet shampooing, and more. Book now to experience the difference!',
      category: 'service_update',
    },
    {
      name: 'Maintenance Notice',
      subject: 'Scheduled Maintenance: Tonight 11 PM - 1 AM',
      message: 'Mama Fua will be undergoing scheduled maintenance tonight from 11 PM to 1 AM. During this time, the app will be unavailable for booking and tracking. We apologize for any inconvenience and appreciate your patience.',
      category: 'maintenance',
    },
    {
      name: 'Holiday Greetings',
      subject: 'Happy Holidays from Mama Fua!',
      message: 'Wishing you a wonderful holiday season! Thank you for being part of the Mama Fua family. May your celebrations be clean, bright, and full of joy. We look forward to serving you in the coming year!',
      category: 'holiday',
    },
  ];

  const handleRecipientTypeChange = async (type: string) => {
    form.setValue('recipientType', type as any);
    
	    try {
	      // Get count for selected recipient type
	      const response = await userApi.getUserCount(type);
	      setRecipientCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Failed to get user count:', error);
      setRecipientCount(0);
    }
  };

  const handleTemplateSelect = (template: any) => {
    form.setValue('subject', template.subject);
    form.setValue('message', template.message);
  };

  const handleSend = async (data: EmailNotification) => {
    setIsSending(true);
    
    try {
      await userApi.sendEmailNotification(data);
      setSentCount(prev => prev + 1);
      
      // Reset form
      form.reset();
      setRecipientCount(0);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to send notification:', error);
      setIsSending(false);
    } finally {
      setIsSending(false);
    }
  };

  const selectedPriority = form.watch('priority');
  const selectedPriorityOption = priorityOptions.find(p => p.value === selectedPriority);
  const scheduledTime = form.watch('scheduledTime');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink-900">Send Email Notification</h2>
        
        {sentCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCheck className="h-4 w-4" />
            <span>{sentCount} notification{sentCount > 1 ? 's' : ''} sent successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(handleSend)} className="space-y-6">
        {/* Recipient Selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-ink-900 mb-4">Recipients</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {recipientOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                <input
                  {...form.register('recipientType')}
                  type="radio"
                  value={option.value}
                  className="sr-only"
                  onChange={() => handleRecipientTypeChange(option.value)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink-900">{option.label}</p>
                      <p className="text-sm text-ink-600">{option.description}</p>
                    </div>
                    {recipientCount > 0 && form.watch('recipientType') === option.value && (
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
                        {recipientCount.toLocaleString()} users
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 text-sm text-ink-600">
            <Info className="inline h-4 w-4 mr-1" />
            Recipient counts are approximate and updated in real-time
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Subject</label>
            <input
              {...form.register('subject')}
              type="text"
              className="input"
              placeholder="Enter email subject..."
            />
            {form.formState.errors.subject && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.subject.message}</p>
            )}
          </div>

          {/* Templates */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Quick Templates</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="btn-ghost p-3 text-left text-sm"
                >
                  <div className="font-medium text-ink-900">{template.name}</div>
                  <div className="text-xs text-ink-500">{template.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Message</label>
            <textarea
              {...form.register('message')}
              rows={8}
              className="input resize-none"
              placeholder="Compose your message here..."
            />
            <div className="mt-1 flex justify-between">
              <span className="text-sm text-ink-500">{form.watch('message')?.length || 0} / 1000 characters</span>
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="btn-ghost px-3 py-1 text-sm"
              >
                {isPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            {form.formState.errors.message && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.message.message}</p>
            )}
          </div>
        </div>

        {/* Priority and Scheduling */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Priority */}
          <div>
            <label className="mb-3 block text-sm font-medium text-ink-700">Priority</label>
            <div className="space-y-2">
              {priorityOptions.map((priority) => (
                <label key={priority.value} className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-3 transition-colors hover:border-slate-300 hover:bg-slate-50 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                  <input
                    {...form.register('priority')}
                    type="radio"
                    value={priority.value}
                    className="sr-only"
                  />
                  <div className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${priority.color}`}>
                    {priority.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <input
                {...form.register('sendImmediately')}
                type="checkbox"
                className="h-4 w-4 text-brand-600 rounded"
                id="send-immediately"
              />
              <label htmlFor="send-immediately" className="text-sm font-medium text-ink-700">
                Send immediately
              </label>
            </div>

            {!form.watch('sendImmediately') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Schedule for</label>
                <input
                  {...form.register('scheduledTime')}
                  type="datetime-local"
                  className="input"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {isPreview && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-ink-900 mb-4">Preview</h3>
            
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-ink-900">{form.watch('subject') || 'No Subject'}</h4>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedPriorityOption?.color || 'bg-slate-100 text-slate-700'
                }`}>
                  Priority: {form.watch('priority')?.toUpperCase() || 'MEDIUM'}
                </div>
              </div>
              
              <div className="whitespace-pre-wrap text-sm text-ink-700">
                {form.watch('message') || 'No message content'}
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-ink-500">
                  To: {recipientOptions.find(r => r.value === form.watch('recipientType'))?.label || 'All Users'}
                </p>
	                <p className="text-xs text-ink-500">
	                  Scheduled:{' '}
	                  {form.watch('sendImmediately')
	                    ? 'Immediately'
	                    : scheduledTime
	                      ? new Date(scheduledTime).toLocaleString()
	                      : 'Not scheduled'}
	                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost px-6 py-3"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSending || !form.formState.isValid}
            className="btn-primary px-6 py-3"
          >
            {isSending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent border-r-transparent border-b-transparent border-l-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
