'use server';

/**
 * @fileOverview Generates a summarized text message for shared expenses.
 *
 * - generateSharedExpensesSummary - A function that generates a summary for shared expenses.
 * - SharedExpensesInput - The input type for the generateSharedExpensesSummary function.
 * - SharedExpensesOutput - The return type for the generateSharedExpensesSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SharedExpensesInputSchema = z.object({
    formattedExpenses: z.string().describe("A pre-formatted string detailing each shared expense, who paid, and how much.")
});

export type SharedExpensesInput = z.infer<typeof SharedExpensesInputSchema>;

const SharedExpensesOutputSchema = z.object({
  summary: z.string().describe('A concise and friendly summary of the shared expenses, formatted for a messaging app.'),
});

export type SharedExpensesOutput = z.infer<typeof SharedExpensesOutputSchema>;

export async function generateSharedExpensesSummary(
  input: SharedExpensesInput
): Promise<SharedExpensesOutput> {
  return sharedExpensesSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sharedExpensesSummaryPrompt',
  input: { schema: SharedExpensesInputSchema },
  output: { schema: SharedExpensesOutputSchema },
  prompt: `You are a helpful assistant. Your task is to rephrase the following text into a friendly summary formatted for a messaging app like WhatsApp.

Start with a friendly greeting like "Olá! Segue o resumo das nossas despesas compartilhadas:".
Use bullet points for clarity.

Here is the text to summarize:
{{formattedExpenses}}
`,
});

const sharedExpensesSummaryFlow = ai.defineFlow(
  {
    name: 'sharedExpensesSummaryFlow',
    inputSchema: SharedExpensesInputSchema,
    outputSchema: SharedExpensesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
