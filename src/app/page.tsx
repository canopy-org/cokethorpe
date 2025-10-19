import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginPage from './login/page';

export default async function RootPage() {
    const user = await getAuthUser();

    // If already logged in, redirect to home
    if (user) {
        redirect('/home');
    }

    // Otherwise show login
    return <LoginPage />;
}