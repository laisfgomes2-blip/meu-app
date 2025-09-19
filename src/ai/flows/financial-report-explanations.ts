'use server';

/**
 * @fileOverview Generates explanations for financial reports, highlighting significant changes
 *               in income/spending and suggesting optimization opportunities.
 *
 * - generateExplanationsForFinancialReport - A function that generates explanations for a given financial report.
 * - FinancialReportInput - The input type for the generateExplanationsForFinancialReport function.
 * - FinancialReportOutput - The return type for the generateExplanationsForFinancialReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialReportInputSchema = z.object({
  monthlyReport: z.string().describe('The monthly financial report data.'),
  annualReport: z.string().describe('The annual financial report data.'),
});

export type FinancialReportInput = z.infer<typeof FinancialReportInputSchema>;

const FinancialReportOutputSchema = z.object({
  explanation: z.string().describe('Explanation of significant financial changes and optimization opportunities.'),
});

export type FinancialReportOutput = z.infer<typeof FinancialReportOutputSchema>;

export async function generateExplanationsForFinancialReport(
  input: FinancialReportInput
): Promise<FinancialReportOutput> {
  return financialReportExplanationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialReportExplanationsPrompt',
  input: {schema: FinancialReportInputSchema},
  output: {schema: FinancialReportOutputSchema},
  prompt: `Analyze the provided monthly and annual financial reports and generate a concise explanation of significant changes in income or spending.

Monthly Report: {{{monthlyReport}}}
Annual Report: {{{annualReport}}}

Identify potential opportunities for budget optimization and provide actionable suggestions.
Focus on delivering insights that help the user understand their financial trends and make informed decisions to improve their financial health.`,
});

const financialReportExplanationsFlow = ai.defineFlow(
  {
    name: 'financialReportExplanationsFlow',
    inputSchema: FinancialReportInputSchema,
    outputSchema: FinancialReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
