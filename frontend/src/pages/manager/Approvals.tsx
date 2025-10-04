import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { toast } from 'sonner';

// Modal component for Approve/Reject
function ApprovalModal({ expense, onClose, onAction }) {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-2">Review Expense: {expense.title}</h2>
        <p>{expense.amount} {expense.currency}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add an optional comment..."
          className="w-full p-2 border rounded mt-4"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          <button onClick={() => onAction('REJECT', comment)} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
          <button onClick={() => onAction('APPROVE', comment)} className="bg-green-500 text-white px-4 py-2 rounded">Approve</button>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: () => api.get('/expenses/pending-approvals').then(res => res.data),
  });

  const mutation = useMutation({
    mutationFn: ({ expenseId, action, comment }: { expenseId: string, action: string, comment: string }) => 
      api.post(`/expenses/${expenseId}/action`, { action, comment }),
    onSuccess: () => {
      toast.success("Action recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      setSelectedExpense(null);
    },
    onError: () => toast.error("An error occurred.")
  });

  const handleAction = (action: string, comment: string) => {
    if (selectedExpense) {
      mutation.mutate({ expenseId: selectedExpense.id, action, comment });
    }
  };

  if (isLoading) return <div>Loading approvals...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pending Approvals</h1>
      <div className="space-y-2">
        {pendingApprovals?.map(expense => (
          <div key={expense.id} className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold">{expense.title}</p>
              <p>{expense.submittedBy.name} - {expense.amount} {expense.currency}</p>
            </div>
            <button onClick={() => setSelectedExpense(expense)} className="bg-blue-500 text-white px-3 py-1 rounded">
              Review
            </button>
          </div>
        ))}
      </div>
      {selectedExpense && <ApprovalModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} onAction={handleAction} />}
    </div>
  );
}