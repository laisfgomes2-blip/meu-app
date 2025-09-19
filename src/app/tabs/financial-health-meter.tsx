
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, Debt } from '@/lib/data';
import { cn } from "@/lib/utils";
import { Thermometer, Smile, Meh, Frown } from 'lucide-react';

interface FinancialHealthMeterProps {
  transactions: Transaction[];
  debts: Debt[];
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function FinancialHealthMeter({ transactions, debts }: FinancialHealthMeterProps) {
  const financialHealth = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalMonthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
      
    const remainingDebtBalance = debts.reduce((acc, debt) => acc + debt.totalAmount - debt.amountPaid, 0);

    if (totalIncome === 0) {
      return {
        ratio: 0,
        level: 'unknown',
        message: 'Nenhuma receita registrada no mês atual para calcular a saúde financeira.',
        totalIncome: 0,
        totalMonthlyExpenses,
        remainingDebtBalance
      };
    }

    // O cálculo agora se baseia estritamente na relação entre despesas e receitas mensais.
    const expenseRatio = totalMonthlyExpenses / totalIncome;
    let level: 'healthy' | 'warning' | 'danger' = 'healthy';
    let message = 'Excelente! Suas despesas estão bem abaixo da sua renda, permitindo uma boa capacidade de poupança.';
    
    if (expenseRatio >= 0.8) {
      level = 'danger';
      message = 'Alerta! Suas despesas consomem a maior parte da sua renda. É crucial revisar seus gastos e cortar custos.';
    } else if (expenseRatio >= 0.6) {
      level = 'warning';
      message = 'Atenção. Suas despesas estão um pouco altas em relação à sua renda. Monitore seus gastos para garantir que sobre dinheiro para poupar.';
    }

    return { ratio: expenseRatio, level, message, totalIncome, totalMonthlyExpenses, remainingDebtBalance };
  }, [transactions, debts]);

  const { level, message, totalIncome, totalMonthlyExpenses, remainingDebtBalance } = financialHealth;

  const meterFillHeight = useMemo(() => {
    if (level === 'healthy') return '25%';
    if (level === 'warning') return '55%';
    if (level === 'danger') return '85%';
    return '0%';
  }, [level]);

  const levelConfig = {
    healthy: {
      color: 'bg-green-500',
      icon: <Smile className="w-8 h-8 text-green-500" />,
      label: 'Saudável'
    },
    warning: {
      color: 'bg-yellow-500',
      icon: <Meh className="w-8 h-8 text-yellow-500" />,
      label: 'Atenção'
    },
    danger: {
      color: 'bg-red-500',
      icon: <Frown className="w-8 h-8 text-red-500" />,
      label: 'Perigo'
    },
    unknown: {
       color: 'bg-gray-300',
       icon: <Meh className="w-8 h-8 text-gray-500" />,
       label: 'Indefinido'
    }
  };

  const currentLevel = levelConfig[level];

  return (
    <Card className="shadow-none border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Thermometer />
            Termômetro da Saúde Financeira
        </CardTitle>
        <CardDescription>
            Uma análise da sua relação entre despesas e renda no mês atual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalIncome > 0 ? (
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="flex-shrink-0">
              <div className="w-16 h-48 bg-muted rounded-full flex flex-col-reverse relative overflow-hidden border-2 border-muted">
                <div 
                  className={cn("w-full transition-all duration-700 ease-in-out", currentLevel.color)}
                  style={{ height: meterFillHeight }}
                />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    {currentLevel.icon}
                    <h3 className="text-2xl font-bold">{currentLevel.label}</h3>
                </div>
                <p className="text-muted-foreground">{message}</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="font-semibold">Renda Mensal</p>
                        <p>{formatCurrency(totalIncome)}</p>
                    </div>
                     <div>
                        <p className="font-semibold">Despesas Mensais</p>
                        <p>{formatCurrency(totalMonthlyExpenses)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Saldo Devedor Total</p>
                        <p>{formatCurrency(remainingDebtBalance)}</p>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
