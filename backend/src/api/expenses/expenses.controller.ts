import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer'; // NEW: Import multer for file handling

// NEW: Configure multer to save uploaded files to an 'uploads/' directory
const upload = multer({ dest: 'uploads/' });

const prisma = new PrismaClient();
const router = Router();

// This is a mock middleware. In a real app, you'd verify a JWT.
const authMiddleware = (req, res, next) => {
  req.user = { id: req.headers['x-user-id'] };
  if (!req.user.id) return res.status(401).send("Unauthorized: Missing X-User-Id header");
  next();
};

// UPDATED: The POST route now uses the 'upload' middleware to handle a single file named 'receipt'
router.post('/', authMiddleware, upload.single('receipt'), async (req, res) => {
    try {
        const { title, amount, currency, date, category } = req.body;
        // NEW: The path to the uploaded file is now available in req.file
        const receiptPath = req.file ? req.file.path : null;

        const company = await prisma.user.findUnique({ where: { id: req.user.id } }).company();
        const approvalFlow = await prisma.approvalFlow.findFirst({ where: { companyId: company.id }});

        const expense = await prisma.expense.create({
            data: {
                title, 
                amount: parseFloat(amount), 
                currency, 
                date: new Date(date), 
                category,
                submittedById: req.user.id,
                companyId: company.id,
                approvalFlowId: approvalFlow.id,
                status: 'IN_PROGRESS',
                currentStep: 1,
                // Mocked currency conversion
                companyCurrency: company.currency,
                convertedAmount: parseFloat(amount),
                conversionRate: 1.0,
                conversionTimestamp: new Date(),
                // NEW: Save the file path to the database
                receipts: receiptPath ? [receiptPath] : [],
            }
        });
        
        // Create initial pending approvals for the first step
        const firstStep = (approvalFlow.definition as any).steps[0];
        await prisma.approval.createMany({
            data: firstStep.approvers.map((approverId: string) => ({
                expenseId: expense.id, 
                approverId: approverId, 
                step: 1, 
                status: 'PENDING'
            }))
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting expense', details: error.message });
    }
});

// GET /api/expenses/pending - Get expenses waiting for my approval
router.get('/pending', authMiddleware, async (req, res) => {
    const pendingApprovals = await prisma.approval.findMany({
        where: {
            approverId: req.user.id,
            status: 'PENDING'
        },
        include: {
            expense: {
                include: {
                    submittedBy: { select: { name: true }}
                }
            }
        }
    });
    res.json(pendingApprovals.map(pa => pa.expense));
});

// POST /api/expenses/:id/action - Approve or Reject an expense
router.post('/:id/action', authMiddleware, async (req, res) => {
    try {
        const { action } = req.body; // 'APPROVE' or 'REJECT'
        const expenseId = req.params.id;
        
        const currentExpense = await prisma.expense.findUnique({ where: { id: expenseId } });

        await prisma.approval.update({
            where: {
                expenseId_approverId_step: {
                  expenseId,
                  approverId: req.user.id,
                  step: currentExpense.currentStep
                }
            },
            data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
        });
        
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: { status: newStatus }
        });

        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: 'Error processing action', details: error.message });
    }
});


export const ExpensesController = router;