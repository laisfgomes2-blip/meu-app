'use server';
/**
 * @fileOverview Processes a PDF credit card statement to extract transactions.
 *
 * - processPdfStatement - A function that handles the PDF statement processing.
 * - ProcessPdfStatementInput - The input type for the processPdfStatement function.
 * - ProcessPdfStatementOutput - The return type for the processPdfStatement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessPdfStatementInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A credit card statement in PDF format, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ProcessPdfStatementInput = z.infer<typeof ProcessPdfStatementInputSchema>;

const TransactionSchema = z.object({
  date: z.string().describe("The date of the transaction in YYYY-MM-DD format."),
  description: z.string().describe('The description or merchant name for the transaction.'),
  amount: z.number().describe('The monetary value of the transaction.'),
});

const ProcessPdfStatementOutputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('A list of transactions extracted from the statement.'),
});
export type ProcessPdfStatementOutput = z.infer<typeof ProcessPdfStatementOutputSchema>;

export async function processPdfStatement(input: ProcessPdfStatementInput): Promise<ProcessPdfStatementOutput> {
  return processPdfStatementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processPdfStatementPrompt',
  input: { schema: ProcessPdfStatementInputSchema },
  output: { schema: ProcessPdfStatementOutputSchema },
  prompt: `You are an expert in processing PDF credit card statements.
Your task is to analyze the provided PDF file.
Extract the list of transactions from the document. For each transaction, identify its date, description, and amount.
Ignore any summary sections, payment information, or credit card payment transactions (e.g., "PAGAMENTO EM DEBITO", "PAGAMENTO FATURA").
Return this information in the specified JSON format.

Statement PDF: {{media url=pdfDataUri}}
`,
});

const processPdfStatementFlow = ai.defineFlow(
  {
    name: 'processPdfStatementFlow',
    inputSchema: ProcessPdfStatementInputSchema,
    outputSchema: ProcessPdfStatementOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
