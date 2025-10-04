import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { api } from '../api/client';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';

function AdminNav() {
  return (
    <div className="mb-4 bg-gray-200 p-2 rounded w-full">
      <Link to="/users" className="text-blue-600 hover:underline font-semibold">Manage Users</Link>
    </div>
  )
}

function EmployeeView() {
  const { register, handleSubmit, reset } = useForm();
  const { user } = useAuth();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      setReceiptFile(acceptedFiles[0]);
    },
    accept: { 'image/*': [] },
    maxFiles: 1
  });
  
  const onSubmit = async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }
    
    try {
      await api.post('/expenses', formData, { headers: { 'X-User-Id': user.id }});
      alert('Expense submitted successfully!');
      reset();
      setReceiptFile(null);
    } catch (error) {
      alert('Failed to submit expense.');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Submit an Expense</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register('title')} placeholder="Title" className="w-full p-2 border rounded" />
        <input {...register('amount')} type="number" step="0.01" placeholder="Amount" className="w-full p-2 border rounded" />
        <input {...register('currency')} placeholder="Currency (e.g., USD)" className="w-full p-2 border rounded" defaultValue="USD" />
        <input {...register('date')} type="date" className="w-full p-2 border rounded" />
        <input {...register('category')} placeholder="Category" className="w-full p-2 border rounded" />
        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
          <input {...getInputProps()} />
          {receiptFile ? <p>{receiptFile.name}</p> : <p>Drag 'n' drop a receipt here</p>}
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Submit</button>
      </form>
    </div>
  );
}

function ManagerView() {
  const [pending, setPending] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/expenses/pending', { headers: { 'X-User-Id': user.id }})
      .then(response => setPending(response.data))
      .catch(error => console.error("Failed to fetch pending expenses", error));
  }, [user.id]);
  
  const handleAction = async (expenseId: string, action: 'APPROVE' | 'REJECT') => {
      try {
          await api.post(`/expenses/${expenseId}/action`, { action }, { headers: { 'X-User-Id': user.id }});
          alert(`Expense ${action.toLowerCase()}ed!`);
          setPending(current => current.filter(exp => exp.id !== expenseId));
      } catch (error) {
          alert(`Failed to ${action.toLowerCase()} expense.`);
      }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md w-full max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
      <div className="space-y-2">
        {pending.length > 0 ? pending.map((exp: any) => (
          <div key={exp.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <p className="font-semibold">{exp.title} ({exp.amount} {exp.currency})</p>
              <p className="text-sm text-gray-600">Submitted by: {exp.submittedBy.name}</p>
            </div>
            <div className="space-x-2">
                <button onClick={() => handleAction(exp.id, 'APPROVE')} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                <button onClick={() => handleAction(exp.id, 'REJECT')} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
            </div>
          </div>
        )) : <p>No pending approvals.</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
       <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
        <button onClick={logout} className="bg-gray-500 text-white px-4 py-2 rounded">Logout</button>
       </div>
      
      {user?.role === 'ADMIN' && <div className="w-full max-w-2xl"><AdminNav /><ManagerView /></div>}
      {user?.role === 'EMPLOYEE' && <EmployeeView />}
      {user?.role === 'MANAGER' && <ManagerView />}
    </div>
  );
}