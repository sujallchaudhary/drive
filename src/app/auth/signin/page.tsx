import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/signin-form';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900 dark:text-white">
            SDRIVE
          </h1>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
