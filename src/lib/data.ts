
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  payer: string;
  paymentMethod: string;
  productId?: string; // Link to a product in the catalog
  quantity?: number; // Quantity purchased
  paid?: boolean; // If the expense has been paid
  isFixed?: boolean; // If it's a recurring expense
  debtId?: string; // Link to a debt
}

export interface Payer {
  id: string;
  name: string;
  color: string; // HSL color value e.g., "262 80% 50%"
  isPayer: boolean; // True if the person contributes financially
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export interface BenefitCard {
  id: string;
  name: string;
  monthlyCredit: number;
  balance: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  balance: number; // Represents current spending
}

export interface PiggyBank {
  id: string;
  name:string;
  goal: number;
  currentAmount: number;
}

export interface PaymentMethod {
    id: string;
    name: string;
}

// New type for piggy bank transactions
export interface PiggyBankTransaction {
  id: string;
  piggyBankId: string;
  date: Date;
  type: 'deposit' | 'withdrawal' | 'yield';
  amount: number;
  relatedTransactionId?: string; // To link with a main transaction if needed
}

export interface ShoppingListItem {
    id: string;
    name: string;
    estimatedCost: number;
    purchased: boolean;
    productId?: string;
    quantity: number;
    unit: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}

// New interfaces for Product Catalog and Recurring Lists
export interface Product {
  id: string;
  name: string;
  lastPrice?: number;
  categoryId?: string;
}

export interface RecurringListItem {
  productId: string;
  quantity: number;
  unit: string;
}

export interface RecurringList {
  id: string;
  name: string;
  frequency: 'single' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  items: RecurringListItem[];
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  amountPaid: number;
  monthlyPayment: number;
  interestRate: number;
}

// New interface for Tasks
export type TaskFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'single' | 'specific-days';

export interface Task {
  id: string;
  description: string;
  frequency: TaskFrequency;
  assignees: string[]; // Payer's name
  done: boolean;
  lastCompleted?: Date;
  daysOfWeek?: number[]; // 0 for Sun, 1 for Mon, etc.
  dueDate?: Date;
  dueTime?: string; // "HH:mm"
  reminder?: 5 | 10 | 15 | 30; // in minutes
}


export const payers: Payer[] = [
  { id: 'p1', name: 'Pessoa 1', color: "217 91% 60%", isPayer: true },
  { id: 'p2', name: 'Pessoa 2', color: "347 77% 50%", isPayer: true },
  { id: 'p3', name: 'Pessoa 3', color: "88 60% 50%", isPayer: false },
  { id: 'p4', name: 'Pessoa 4', color: "16 80% 50%", isPayer: false },
];

export const categories: Category[] = [
  { id: 'c1', name: 'Moradia', subcategories: ['Aluguel', 'Condomínio', 'IPTU', 'Energia', 'Água', 'Gás', 'Internet'] },
  { id: 'c2', name: 'Alimentação', subcategories: ['Supermercado', 'Restaurante', 'Delivery'] },
  { id: 'c3', name: 'Transporte', subcategories: ['Combustível', 'Transporte Público', 'App de Transporte'] },
  { id: 'c4', name: 'Saúde', subcategories: ['Plano de Saúde', 'Farmácia', 'Consulta'] },
  { id: 'c5', name: 'Lazer', subcategories: ['Cinema', 'Viagem', 'Streaming'] },
  { id: 'c6', name: 'Salário', subcategories: [] },
  { id: 'c7', name: 'Investimentos', subcategories: ['Aporte Caixinha', 'Resgate Caixinha'] },
  { id: 'c8', name: 'Pagamentos', subcategories: ['Fatura Cartão', 'Parcela Financiamento'] },
];

export const paymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Dinheiro' },
    { id: 'pm2', name: 'Débito' },
    { id: 'pm3', name: 'PIX' },
];

export const transactions: Transaction[] = [
  { id: 't1', date: new Date(2024, 6, 1), description: 'Salário Mensal', amount: 5000, type: 'income', category: 'Salário', payer: 'Pessoa 1', paymentMethod: 'Transferência', paid: true },
  { id: 't2', date: new Date(2024, 6, 1), description: 'Salário Mensal', amount: 4500, type: 'income', category: 'Salário', payer: 'Pessoa 2', paymentMethod: 'Transferência', paid: true },
  { id: 't3', date: new Date(2024, 6, 5), description: 'Aluguel', amount: 2000, type: 'expense', category: 'Moradia', subcategory: 'Aluguel', payer: 'Pessoa 1', paymentMethod: 'Débito', paid: true, isFixed: true },
  { id: 't4', date: new Date(2024, 6, 10), description: 'Compras do mês', amount: 800, type: 'expense', category: 'Alimentação', subcategory: 'Supermercado', payer: 'Pessoa 2', paymentMethod: 'Flash', paid: true },
  { id: 't5', date: new Date(2024, 6, 12), description: 'Conta de Energia', amount: 150, type: 'expense', category: 'Moradia', subcategory: 'Energia', payer: 'Pessoa 1', paymentMethod: 'Débito', paid: false, isFixed: true },
  { id: 't6', date: new Date(2024, 6, 15), description: 'Jantar fora', amount: 120, type: 'expense', category: 'Alimentação', subcategory: 'Restaurante', payer: 'Pessoa 2', paymentMethod: 'PIX', paid: true },
  { id: 't7', date: new Date(2024, 6, 20), description: 'Gasolina', amount: 200, type: 'expense', category: 'Transporte', subcategory: 'Combustível', payer: 'Pessoa 1', paymentMethod: 'Green', paid: true },
  { id: 't8-p1', date: new Date(2024, 6, 25), description: 'Supermercado', amount: 150, type: 'expense', category: 'Alimentação', subcategory: 'Supermercado', payer: 'Pessoa 1', paymentMethod: 'PIX', paid: true },
  { id: 't8-p2', date: new Date(2024, 6, 25), description: 'Supermercado', amount: 150, type: 'expense', category: 'Alimentação', subcategory: 'Supermercado', payer: 'Pessoa 2', paymentMethod: 'PIX', paid: true },
  { id: 't9', date: new Date(2024, 6, 15), description: 'Parcela Financiamento Carro (1/12)', amount: 1200, type: 'expense', category: 'Pagamentos', subcategory: 'Parcela Financiamento', payer: 'Pessoa 1', paymentMethod: 'Débito', paid: true, isFixed: true, debtId: 'd1' },
];

