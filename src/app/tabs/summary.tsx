
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Loader2, Users, DivideCircle, MessageSquareShare, TrendingUp, ArrowLeft, BarChart2, DollarSign, Target, FileText, Box, Sparkles } from 'lucide-react';
import { Transaction, Payer, Product, Debt } from '@/lib/data';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSharedExpensesSummary } from '@/ai/flows/shared-expenses-summary';
import { generateBudgetOptimizationSuggestions } from '@/ai/flows/budget-optimization-suggestions';
import Budget503020Tab from './budget-503020';
import DebtAnalysisTab from './debt-analysis';
import FinancialHealthMeter from './financial-health-meter';
import FixedVariableAnalysis from './fixed-variable-analysis';
import { cn } from '@/lib/utils';

interface SummaryTabProps {
  transactions: Transaction[];
  payers: Payer[];
  products: Product[];
  debts: Debt[];
}

export default function SummaryTab({ transactions, payers, products, debts }: SummaryTabProps) {
  const [timeRange, setTimeRange] = useState('currentMonth');
  
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);
  const [budgetSuggestions, setBudgetSuggestions] = useState('');

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'last6Months':
        return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
      case 'last12Months':
        return { from: startOfMonth(subMonths(now, 11)), to: endOfMonth(now) };
      case 'currentMonth':
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [timeRange]);
  
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) return [];
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= dateRange.from! && transactionDate <= dateRange.to!;
    });
  }, [transactions, dateRange]);

  const totalExpenses = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0),
  [filteredTransactions]);
  
  const expensesByPayerData = useMemo(() => {
    if (totalExpenses === 0) return [];
    const payerTotals = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.payer] = (acc[t.payer] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    return payers.map(payer => {
      const value = payerTotals[payer.name] || 0;
      return {
        name: payer.name,
        value: value,
        percent: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        color: payer.color,
      };
    }).sort((a, b) => b.value - a.value);

  }, [filteredTransactions, totalExpenses, payers]);

  const expensesByCategoryData = useMemo(() => {
    if (totalExpenses === 0) return [];
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ 
        name, 
        value,
        percent: (value / totalExpenses) * 100,
       }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, totalExpenses]);
  
  const expensesBySubcategoryData = useMemo(() => {
    if (!selectedCategory) return [];
    
    const categoryExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.category === selectedCategory);
    const categoryTotal = categoryExpenses.reduce((acc, t) => acc + t.amount, 0);

    if (categoryTotal === 0) return [];

    const subcategoryTotals = categoryExpenses.reduce((acc, t) => {
        const subcategory = t.subcategory || 'Outros';
        acc[subcategory] = (acc[subcategory] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(subcategoryTotals)
      .map(([name, value]) => ({ 
        name, 
        value,
        percent: (value / categoryTotal) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, selectedCategory]);
  

  const sharedExpenses = filteredTransactions
    .reduce((acc, transaction) => {
        if (transaction.type === 'expense') {
            const key = `${transaction.description}-${transaction.date.toISOString().split('T')[0]}`;
            if (!acc[key]) {
                acc[key] = {
                    description: transaction.description,
                    date: transaction.date,
                    total: 0,
                    payers: {} as Record<string, number>
                };
            }
            acc[key].total += transaction.amount;
            acc[key].payers[transaction.payer] = (acc[key].payers[transaction.payer] || 0) + transaction.amount;
        }
        return acc;
    }, {} as Record<string, {description: string, date: Date, total: number, payers: Record<string, number>}>);
  
  const sharedExpensesData = Object.values(sharedExpenses).filter(expense => Object.keys(expense.payers).length > 1);
  
  const handleGenerateSummary = async () => {
    if (sharedExpensesData.length === 0) {
      toast({
        title: "Nenhuma despesa",
        description: "Não há despesas compartilhadas no período selecionado para gerar um resumo.",
        variant: "destructive"
      });
      return;
    }

    setIsSummaryLoading(true);

    try {
      const formattedExpenses = sharedExpensesData.map(expense => {
          const payersString = Object.entries(expense.payers)
              .map(([name, amount]) => `${name} pagou ${formatCurrency(amount)}`)
              .join(', ');
          return `- ${expense.description} em ${format(expense.date, 'dd/MM/yyyy')} (Total: ${formatCurrency(expense.total)}): ${payersString}`;
      }).join('\n');

      const result = await generateSharedExpensesSummary({ formattedExpenses });

      setSummary(result.summary);
      setShowSummaryDialog(true);
    } catch (error) {
      toast({
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
      navigator.clipboard.writeText(summary).then(() => {
          toast({
              title: "Copiado!",
              description: "O resumo foi copiado para a área de transferência."
          });
          setShowSummaryDialog(false);
      });
  };

  const productAnalysisData = useMemo(() => {
    if (!selectedProduct) return { priceHistory: [], quantityHistory: [] };

    const productTransactions = transactions
        .filter(t => t.productId === selectedProduct && t.type === 'expense')
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    const priceHistory = productTransactions.map((t, index, arr) => {
        const pricePerUnit = t.quantity && t.quantity > 0 ? t.amount / t.quantity : t.amount;
        let percentChange = 0;
        if (index > 0) {
            const prevTransaction = arr[index - 1];
            const prevPricePerUnit = prevTransaction.quantity && prevTransaction.quantity > 0 
                ? prevTransaction.amount / prevTransaction.quantity 
                : prevTransaction.amount;
            if (prevPricePerUnit > 0) {
                percentChange = ((pricePerUnit - prevPricePerUnit) / prevPricePerUnit) * 100;
            }
        }
        return {
            date: format(t.date, 'MMM/yy', { locale: ptBR }),
            price: pricePerUnit,
            percentChange: percentChange,
        };
    });

    const quantityByMonth = productTransactions.reduce((acc, t) => {
        const month = format(t.date, 'MMM/yy', { locale: ptBR });
        acc[month] = (acc[month] || 0) + (t.quantity || 1);
        return acc;
    }, {} as Record<string, number>);
    
    const quantityHistory = Object.entries(quantityByMonth).map(([month, quantity]) => ({
      month,
      quantity,
    }));

    return { priceHistory, quantityHistory };
  }, [selectedProduct, transactions]);
  
    const handleGenerateBudgetSuggestions = async () => {
      setIsBudgetLoading(true);
      setBudgetSuggestions('');
      try {
        const totalIncome = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);

        if (totalIncome === 0) {
          toast({
            variant: "destructive",
            title: "Sem receita",
            description: "É preciso registrar receitas no período para gerar sugestões.",
          });
          setIsBudgetLoading(false);
          return;
        }

        const needsCategories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde'];
        const wantsCategories = ['Lazer'];
        
        const getCategoryDetails = (categories: string[]) => {
          const categoryTransactions = filteredTransactions.filter(t => t.type === 'expense' && categories.includes(t.category));
          return {
            spent: categoryTransactions.reduce((acc, t) => acc + t.amount, 0),
            details: categoryTransactions.reduce((acc, t) => {
              const key = t.subcategory || t.description;
              acc[key] = (acc[key] || 0) + t.amount;
              return acc;
            }, {} as Record<string, number>),
          };
        };

        const needsDetails = getCategoryDetails(needsCategories);
        const wantsDetails = getCategoryDetails(wantsCategories);

        const input = {
          totalIncome,
          expenses: {
            needs: { ...needsDetails, ideal: totalIncome * 0.5 },
            wants: { ...wantsDetails, ideal: totalIncome * 0.3 },
          },
        };

        const result = await generateBudgetOptimizationSuggestions(input);
        setBudgetSuggestions(result.suggestions);

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao gerar sugestões",
          description: "Não foi possível conectar com a IA. Tente novamente.",
        });
      } finally {
        setIsBudgetLoading(false);
      }
    };
  
  const renderPriceTooltip = (props: any) => {
      const { active, payload, label } = props;
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          const price = data.price;
          const percentChange = data.percentChange;

          return (
              <div className="bg-popover text-popover-foreground p-2 border rounded-md shadow-lg text-sm">
                  <p className="font-bold">{label}</p>
                  <p>Preço/un.: {formatCurrency(price)}</p>
                  {percentChange !== 0 && (
                      <p className={cn(
                          'flex items-center',
                          percentChange > 0 ? 'text-red-500' : 'text-emerald-500'
                      )}>
                          {percentChange > 0 ? '▲' : '▼'} {percentChange.toFixed(2)}%
                      </p>
                  )}
              </div>
          );
      }
      return null;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-2 border rounded-md shadow-lg text-sm">
          <p className="font-bold">{label || data.name}</p>
          <p>Valor: {formatCurrency(data.value)}</p>
          <p>Percentual: {data.percent.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  const monthlyEvolutionData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);
      
      const receita = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const despesa = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        receita,
        despesa,
      };
    });
  }, [transactions]);


  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
           <FinancialHealthMeter transactions={currentMonthTransactions} debts={debts} />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <FixedVariableAnalysis transactions={currentMonthTransactions} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Budget503020Tab transactions={currentMonthTransactions} />
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 pt-4">
            <Button onClick={handleGenerateBudgetSuggestions} disabled={isBudgetLoading} size="sm">
                {isBudgetLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analisar Meu Orçamento com IA
            </Button>
            {budgetSuggestions && (
                <div className="p-4 bg-secondary rounded-md border text-sm w-full">
                <p className="font-semibold mb-2">Sugestões da IA:</p>
                <p>{budgetSuggestions}</p>
                </div>
            )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <CardTitle>Relatórios Detalhados</CardTitle>
                    <CardDescription>Analise suas finanças com os relatórios abaixo.</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="currentMonth">Este Mês</SelectItem>
                    <SelectItem value="last6Months">Últimos 6 Meses</SelectItem>
                    <SelectItem value="last12Months">Últimos 12 Meses</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" /> Resumo Mensal
                </div>
              </AccordionTrigger>
              <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-4">Receitas vs. Despesas nos últimos 6 meses.</p>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyEvolutionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip
                              contentStyle={{
                                  background: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                              }}
                              formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar dataKey="receita" fill="hsl(var(--chart-2))" name="Receita" />
                          <Bar dataKey="despesa" fill="hsl(var(--chart-5))" name="Despesa" />
                      </BarChart>
                  </ResponsiveContainer>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-2">
                    {selectedCategory && (
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); }}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <DollarSign className="w-5 h-5" /> Análise de Despesas
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Distribuição de despesas por {selectedCategory ? `subcategoria de "${selectedCategory}"` : 'categoria'}. Clique em uma barra para detalhar.
                </p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      layout="vertical"
                      data={selectedCategory ? expensesBySubcategoryData : expensesByCategoryData}
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        tickLine={false} 
                        axisLine={false}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                        onClick={(data) => {
                          if (!selectedCategory) {
                            setSelectedCategory(data.name);
                          }
                        }}
                        className={cn(!selectedCategory && "cursor-pointer")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Despesas por Pagador
                </div>
              </AccordionTrigger>
              <AccordionContent>
                 <div className="space-y-4">
                    {expensesByPayerData.map((payer) => (
                      <div key={payer.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `hsl(${payer.color})` }}
                          />
                          <div>
                            <p className="font-medium">{payer.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(payer.value)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{payer.percent.toFixed(2)}%</p>
                        </div>
                      </div>
                    ))}
                    {expensesByPayerData.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">Nenhuma despesa encontrada para o período.</p>
                    )}
                  </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <DivideCircle className="w-5 h-5" /> Despesas Divididas
                </div>
              </AccordionTrigger>
              <AccordionContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Despesas compartilhadas e o valor pago por cada um.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="w-full sm:w-auto">
                            {isSummaryLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <MessageSquareShare className="mr-2 h-4 w-4" />
                            )}
                            Gerar Relatório
                        </Button>
                    </div>
                </div>
                <div className="hidden md:block">
                  <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                {payers.map(p => <TableHead key={`summary-payer-${p.id}`} className="text-right">{p.name}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sharedExpensesData.length > 0 ? (
                                sharedExpensesData.map((expense, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell>{format(expense.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(expense.total)}</TableCell>
                                        {payers.map(p => (
                                            <TableCell key={p.id} className="text-right">
                                                {expense.payers[p.name] ? formatCurrency(expense.payers[p.name]) : '-'}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={payers.length + 3} className="text-center">
                                        Nenhuma despesa compartilhada encontrada no período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
                 <div className="md:hidden space-y-4">
                  {sharedExpensesData.length > 0 ? (
                      sharedExpensesData.map((expense, i) => (
                          <Card key={i} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{expense.description}</p>
                                <p className="text-sm text-muted-foreground">{format(expense.date, 'dd/MM/yyyy')}</p>
                              </div>
                              <p className="font-medium">{formatCurrency(expense.total)}</p>
                            </div>
                            <div className="mt-2 space-y-1">
                              {payers.map(p => expense.payers[p.name] && (
                                <div key={p.id} className="flex justify-between text-sm">
                                  <p>{p.name}</p>
                                  <p>{formatCurrency(expense.payers[p.name])}</p>
                                </div>
                              ))}
                            </div>
                          </Card>
                      ))
                  ) : (
                      <p className="text-center text-muted-foreground py-8">
                          Nenhuma despesa compartilhada encontrada no período.
                      </p>
                  )}
                 </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Dívidas e Financiamentos
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <DebtAnalysisTab debts={debts} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Análise de Produtos
                </div>
              </AccordionTrigger>
              <AccordionContent>
                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <p className="text-sm text-muted-foreground">
                        Variação de preços e quantidade comprada por mês.
                      </p>
                      <Select onValueChange={setSelectedProduct}>
                          <SelectTrigger className="w-full md:w-[280px]">
                              <SelectValue placeholder="Selecione um produto para analisar" />
                          </SelectTrigger>
                          <SelectContent>
                              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                   {selectedProduct ? (
                      <div className="grid md:grid-cols-2 gap-8">
                          <div>
                              <h4 className="font-semibold text-center mb-4">Histórico de Preços (por unidade)</h4>
                              <ResponsiveContainer width="100%" height={250}>
                                  <LineChart data={productAnalysisData.priceHistory}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="date" />
                                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                      <Tooltip content={renderPriceTooltip} />
                                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} name="Preço"/>
                                  </LineChart>
                              </ResponsiveContainer>
                          </div>
                           <div>
                              <h4 className="font-semibold text-center mb-4">Quantidade Comprada por Mês</h4>
                              <ResponsiveContainer width="100%" height={250}>
                                  <BarChart data={productAnalysisData.quantityHistory}>
                                       <CartesianGrid strokeDasharray="3 3" />
                                       <XAxis dataKey="month" />
                                       <YAxis allowDecimals={false} />
                                       <Tooltip formatter={(value: number) => [value, 'Quantidade']} />
                                       <Bar dataKey="quantity" fill="hsl(var(--accent))" name="Quantidade" />
                                   </BarChart>
                               </ResponsiveContainer>
                           </div>
                      </div>
                  ) : (
                      <div className="text-center text-muted-foreground py-12">
                          <p>Selecione um produto para ver a análise.</p>
                      </div>
                  )}
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Relatório para Compartilhar</AlertDialogTitle>
                      <AlertDialogDescription>
                          Abaixo está o resumo das despesas. Copie o texto para compartilhar.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea value={summary} readOnly rows={10} className="bg-muted"/>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Fechar</AlertDialogCancel>
                      <Button onClick={handleCopyToClipboard}>Copiar Relatório</Button>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

        </CardContent>
      </Card>
    </div>
  );
}
