import { Approval, ApprovalStatus, Expense, User } from '@prisma/client';

// Define the structure of our approval flow JSON
export interface ApprovalRule {
  type: 'PERCENTAGE' | 'SPECIFIC_APPROVER' | 'HYBRID';
  value?: number; // For percentage
  approverId?: string; // For specific approver
  action?: 'AUTO_APPROVE_EXPENSE' | 'AUTO_APPROVE_STEP';
  rules?: ApprovalRule[]; // For hybrid
  operator?: 'AND' | 'OR'; // For hybrid
}

export interface ApprovalStep {
  step: number;
  name: string;
  type: 'SEQUENTIAL' | 'PARALLEL';
  approvers: string[];
  rule: ApprovalRule;
}

export interface ApprovalFlowDefinition {
  specialRules?: ApprovalRule[];
  steps: ApprovalStep[];
}

export interface EvaluationContext {
  expense: Expense & { approvals: Approval[] };
  action: {
    type: 'SUBMIT' | 'APPROVE' | 'REJECT';
    actor: User;
  };
  definition: ApprovalFlowDefinition;
}

export interface EvaluationResult {
  nextExpenseStatus: Expense['status'];
  nextStep: number;
  notifications: any[]; // Stub for notifications
  auditLogs: any[]; // Stub for audit logs
}

/**
 * The RuleEvaluator is responsible for processing the state of an expense's
 * approvals against its defined approval flow.
 */
export class RuleEvaluator {
  public evaluate(context: EvaluationContext): EvaluationResult {
    const { expense, definition, action } = context;

    // 1. Check special rules first (e.g., CFO auto-approve)
    if (definition.specialRules) {
      for (const rule of definition.specialRules) {
        if (
          rule.type === 'SPECIFIC_APPROVER' &&
          rule.approverId === action.actor.id &&
          action.type === 'APPROVE'
        ) {
          if (rule.action === 'AUTO_APPROVE_EXPENSE') {
            return {
              nextExpenseStatus: 'APPROVED',
              nextStep: expense.currentStep,
              notifications: [{ message: `Expense auto-approved by ${action.actor.name}` }],
              auditLogs: [{ action: 'AUTO_APPROVED_BY_SPECIAL_RULE' }],
            };
          }
        }
      }
    }

    // 2. Evaluate the current step
    const currentStepConfig = definition.steps.find(
      (s) => s.step === expense.currentStep,
    );
    if (!currentStepConfig) {
      // Should not happen if flow is well-defined
      return {
        nextExpenseStatus: 'REJECTED',
        nextStep: expense.currentStep,
        notifications: [{ message: 'Error: Approval step not found.' }],
        auditLogs: [{ action: 'ERROR_NO_STEP_FOUND' }],
      };
    }

    // If any approver in the current step rejects, the whole expense is rejected.
    const hasRejection = expense.approvals.some(
      (a) => a.step === expense.currentStep && a.status === 'REJECTED',
    );
    if (hasRejection) {
      return {
        nextExpenseStatus: 'REJECTED',
        nextStep: expense.currentStep,
        notifications: [{ message: `Expense rejected at step ${expense.currentStep}` }],
        auditLogs: [{ action: 'REJECTED' }],
      };
    }

    // Check if the current step is completed based on its rule
    const isStepComplete = this.isStepComplete(
      expense.approvals,
      currentStepConfig,
    );

    if (isStepComplete) {
      const isLastStep =
        expense.currentStep === definition.steps.length;
      if (isLastStep) {
        // Last step complete, so the whole expense is approved
        return {
          nextExpenseStatus: 'APPROVED',
          nextStep: expense.currentStep,
          notifications: [{ message: 'Expense fully approved.' }],
          auditLogs: [{ action: 'FINAL_APPROVAL' }],
        };
      } else {
        // Move to the next step
        return {
          nextExpenseStatus: 'IN_PROGRESS',
          nextStep: expense.currentStep + 1,
          notifications: [{ message: `Moving to step ${expense.currentStep + 1}` }],
          auditLogs: [{ action: `STEP_${expense.currentStep}_COMPLETE` }],
        };
      }
    }

    // If the step is not yet complete, the status remains IN_PROGRESS
    return {
      nextExpenseStatus: 'IN_PROGRESS',
      nextStep: expense.currentStep,
      notifications: [],
      auditLogs: [],
    };
  }

  private isStepComplete(approvals: Approval[], stepConfig: ApprovalStep): boolean {
    const relevantApprovals = approvals.filter(
      (a) => a.step === stepConfig.step,
    );
    const approvedCount = relevantApprovals.filter(
      (a) => a.status === 'APPROVED',
    ).length;

    if (stepConfig.rule.type === 'PERCENTAGE') {
      const requiredApprovals = Math.ceil(
        (stepConfig.approvers.length * (stepConfig.rule.value ?? 100)) / 100,
      );
      return approvedCount >= requiredApprovals;
    }

    // TODO: Implement more complex rule types like HYBRID
    return false;
  }
}