
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from '@/lib/data';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FixedVariableAnalysisProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const COLORS = ['hsl(var(--chart-5))', 'hsl(var(--chart-2))'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-2 border rounded-md shadow-lg text-sm">
          <p className="font-bold">{data.name}</p>
          <p>Valor: {formatCurrency(data.value)}</p>
          <p>Percentual: {data.percent.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };


export default function FixedVariableAnalysis({ transactions }: FixedVariableAnalysisProps) {
  const analysisData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);

    const fixedExpenses = expenses
      .filter(t => t.isFixed)
      .reduce((acc, t) => acc + t.amount, 0);

    const variableExpenses = totalExpenses - fixedExpenses;

    if (totalExpenses === 0) {
      return {
        chartData: [],
        tableData: [],
        totalExpenses: 0
      };
    }

    const chartData = [
      { name: 'Despesas Variáveis', value: variableExpenses, percent: (variableExpenses / totalExpenses) * 100 },
      { name: 'Despesas Fixas', value: fixedExpenses, percent: (fixedExpenses / totalExpenses) * 100 },
    ].filter(d => d.value > 0);

    return { chartData, totalExpenses };
  }, [transactions]);

  const { chartData, totalExpenses } = analysisData;

  return (
    <Card className="shadow-none border-none">
      <CardHeader>
        <CardTitle>Despesas Fixas vs. Variáveis</CardTitle>
        <CardDescription>
            Análise da proporção dos seus gastos fixos e variáveis no período.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalExpenses > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Despesa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map(item => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                      <TableCell className="text-right">{item.percent.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                   <TableRow className="font-bold bg-muted">
                      <TableCell>Total de Despesas</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalExpenses)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma despesa registrada no período para análise.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
