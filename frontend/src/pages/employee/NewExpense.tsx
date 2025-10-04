import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/client'; // Your configured axios instance
import { toast } from 'sonner';

// Mock OCR function
const mockOcr = async (file: File) => {
  console.log('Simulating OCR on', file.name);
  await new Promise(res => setTimeout(res, 1500)); // Simulate network latency
  return {
    amount: 125.50,
    date: '2025-10-20',
    category: 'Travel',
    description: 'Taxi from JFK to Hotel',
  };
};

export default function NewExpensePage() {
  const [files, setFiles] = useState<File[]>([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setFiles(acceptedFiles);
      if (acceptedFiles.length > 0) {
        toast.info('Processing receipt with OCR...');
        const ocrResult = await mockOcr(acceptedFiles[0]);
        // Populate form fields with OCR data
        setValue('amount', ocrResult.amount);
        setValue('date', ocrResult.date);
        setValue('category', ocrResult.category);
        setValue('title', ocrResult.description);
        toast.success('OCR complete! Please verify the details.');
      }
    },
    accept: { 'image/*': [] }
  });

  const mutation = useMutation({
    mutationFn: (newExpense: FormData) => api.post('/expenses', newExpense),
    onSuccess: () => {
      toast.success('Expense submitted successfully!');
      // TODO: Redirect or clear form
    },
    onError: (error) => {
      toast.error('Failed to submit expense.');
      console.error(error);
    }
  });

  const onSubmit = (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    files.forEach(file => formData.append('receipts', file));
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Submit New Expense</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Receipt Upload */}
        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer">
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop the receipts here...</p> : <p>Drag 'n' drop receipts here, or click to select</p>}
        </div>

        {/* Form Fields */}
        <div>
          <label>Title</label>
          <input {...register('title', { required: true })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>Amount</label>
          <input type="number" step="0.01" {...register('amount', { required: true })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>Currency</label>
          <input {...register('currency', { required: true, value: 'USD' })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>Date</label>
          <input type="date" {...register('date', { required: true })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label>Category</label>
          <input {...register('category', { required: true })} className="w-full p-2 border rounded" />
        </div>
        
        <button type="submit" disabled={mutation.isPending} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400">
          {mutation.isPending ? 'Submitting...' : 'Submit Expense'}
        </button>
      </form>
    </div>
  );
}