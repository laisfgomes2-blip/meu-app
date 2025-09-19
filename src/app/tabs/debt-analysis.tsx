
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Debt } from '@/lib/data';

interface DebtAnalysisTabProps {
  debts: Debt[];
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function DebtAnalysisTab({ debts }: DebtAnalysisTabProps) {
  const totalDebt = debts.reduce((acc, debt) => acc + debt.totalAmount, 0);
  const totalPaid = debts.reduce((acc, debt) => acc + debt.amountPaid, 0);
  const remainingBalance = totalDebt - totalPaid;
  const totalMonthlyPayments = debts.reduce((acc, debt) => acc + debt.monthlyPayment, 0);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Análise de Dívidas e Financiamentos</CardTitle>
        <CardDescription>
            Acompanhe o progresso de suas dívidas e financiamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {debts.length > 0 ? (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Saldo Devedor</TableHead>
                    <TableHead className="text-center">Progresso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((debt) => {
                    const remaining = debt.totalAmount - debt.amountPaid;
                    const progress = debt.totalAmount > 0 ? (debt.amountPaid / debt.totalAmount) * 100 : 0;
                    return (
                      <TableRow key={debt.id}>
                        <TableCell>
                          <p className="font-medium">{debt.name}</p>
                          <p className="text-sm text-muted-foreground">Parcela: {formatCurrency(debt.monthlyPayment)}</p>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.totalAmount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(remaining)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center">
                              <span className="text-xs text-muted-foreground mb-1">{progress.toFixed(1)}%</span>
                              <Progress value={progress} className="h-2 [&>div]:bg-primary" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-4">
              {debts.map((debt) => {
                const remaining = debt.totalAmount - debt.amountPaid;
                const progress = debt.totalAmount > 0 ? (debt.amountPaid / debt.totalAmount) * 100 : 0;
                return (
                  <Card key={debt.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{debt.name}</p>
                        <p className="text-sm text-muted-foreground">Parcela: {formatCurrency(debt.monthlyPayment)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(remaining)}</p>
                        <p className="text-sm text-muted-foreground">de {formatCurrency(debt.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={progress} className="h-2 [&>div]:bg-primary" />
                      <p className="text-xs text-right mt-1 text-muted-foreground">{progress.toFixed(1)}% pago</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-4">Nenhuma dívida cadastrada. Adicione suas dívidas na aba 'Configurações'.</p>
        )}
      </CardContent>
      {debts.length > 0 && (
        <CardFooter className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm pt-6">
          <div>
              <p className="text-muted-foreground">Dívida Total</p>
              <p className="font-bold text-lg">{formatCurrency(totalDebt)}</p>
          </div>
          <div>
              <p className="text-muted-foreground">Total Pago</p>
              <p className="font-bold text-lg text-accent">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
              <p className="text-muted-foreground">Saldo Devedor</p>
              <p className="font-bold text-lg text-destructive">{formatCurrency(remainingBalance)}</p>
          </div>
          <div>
              <p className="text-muted-foreground">Total Mensal</p>
              <p className="font-bold text-lg">{formatCurrency(totalMonthlyPayments)}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
