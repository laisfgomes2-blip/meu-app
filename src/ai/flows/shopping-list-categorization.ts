// This is a server-side file.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting sub-categories and budget allocations
 * for transactions based on a shopping list.
 *
 * - suggestTransactionCategories - A function that suggests transaction categories based on a shopping list.
 * - ShoppingListInput - The input type for the suggestTransactionCategories function.
 * - TransactionCategorySuggestion - The return type for the suggestTransactionCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShoppingListInputSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().describe('The name of the shopping list item.'),
        estimatedCost: z.number().describe('The estimated cost of the item.'),
      })
    )
    .describe('A list of shopping list items with their estimated costs.'),
  categories: z
    .array(
      z.object({
        name: z.string(),
        subcategories: z.array(z.string()),
      })
    )
    .describe('A list of available categories and their subcategories to choose from.'),
});
export type ShoppingListInput = z.infer<typeof ShoppingListInputSchema>;

const TransactionCategorySuggestionSchema = z.array(
  z.object({
    item: z.string().describe('The name of the shopping list item.'),
    suggestedCategory: z.string().describe('The suggested category for the transaction.'),
    suggestedSubcategory: z.string().describe('The suggested subcategory for the transaction.'),
    suggestedBudgetAllocation: z.number().describe('The suggested budget allocation for the transaction (as a percentage).'),
  })
).describe('An array of suggested categories, subcategories, and budget allocations for each item in the shopping list.');
export type TransactionCategorySuggestion = z.infer<typeof TransactionCategorySuggestionSchema>;

export async function suggestTransactionCategories(input: ShoppingListInput): Promise<TransactionCategorySuggestion> {
  return shoppingListCategorizationFlow(input);
}

const shoppingListCategorizationPrompt = ai.definePrompt({
  name: 'shoppingListCategorizationPrompt',
  input: {schema: ShoppingListInputSchema},
  output: {schema: TransactionCategorySuggestionSchema},
  prompt: `You are a personal finance expert. Given a shopping list with items, their estimated costs, and a list of available categories, you will suggest appropriate categories and subcategories for each item.

Available Categories and Subcategories:
{{#each categories}}
- Category: {{name}}
  - Subcategories: {{#if subcategories.length}}{{join subcategories ", "}}{{else}}N/A{{/if}}
{{/each}}

Shopping List:
{{#each items}}
- {{name}} (Estimated Cost: {{estimatedCost}})
{{/each}}

Provide your suggestions in a structured JSON format. For each item, select the most relevant category and subcategory from the provided lists. Also, suggest a budget allocation percentage. The response should be an array of objects as described in the schema. Do not provide any intro or explanation, only the JSON output.
`,
});

const shoppingListCategorizationFlow = ai.defineFlow(
  {
    name: 'shoppingListCategorizationFlow',
    inputSchema: ShoppingListInputSchema,
    outputSchema: TransactionCategorySuggestionSchema,
  },
  async input => {
    const {output} = await shoppingListCategorizationPrompt(input);
    return output!;
  }
);
