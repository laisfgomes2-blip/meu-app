"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Transaction } from '@/lib/data';
import { cn } from "@/lib/utils";
import { Target, Smile, PiggyBank as PiggyBankIcon } from 'lucide-react';

interface Budget503020TabProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const BudgetCategory = ({ title, icon, targetPercent, actualPercentOfIncome, progressPercent, spent, ideal, isOverBudget }: { title: string, icon: React.ReactNode, targetPercent: number, actualPercentOfIncome: number, progressPercent: number, spent: number, ideal: number, isOverBudget: boolean }) => {
    const overAmount = spent - ideal;
    
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {icon}
                <h4 className="font-semibold">{title} - {targetPercent}%</h4>
            </div>
            <div className="flex justify-between items-baseline text-sm">
                <div className={cn("font-medium", isOverBudget ? "text-destructive" : "text-muted-foreground")}>
                    Gasto: {formatCurrency(spent)} ({actualPercentOfIncome.toFixed(1)}%)
                    {isOverBudget && (
                        <span className="block text-xs font-normal">
                            ({formatCurrency(overAmount)} acima)
                        </span>
                    )}
                </div>
                <span className="text-muted-foreground">Ideal: {formatCurrency(ideal)}</span>
            </div>
            <Progress value={progressPercent} className={cn(isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")} />
        </div>
    );
};

export default function Budget503020Tab({ transactions }: Budget503020TabProps) {
  const budgetData = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    if (totalIncome === 0) {
      return {
        needs: { spent: 0, percent: 0 },
        wants: { spent: 0, percent: 0 },
        savings: { spent: 0, percent: 0 },
        totalIncome: 0,
      };
    }
    
    const needsCategories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde'];
    const wantsCategories = ['Lazer'];
    const savingsCategories = ['Investimentos', 'Pagamentos'];

    const getSpentAmount = (categories: string[]) => {
      return transactions
        .filter(t => t.type === 'expense' && categories.includes(t.category))
        .reduce((acc, t) => acc + t.amount, 0);
    };
    
    const needsSpent = getSpentAmount(needsCategories);
    const wantsSpent = getSpentAmount(wantsCategories);
    const savingsSpent = getSpentAmount(savingsCategories);

    return {
      needs: {
        spent: needsSpent,
        percentOfIncome: (needsSpent / totalIncome) * 100,
      },
      wants: {
        spent: wantsSpent,
        percentOfIncome: (wantsSpent / totalIncome) * 100,
      },
      savings: {
        spent: savingsSpent,
        percentOfIncome: (savingsSpent / totalIncome) * 100,
      },
      totalIncome,
    };
  }, [transactions]);

  const { needs, wants, savings, totalIncome } = budgetData;
  const idealNeeds = totalIncome * 0.5;
  const idealWants = totalIncome * 0.3;
  const idealSavings = totalIncome * 0.2;
  
  const needsProgress = idealNeeds > 0 ? (needs.spent / idealNeeds) * 100 : 0;
  const wantsProgress = idealWants > 0 ? (wants.spent / idealWants) * 100 : 0;
  const savingsProgress = idealSavings > 0 ? (savings.spent / idealSavings) * 100 : 0;

  const needsOverBudget = needs.spent > idealNeeds;
  const wantsOverBudget = wants.spent > idealWants;
  const savingsOverBudget = savings.spent > idealSavings;

  return (
    <Card className="shadow-none border-none">
      <CardHeader>
        <CardTitle>Orçamento 50/30/20</CardTitle>
        <CardDescription>
            Análise de suas despesas com base na regra 50% (necessidades), 30% (desejos) e 20% (poupança).
            Sua renda total no período foi de {formatCurrency(totalIncome)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalIncome > 0 ? (
            <>
                <BudgetCategory
                    title="Necessidades"
                    icon={<Target className="text-primary" />}
                    targetPercent={50}
                    actualPercentOfIncome={needs.percentOfIncome}
                    progressPercent={needsProgress}
                    spent={needs.spent}
                    ideal={idealNeeds}
                    isOverBudget={needsOverBudget}
                />
                <BudgetCategory
                    title="Desejos"
                    icon={<Smile className="text-primary" />}
                    targetPercent={30}
                    actualPercentOfIncome={wants.percentOfIncome}
                    progressPercent={wantsProgress}
                    spent={wants.spent}
                    ideal={idealWants}
                    isOverBudget={wantsOverBudget}
                />
                <BudgetCategory
                    title="Poupança e Dívidas"
                    icon={<PiggyBankIcon className="text-primary" />}
                    targetPercent={20}
                    actualPercentOfIncome={savings.percentOfIncome}
                    progressPercent={savingsProgress}
                    spent={savings.spent}
                    ideal={idealSavings}
                    isOverBudget={savingsOverBudget}
                />
            </>
        ) : (
            <p className="text-center text-muted-foreground">
                Não há receita registrada neste período para calcular o orçamento.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
