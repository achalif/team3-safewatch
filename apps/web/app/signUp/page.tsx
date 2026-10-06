'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupPageProps {
  initialName?: string;
}

export default function SignupPage({ initialName = '' }: SignupPageProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: initialName,
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        setServerError('Unauthorized. Please sign in again.');
        return;
      }

      if (response.status === 409) {
        setError('phoneNumber', {
          type: 'manual',
          message: 'Phone number already registered.',
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setServerError(errorData.message || 'An unexpected error occurred.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setServerError('Failed to connect to server. Please try again.');
    }
  };

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-md dark:bg-gray-800">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Complete Your Profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Emergency features require a valid phone number before accessing the app.
          </p>
        </header>

        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`mt-1 block w-full rounded-md border p-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              }`}
              {...register('name')}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Number Field */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="e.g. 123-456-7890"
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? 'phone-error' : undefined}
              className={`mt-1 block w-full rounded-md border p-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.phoneNumber
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              }`}
              {...register('phoneNumber')}
            />
            {errors.phoneNumber && (
              <p id="phone-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? 'Saving...' : 'Continue to App'}
          </button>
        </form>
      </div>
    </main>
  );
}