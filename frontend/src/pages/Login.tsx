import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      // Navigate to the dashboard on successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Email</label>
            <input
              type="email"
              {...register('email', { required: true })}
              className="w-full p-2 border rounded"
              defaultValue="admin@innovate.corp"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              {...register('password', { required: true })}
              className="w-full p-2 border rounded"
              defaultValue="Password123!"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}