export const benefitCards: BenefitCard[] = [
    { id: 'cc1', name: 'Flash', monthlyCredit: 500, balance: 500 },
    { id: 'cc2', name: 'Green', monthlyCredit: 1000, balance: 1000 },
];

export const creditCards: CreditCard[] = [
    { id: 'crd1', name: 'Cartão Principal', limit: 5000, balance: 1250.75 },
]
  
export const piggyBanks: PiggyBank[] = [
    { id: 'pb1', name: 'Viagem de Férias', goal: 8000, currentAmount: 2500 },
    { id: 'pb2', name: 'Reserva de Emergência', goal: 10000, currentAmount: 6500 },
];

export const piggyBankTransactions: PiggyBankTransaction[] = [
    { id: 'pbt1', piggyBankId: 'pb1', date: new Date(2024, 5, 1), type: 'deposit', amount: 1000 },
    { id: 'pbt2', piggyBankId: 'pb1', date: new Date(2024, 6, 1), type: 'deposit', amount: 1500 },
    { id: 'pbt3', piggyBankId: 'pb2', date: new Date(2024, 4, 1), type: 'deposit', amount: 4000 },
    { id: 'pbt4', piggyBankId: 'pb2', date: new Date(2024, 5, 1), type: 'deposit', amount: 2500 },
];


export const productCategories: ProductCategory[] = [
    { id: 'pc1', name: 'Alimentos' },
    { id: 'pc2', name: 'Feira' },
    { id: 'pc3', name: 'Produto de Limpeza' },
    { id: 'pc4', name: 'Produto de Higiene' },
    { id: 'pc5', name: 'Padaria' },
];

// Mock data for new features
export const products: Product[] = [
  { id: 'prod1', name: 'Leite Integral', lastPrice: 5.80, categoryId: 'pc5' },
  { id: 'prod2', name: 'Pão de Forma', lastPrice: 8.00, categoryId: 'pc5' },
  { id: 'prod3', name: 'Queijo Mussarela 200g', lastPrice: 12.00, categoryId: 'pc5' },
  { id: 'prod4', name: 'Café 500g', lastPrice: 15.00, categoryId: 'pc1' },
];

export const recurringLists: RecurringList[] = [
  { id: 'rl1', name: 'Compras da Semana', frequency: 'weekly', items: [
    { productId: 'prod1', quantity: 2, unit: 'L' },
    { productId: 'prod2', quantity: 1, unit: 'pct' },
    { productId: 'prod3', quantity: 1, unit: 'un' },
  ]},
  { id: 'rl2', name: 'Essenciais do Mês', frequency: 'monthly', items: [
    { productId: 'prod4', quantity: 2, unit: 'pct' },
  ]},
];

export const unitsOfMeasure = [
  { value: 'un', label: 'Unidade(s)'},
  { value: 'pct', label: 'Pacote(s)'},
  { value: 'cx', label: 'Caixa(s)'},
  { value: 'g', label: 'Grama(s)'},
  { value: 'kg', label: 'Quilo(s)'},
  { value: 'ml', label: 'Mililitro(s)'},
  { value: 'L', label: 'Litro(s)'},
];

export const debts: Debt[] = [
  { id: 'd1', name: 'Financiamento Carro', totalAmount: 60000, amountPaid: 14400, monthlyPayment: 1200, interestRate: 1.5 },
  { id: 'd2', name: 'Empréstimo Pessoal', totalAmount: 10000, amountPaid: 4000, monthlyPayment: 500, interestRate: 2.8 },
];

export const tasks: Task[] = [
  { id: 'task1', description: 'Limpar a caixa de areia dos gatos', frequency: 'daily', assignees: ['Pessoa 1'], done: false },
  { id: 'task2', description: 'Lavar a louça do jantar', frequency: 'daily', assignees: ['Pessoa 2'], done: true, lastCompleted: new Date() },
  { id: 'task3', description: 'Levar o lixo para fora', frequency: 'specific-days', assignees: ['Pessoa 1', 'Pessoa 2'], done: false, daysOfWeek: [1, 3, 5] },
  { id: 'task4', description: 'Fazer compras da semana', frequency: 'weekly', assignees: ['Pessoa 2'], done: false },
  { id: 'task5', description: 'Pagar a conta de energia', frequency: 'monthly', assignees: ['Pessoa 1'], done: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 2)) },
  { id: 'task6', description: 'Lavar Roupas', frequency: 'weekly', assignees: ['Martina'], done: false },
  { id: 'task7', description: 'Guardar Brinquedos', frequency: 'daily', assignees: ['Lorenzo', 'Martina'], done: false },
];
