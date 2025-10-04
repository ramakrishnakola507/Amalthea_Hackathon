import { RuleEvaluator, EvaluationContext } from '../src/core/approval-engine/RuleEvaluator';
import { UserRole } from '@prisma/client';

// Mock data for testing
const mockCfo = { id: 'cfo-id', name: 'CFO', role: UserRole.MANAGER, companyId: 'c1' };
const mockManager = { id: 'manager-id', name: 'Manager', role: UserRole.MANAGER, companyId: 'c1' };
const mockEmployee = { id: 'employee-id', name: 'Employee', role: UserRole.EMPLOYEE, companyId: 'c1' };

const mockFlowDefinition = {
  specialRules: [{ type: 'SPECIFIC_APPROVER', approverId: 'cfo-id', action: 'AUTO_APPROVE_EXPENSE' }],
  steps: [
    { step: 1, name: 'Manager', type: 'PARALLEL', approvers: ['manager-id'], rule: { type: 'PERCENTAGE', value: 100 } },
    { step: 2, name: 'Finance', type: 'SEQUENTIAL', approvers: ['cfo-id'], rule: { type: 'PERCENTAGE', value: 100 } },
  ],
};

describe('RuleEvaluator', () => {
  let evaluator: RuleEvaluator;

  beforeEach(() => {
    evaluator = new RuleEvaluator();
  });

  it('should auto-approve expense if a special rule is met (CFO approves)', () => {
    const context: EvaluationContext = {
      // @ts-ignore
      expense: { id: 'exp1', currentStep: 1, approvals: [] },
      definition: mockFlowDefinition,
      action: { type: 'APPROVE', actor: mockCfo },
    };

    const result = evaluator.evaluate(context);

    expect(result.nextExpenseStatus).toBe('APPROVED');
    expect(result.auditLogs[0].action).toBe('AUTO_APPROVED_BY_SPECIAL_RULE');
  });

  it('should move to the next step if the current step is completed', () => {
    const context: EvaluationContext = {
      // @ts-ignore
      expense: {
        id: 'exp1',
        currentStep: 1,
        approvals: [{ step: 1, status: 'APPROVED', approverId: 'manager-id' }],
      },
      definition: mockFlowDefinition,
      action: { type: 'APPROVE', actor: mockManager },
    };

    const result = evaluator.evaluate(context);
    
    expect(result.nextExpenseStatus).toBe('IN_PROGRESS');
    expect(result.nextStep).toBe(2);
    expect(result.auditLogs[0].action).toBe('STEP_1_COMPLETE');
  });

  it('should reject the expense if any approver rejects', () => {
    const context: EvaluationContext = {
      // @ts-ignore
      expense: {
        id: 'exp1',
        currentStep: 1,
        approvals: [{ step: 1, status: 'REJECTED', approverId: 'manager-id' }],
      },
      definition: mockFlowDefinition,
      action: { type: 'REJECT', actor: mockManager },
    };

    const result = evaluator.evaluate(context);

    expect(result.nextExpenseStatus).toBe('REJECTED');
  });

  it('should fully approve the expense after the final step is completed', () => {
    const context: EvaluationContext = {
      // @ts-ignore
      expense: {
        id: 'exp1',
        currentStep: 2,
        approvals: [
          { step: 1, status: 'APPROVED', approverId: 'manager-id' },
          { step: 2, status: 'APPROVED', approverId: 'cfo-id' },
        ],
      },
      definition: mockFlowDefinition,
      action: { type: 'APPROVE', actor: mockCfo },
    };

    const result = evaluator.evaluate(context);

    expect(result.nextExpenseStatus).toBe('APPROVED');
    expect(result.auditLogs[0].action).toBe('FINAL_APPROVAL');
  });
});