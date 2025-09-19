'use server';
/**
 * @fileOverview Processes a receipt QR code URL to extract shopping list items.
 *
 * - processReceipt - A function that handles the receipt processing.
 * - ProcessReceiptInput - The input type for the processReceipt function.
 * - ProcessReceiptOutput - The return type for the processReceipt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessReceiptInputSchema = z.object({
  qrCodeUrl: z
    .string()
    .describe(
      "The URL obtained from a Brazilian electronic invoice (Nota Fiscal Eletrônica - NF-e) QR code."
    ),
});
export type ProcessReceiptInput = z.infer<typeof ProcessReceiptInputSchema>;

const ProcessReceiptOutputSchema = z.object({
  items: z.array(z.object({
    name: z.string().describe('The name of the product.'),
    quantity: z.number().describe('The quantity of the product purchased.'),
    unit: z.string().describe('The unit of measure for the quantity (e.g., un, kg, L).'),
    price: z.number().describe('The price per unit of the product.'),
  })).describe('A list of items extracted from the receipt.')
});
export type ProcessReceiptOutput = z.infer<typeof ProcessReceiptOutputSchema>;

export async function processReceipt(input: ProcessReceiptInput): Promise<ProcessReceiptOutput> {
  return processReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processReceiptPrompt',
  input: { schema: ProcessReceiptInputSchema },
  output: { schema: ProcessReceiptOutputSchema },
  prompt: `You are an expert in processing Brazilian electronic invoices (Nota Fiscal Eletrônica - NF-e).
Your task is to analyze the provided URL from a receipt's QR code.
Access this URL to find the invoice details and extract the list of products. For each product, identify its name, the quantity purchased, the unit of measure, and the price per unit.
Return only the information in the specified JSON format, with no additional text or explanation.

Invoice URL: {{{qrCodeUrl}}}
`,
});

const processReceiptFlow = ai.defineFlow(
  {
    name: 'processReceiptFlow',
    inputSchema: ProcessReceiptInputSchema,
    outputSchema: ProcessReceiptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
