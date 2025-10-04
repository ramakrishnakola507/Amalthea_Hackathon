import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'InnovateCorp',
      currency: 'USD',
    },
  });
  console.log(`Created company: ${company.name}`);

  // 2. Create Users
  const hashedPassword = await hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@innovate.corp',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });

  const cfo = await prisma.user.create({
    data: {
      email: 'cfo@innovate.corp',
      name: 'CFO User',
      password: hashedPassword,
      role: UserRole.MANAGER, // A CFO is also a type of manager
      companyId: company.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@innovate.corp',
      name: 'Manager User',
      password: hashedPassword,
      role: UserRole.MANAGER,
      companyId: company.id,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'employee@innovate.corp',
      name: 'Employee User',
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      companyId: company.id,
      managerId: manager.id,
    },
  });
  console.log('Created users (admin, cfo, manager, employee)');

  // 3. Create Approval Flow with complex rules
  const approvalFlow = await prisma.approvalFlow.create({
    data: {
      name: 'Standard Expense Flow',
      companyId: company.id,
      definition: {
        // This JSON structure drives the approval engine
        // Special rule: If CFO approves, auto-approve the whole expense.
        specialRules: [
          {
            type: 'SPECIFIC_APPROVER',
            approverId: cfo.id,
            action: 'AUTO_APPROVE_EXPENSE',
          },
        ],
        steps: [
          {
            step: 1,
            name: 'Manager Approval',
            type: 'PARALLEL', // Approvals can happen in any order
            approvers: [manager.id], // Assign the manager by ID
            rule: {
              type: 'PERCENTAGE',
              value: 100, // 100% of managers in this step must approve
            },
          },
          {
            step: 2,
            name: 'Finance Review',
            type: 'SEQUENTIAL', // Only one approver
            approvers: [admin.id], // Using admin as finance for demo
            rule: {
              type: 'PERCENTAGE',
              value: 100,
            },
          },
          {
            step: 3,
            name: 'Director Approval',
            type: 'SEQUENTIAL',
            approvers: [cfo.id], // The CFO is the final approver
            rule: {
              type: 'PERCENTAGE',
              value: 100,
            },
          },
        ],
      },
    },
  });
  console.log(`Created approval flow: ${approvalFlow.name}`);

  // 4. Create sample expenses
  await prisma.expense.create({
    data: {
      title: 'Client Dinner in New York',
      amount: 150.0,
      currency: 'USD',
      date: new Date('2025-10-15T19:00:00Z'),
      category: 'Meals',
      submittedById: employee.id,
      companyId: company.id,
      companyCurrency: 'USD',
      convertedAmount: 150.0,
      conversionRate: 1.0,
      conversionTimestamp: new Date(),
      approvalFlowId: approvalFlow.id,
    },
  });

  await prisma.expense.create({
    data: {
      title: 'Software Subscription (EUR)',
      amount: 80.0,
      currency: 'EUR',
      date: new Date('2025-10-10T10:00:00Z'),
      category: 'Software',
      submittedById: employee.id,
      companyId: company.id,
      companyCurrency: 'USD',
      convertedAmount: 86.4, // Example conversion rate: 1 EUR = 1.08 USD
      conversionRate: 1.08,
      conversionTimestamp: new Date(),
      approvalFlowId: approvalFlow.id,
    },
  });
  console.log('Created sample expenses.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });