import { PrismaClient } from '@prisma/client';
import { RuleEvaluator, EvaluationContext } from '../../core/approval-engine/RuleEvaluator';

const prisma = new PrismaClient();
const ruleEvaluator = new RuleEvaluator();

export class ExpenseService {
  async submitExpense(data: any, userId: string) {
    // ... validation logic ...
    
    const company = await prisma.user.findUnique({ where: { id: userId } }).company();
    const approvalFlow = await prisma.approvalFlow.findFirst({ where: { companyId: company.id }}); // Find a default flow
    
    if (!approvalFlow) {
      throw new Error("No approval flow configured for this company.");
    }

    const expense = await prisma.expense.create({
      data: {
        ...data,
        submittedById: userId,
        companyId: company.id,
        approvalFlowId: approvalFlow.id,
        status: 'IN_PROGRESS', // Immediately start the flow
        currentStep: 1,
      },
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

    // Create initial audit log
    await prisma.auditLog.create({
      data: { expenseId: expense.id, actorId: userId, action: 'SUBMITTED' }
    });

    return expense;
  }

  async processApprovalAction(expenseId: string, actorId: string, actionType: 'APPROVE' | 'REJECT', comment?: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId }});
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approvals: true, approvalFlow: true }
    });

    if (!expense || !expense.approvalFlow) throw new Error("Expense or flow not found.");

    // 1. Update the specific approval record
    await prisma.approval.update({
      where: {
        expenseId_approverId_step: {
          expenseId,
          approverId: actorId,
          step: expense.currentStep
        }
      },
      data: {
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        comment: comment,
      }
    });

    // 2. Re-fetch expense with updated approvals
    const updatedExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approvals: true }
    });
    
    // 3. Evaluate the new state
    const context: EvaluationContext = {
      expense: updatedExpense,
      definition: expense.approvalFlow.definition as any,
      action: { type: actionType, actor },
    };
    const result = ruleEvaluator.evaluate(context);

    // 4. Update the expense based on the evaluation result
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: result.nextExpenseStatus,
        currentStep: result.nextStep,
      }
    });

    // If moved to a new step, create pending approvals for that step
    if (result.nextStep > expense.currentStep) {
        const nextStepConfig = (expense.approvalFlow.definition as any).steps.find(s => s.step === result.nextStep);
        if (nextStepConfig) {
             await prisma.approval.createMany({
                data: nextStepConfig.approvers.map((approverId: string) => ({
                    expenseId: expense.id,
                    approverId: approverId,
                    step: result.nextStep,
                    status: 'PENDING'
                }))
            });
        }
    }
    
    // 5. Create audit log for this action
    await prisma.auditLog.create({
      data: { expenseId, actorId, action: actionType, details: { comment } }
    });

    // 6. TODO: Trigger notifications from result.notifications

    return await prisma.expense.findUnique({ where: { id: expenseId } });
  }
}