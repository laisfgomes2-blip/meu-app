'use server';

/**
 * @fileOverview Generates suggestions for budget optimization based on the 50/30/20 rule.
 *
 * - generateBudgetOptimizationSuggestions - A function that generates optimization suggestions.
 * - BudgetOptimizationInput - The input type for the function.
 * - BudgetOptimizationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExpenseCategoryDetailSchema = z.object({
  spent: z.number().describe('Total amount spent in this category.'),
  ideal: z.number().describe('Ideal amount to be spent according to the budget rule.'),
  details: z.record(z.number()).describe('A breakdown of expenses within the category, where keys are subcategories or descriptions and values are the amounts spent.'),
});

const BudgetOptimizationInputSchema = z.object({
  totalIncome: z.number().describe('The total income for the period.'),
  expenses: z.object({
    needs: ExpenseCategoryDetailSchema.describe('Expenses classified as "Needs" (50% target).'),
    wants: ExpenseCategoryDetailSchema.describe('Expenses classified as "Wants" (30% target).'),
  }),
});

export type BudgetOptimizationInput = z.infer<typeof BudgetOptimizationInputSchema>;

const BudgetOptimizationOutputSchema = z.object({
  suggestions: z.string().describe('Actionable suggestions to reduce, cut, or negotiate expenses, focusing on categories that are over budget.'),
});

export type BudgetOptimizationOutput = z.infer<typeof BudgetOptimizationOutputSchema>;

export async function generateBudgetOptimizationSuggestions(
  input: BudgetOptimizationInput
): Promise<BudgetOptimizationOutput> {
  return budgetOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetOptimizationPrompt',
  input: { schema: BudgetOptimizationInputSchema },
  output: { schema: BudgetOptimizationOutputSchema },
  prompt: `You are a friendly and pragmatic financial advisor. Your goal is to help the user optimize their budget based on the 50/30/20 rule.

Analyze the user's financial data for the period:
- Total Income: {{totalIncome}}
- Needs (Target: 50% = {{expenses.needs.ideal}}): Spent {{expenses.needs.spent}}
  - Details: {{JSON.stringify expenses.needs.details}}
- Wants (Target: 30% = {{expenses.wants.ideal}}): Spent {{expenses.wants.spent}}
  - Details: {{JSON.stringify expenses.wants.details}}

Based on this data, provide a single, concise paragraph with actionable suggestions. Focus on the categories that are over budget.
Identify specific expenses from the details that could be reduced, negotiated (e.g., internet bill), or temporarily cut.
Your tone should be encouraging and helpful, not judgmental. Start with a positive or empathetic sentence.
`,
});

const budgetOptimizationFlow = ai.defineFlow(
  {
    name: 'budgetOptimizationFlow',
    inputSchema: BudgetOptimizationInputSchema,
    outputSchema: BudgetOptimizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
