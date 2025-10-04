import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function UserManagementPage() {
  const { register, handleSubmit, reset } = useForm();
  const [managers, setManagers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch the list of managers to populate the dropdown
    api.get('/users/managers', { headers: { 'X-User-Id': user.id }})
      .then(res => setManagers(res.data));
  }, [user.id]);

  const onSubmit = async (data) => {
    try {
      await api.post('/users', data, { headers: { 'X-User-Id': user.id }});
      alert('User created successfully!');
      reset();
    } catch (error) {
      alert('Failed to create user.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="p-4 bg-white rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input {...register('name')} placeholder="Full Name" className="w-full p-2 border rounded" />
          <input {...register('email')} type="email" placeholder="Email" className="w-full p-2 border rounded" />
          <input {...register('password')} type="password" placeholder="Password" className="w-full p-2 border rounded" />
          <select {...register('role')} className="w-full p-2 border rounded">
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
          </select>
          <select {...register('managerId')} className="w-full p-2 border rounded">
            <option value="">Assign a Manager (for Employees)</option>
            {managers.map(manager => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Create User</button>
        </form>
      </div>
    </div>
  );
}