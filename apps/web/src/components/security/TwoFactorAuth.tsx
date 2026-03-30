'use client';
// Mama Fua — Two-Factor Authentication Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Download,
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Info
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const twoFactorSetupSchema = z.object({
  method: z.enum(['TOTP', 'SMS', 'EMAIL']),
  phone: z.string().regex(/^254[0-9]{9}$/, 'Enter a valid Kenyan phone number').optional(),
  email: z.string().email('Enter a valid email address').optional(),
});

const twoFactorVerifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

type TwoFactorSetupData = z.infer<typeof twoFactorSetupSchema>;
type TwoFactorVerifyData = z.infer<typeof twoFactorVerifySchema>;

interface TwoFactorAuthProps {
  className?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorAuth({ className = '', onComplete, onCancel }: TwoFactorAuthProps) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSecret, setShowSecret] = useState(false);

  const setupForm = useForm<TwoFactorSetupData>({
    resolver: zodResolver(twoFactorSetupSchema),
    defaultValues: {
      method: 'TOTP',
      phone: user?.phone || '',
      email: user?.email || '',
    },
  });

  const verifyForm = useForm<TwoFactorVerifyData>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: {
      code: '',
    },
  });

  const selectedMethod = setupForm.watch('method');

  // Generate TOTP secret
  const generateTOTPSecret = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      setSecretKey(mockSecret);
      setQrCode(mockQrCode);
      setStep('verify');
    } catch (err) {
      setError('Failed to generate TOTP secret. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Setup SMS 2FA
  const setupSMS2FA = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('verify');
    } catch (err) {
      setError('Failed to setup SMS authentication. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Setup Email 2FA
  const setupEmail2FA = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('verify');
    } catch (err) {
      setError('Failed to setup email authentication. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Verify 2FA
  const handleVerify = async (data: TwoFactorVerifyData) => {
    setIsVerifying(true);
    setError('');
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate backup codes
      const mockBackupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 2 + 8).toUpperCase()
      );
      setBackupCodes(mockBackupCodes);
      setStep('backup');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Complete setup
  const handleComplete = () => {
    setStep('complete');
    if (onComplete) onComplete();
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mamafua-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Setup Step */}
      {step === 'setup' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-brand-100">
              <ShieldCheck className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="text-xl font-semibold text-ink-900 mb-2">Enable Two-Factor Authentication</h3>
            <p className="text-ink-600">
              Add an extra layer of security to your account with 2FA
            </p>
          </div>

          <form onSubmit={setupForm.handleSubmit(() => {
            if (selectedMethod === 'TOTP') {
              generateTOTPSecret();
            } else if (selectedMethod === 'SMS') {
              setupSMS2FA();
            } else if (selectedMethod === 'EMAIL') {
              setupEmail2FA();
            }
          })} className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-ink-700">Choose Authentication Method</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                  <input
                    {...setupForm.register('method')}
                    type="radio"
                    value="TOTP"
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-ink-900">Authenticator App</p>
                      <p className="text-sm text-ink-600">Use Google Authenticator, Authy, or similar apps</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                  <input
                    {...setupForm.register('method')}
                    type="radio"
                    value="SMS"
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-ink-900">SMS Messages</p>
                      <p className="text-sm text-ink-600">Receive codes via text message</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                  <input
                    {...setupForm.register('method')}
                    type="radio"
                    value="EMAIL"
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-ink-900">Email</p>
                      <p className="text-sm text-ink-600">Receive codes via email</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional fields */}
            {selectedMethod === 'SMS' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Phone Number</label>
                <input
                  {...setupForm.register('phone')}
                  type="tel"
                  className="input"
                  placeholder="254 XXX XXX XXX"
                />
                {setupForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{setupForm.formState.errors.phone.message}</p>
                )}
              </div>
            )}

            {selectedMethod === 'EMAIL' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Email Address</label>
                <input
                  {...setupForm.register('email')}
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                />
                {setupForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{setupForm.formState.errors.email.message}</p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="btn-ghost px-6 py-3"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isGenerating}
                className="btn-primary px-6 py-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Continue
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Verify Step */}
      {step === 'verify' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-ink-900 mb-2">Verify Your Setup</h3>
            <p className="text-ink-600">
              {selectedMethod === 'TOTP' 
                ? 'Scan the QR code and enter the 6-digit code'
                : selectedMethod === 'SMS'
                ? 'Enter the 6-digit code sent to your phone'
                : 'Enter the 6-digit code sent to your email'
              }
            </p>
          </div>

          {/* TOTP QR Code */}
          {selectedMethod === 'TOTP' && qrCode && (
            <div className="flex justify-center mb-6">
              <div className="border-2 border-slate-200 rounded-lg p-4">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}

          {/* Secret Key */}
          {selectedMethod === 'TOTP' && secretKey && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-ink-700">Manual Entry Key</label>
              <div className="flex items-center gap-2">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secretKey}
                  readOnly
                  className="input font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="btn-ghost p-2"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(secretKey)}
                  className="btn-ghost p-2"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Verification Code</label>
              <input
                {...verifyForm.register('code')}
                type="text"
                className="input text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
              {verifyForm.formState.errors.code && (
                <p className="mt-1 text-xs text-red-500">{verifyForm.formState.errors.code.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('setup')}
                className="btn-ghost px-6 py-3"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isVerifying}
                className="btn-primary px-6 py-3"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Backup Codes Step */}
      {step === 'backup' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-ink-900 mb-2">Save Your Backup Codes</h3>
            <p className="text-ink-600">
              These one-time use codes can be used if you lose access to your 2FA device
            </p>
          </div>

          <div className="mb-6">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-2 space-y-1 text-amber-600">
                    <li>• Save these codes in a secure location</li>
                    <li>• Each code can only be used once</li>
                    <li>• Store them offline if possible</li>
	                    <li>• Don&apos;t share them with anyone</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <span className="font-mono text-sm">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="btn-ghost p-1"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadBackupCodes}
              className="btn-secondary px-6 py-3"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Codes
            </button>
            
            <button
              onClick={handleComplete}
              className="btn-primary px-6 py-3"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Setup
            </button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-green-600">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">Two-Factor Authentication Enabled!</h3>
            <p className="text-green-700 mb-6">
              Your account is now protected with an extra layer of security.
            </p>
            
            <div className="text-sm text-green-700">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-green-600">
	                <li>• You&apos;ll be prompted for 2FA when logging in</li>
                <li>• Keep your backup codes safe and accessible</li>
                <li>• You can disable 2FA anytime in your settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
