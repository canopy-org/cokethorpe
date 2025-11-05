'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) {
                if (res.status === 403) {
                    router.push('/home');
                    return;
                }
                throw new Error('Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            name: formData.get('name'),
            role: formData.get('role'),
            permissions: []
        };

        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (res.ok) {
                alert('User created successfully!');
                setShowCreate(false);
                fetchUsers();
                e.currentTarget.reset();
            } else {
                alert(data.error || 'Failed to create user');
            }
        } catch (error) {
            alert('Error creating user');
        }
    };

    const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentStatus })
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            alert('Error updating user');
        }
    };

    const deleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            alert('Error deleting user');
        }
    };

    const handleResetPassword = async (userId: number) => {
        if (!newPassword) {
            alert('Please enter a new password');
            return;
        }

        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Password reset successfully!');
                setResetPasswordUserId(null);
                setNewPassword('');
            } else {
                alert(data.error || 'Failed to reset password');
            }
        } catch (error) {
            alert('Error resetting password');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {showCreate ? 'Cancel' : 'Create New User'}
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
                    <h2 className="text-xl font-bold">Create New User</h2>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        className="w-full px-4 py-2 border rounded"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password (min 8 characters)"
                        required
                        minLength={8}
                        className="w-full px-4 py-2 border rounded"
                    />

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        className="w-full px-4 py-2 border rounded"
                    />

                    <select name="role" required className="w-full px-4 py-2 border rounded">
                        <option value="viewer">Viewer (Read-only)</option>
                        <option value="manager">Manager (Full access)</option>
                        <option value="admin">Admin (Can manage users)</option>
                    </select>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                        Create User
                    </button>
                </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user: any) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4">{user.name || '-'}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-sm ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.active)}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                {user.active ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => setResetPasswordUserId(user.id)}
                                                className="text-orange-600 hover:underline text-sm"
                                            >
                                                Reset Password
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="text-red-600 hover:underline text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        {resetPasswordUserId === user.id && (
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="password"
                                                    placeholder="New password (min 8 chars)"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="flex-1 px-3 py-1 border rounded text-sm"
                                                    minLength={8}
                                                />
                                                <button
                                                    onClick={() => handleResetPassword(user.id)}
                                                    className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                                                >
                                                    Set
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResetPasswordUserId(null);
                                                        setNewPassword('');
                                                    }}
                                                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}