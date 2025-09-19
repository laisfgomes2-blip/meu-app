
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Landmark, Coins, MinusCircle, TrendingUp, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Payer, PiggyBank, PiggyBankTransaction, Transaction, PaymentMethod, BenefitCard, CreditCard } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PiggyBanksTabProps {
  piggyBanks: PiggyBank[];
  setPiggyBanks: React.Dispatch<React.SetStateAction<PiggyBank[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  piggyBankTransactions: PiggyBankTransaction[];
  setPiggyBankTransactions: React.Dispatch<React.SetStateAction<PiggyBankTransaction[]>>;
  payers: Payer[];
  paymentMethods: PaymentMethod[];
  benefitCards: BenefitCard[];
  creditCards: CreditCard[];
}

export default function PiggyBanksTab({
  piggyBanks,
  setPiggyBanks,
  transactions,
  setTransactions,
  piggyBankTransactions,
  setPiggyBankTransactions,
  payers,
  paymentMethods,
  benefitCards,
  creditCards
}: PiggyBanksTabProps) {
  const [openNewPiggyBankDialog, setOpenNewPiggyBankDialog] = useState(false);
  const [newPiggyBankData, setNewPiggyBankData] = useState({ name: '', goal: '' });
  const [selectedPiggyBank, setSelectedPiggyBank] = useState<PiggyBank | null>(null);
  
  const [openDepositDialog, setOpenDepositDialog] = useState(false);
  const [depositData, setDepositData] = useState({ amount: '', payers: [] as string[], paymentMethod: '' });
  
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false);
  const [withdrawData, setWithdrawData] = useState({ amount: '', payer: '', paymentMethod: 'Transferência' });
  
  const [openYieldDialog, setOpenYieldDialog] = useState(false);
  const [yieldAmount, setYieldAmount] = useState('');
  
  const [openStatementDialog, setOpenStatementDialog] = useState(false);
  
  const { toast } = useToast();

  const justPayers = useMemo(() => payers.filter(p => p.isPayer), [payers]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const nonCreditCardPaymentMethods = [
      ...paymentMethods,
      ...benefitCards.map(card => ({ id: card.id, name: card.name })),
  ];
  
  const handleAddPiggyBank = () => {
    if (newPiggyBankData.name && parseFloat(newPiggyBankData.goal) > 0) {
      const newPiggy: PiggyBank = {
        id: `pb${Date.now()}`,
        name: newPiggyBankData.name,
        goal: parseFloat(newPiggyBankData.goal),
        currentAmount: 0,
      };
      setPiggyBanks(prev => [...prev, newPiggy]);
      setNewPiggyBankData({ name: '', goal: '' });
      setOpenNewPiggyBankDialog(false);
    }
  };

  const handleDeposit = () => {
    if (!selectedPiggyBank || !depositData.amount || depositData.payers.length === 0 || !depositData.paymentMethod) return;

    const amount = parseFloat(depositData.amount);
    const amountPerPayer = amount / depositData.payers.length;

    const isBenefitCardPayment = benefitCards.some(card => card.name === depositData.paymentMethod);
    const isCreditCardPayment = creditCards.some(card => card.name === depositData.paymentMethod);
    const isPaidAutomatically = isBenefitCardPayment || isCreditCardPayment;

    // Create main expense transaction
    const newTransactions: Transaction[] = depositData.payers.map(payer => ({
        id: `t${Date.now()}-${payer}`,
        date: new Date(),
        description: `Aporte Caixinha: ${selectedPiggyBank.name}`,
        amount: amountPerPayer,
        type: 'expense',
        category: 'Investimentos',
        subcategory: 'Aporte Caixinha',
        payer: payer,
        paymentMethod: depositData.paymentMethod,
        paid: isPaidAutomatically
    }));
    setTransactions(prev => [...prev, ...newTransactions].sort((a,b) => b.date.getTime() - a.date.getTime()));

    // Create piggy bank transaction
    const newPiggyTransaction: PiggyBankTransaction = {
      id: `pbt${Date.now()}`,
      piggyBankId: selectedPiggyBank.id,
      date: new Date(),
      type: 'deposit',
      amount: amount,
    };
    setPiggyBankTransactions(prev => [...prev, newPiggyTransaction]);

    // Update piggy bank balance
    setPiggyBanks(prev => prev.map(p => p.id === selectedPiggyBank.id ? { ...p, currentAmount: p.currentAmount + amount } : p));
    
    toast({ title: "Depósito realizado com sucesso!"});
    setOpenDepositDialog(false);
    setDepositData({ amount: '', payers: [], paymentMethod: '' });
  };
  
  const handleWithdraw = () => {
    if (!selectedPiggyBank || !withdrawData.amount || !withdrawData.payer) return;
    
    const amount = parseFloat(withdrawData.amount);
    if (amount > selectedPiggyBank.currentAmount) {
        toast({ variant: "destructive", title: "Saldo insuficiente!"});
        return;
    }
    
    // Create main income transaction
    const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        date: new Date(),
        description: `Resgate Caixinha: ${selectedPiggyBank.name}`,
        amount: amount,
        type: 'income',
        category: 'Investimentos',
        subcategory: 'Resgate Caixinha',
        payer: withdrawData.payer,
        paymentMethod: 'Transferência',
        paid: true,
    };
    setTransactions(prev => [...prev, newTransaction].sort((a,b) => b.date.getTime() - a.date.getTime()));
    
    // Create piggy bank transaction
    const newPiggyTransaction: PiggyBankTransaction = {
      id: `pbt${Date.now()}`,
      piggyBankId: selectedPiggyBank.id,
      date: new Date(),
      type: 'withdrawal',
      amount: amount,
    };
    setPiggyBankTransactions(prev => [...prev, newPiggyTransaction]);

    // Update piggy bank balance
    setPiggyBanks(prev => prev.map(p => p.id === selectedPiggyBank.id ? { ...p, currentAmount: p.currentAmount - amount } : p));

    toast({ title: "Resgate realizado com sucesso!"});
    setOpenWithdrawDialog(false);
    setWithdrawData({ amount: '', payer: '', paymentMethod: 'Transferência' });
  };
  
  const handleYield = () => {
    if (!selectedPiggyBank || !yieldAmount) return;
    const amount = parseFloat(yieldAmount);

    const newPiggyTransaction: PiggyBankTransaction = {
      id: `pbt${Date.now()}`,
      piggyBankId: selectedPiggyBank.id,
      date: new Date(),
      type: 'yield',
      amount: amount,
    };
    setPiggyBankTransactions(prev => [...prev, newPiggyTransaction]);

    setPiggyBanks(prev => prev.map(p => p.id === selectedPiggyBank.id ? { ...p, currentAmount: p.currentAmount + amount } : p));
    
    toast({ title: "Rendimento adicionado!"});
    setOpenYieldDialog(false);
    setYieldAmount('');
  };

  const getStatement = () => {
      if (!selectedPiggyBank) return [];
      return piggyBankTransactions
        .filter(t => t.piggyBankId === selectedPiggyBank.id)
        .sort((a,b) => b.date.getTime() - a.date.getTime());
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Minhas Caixinhas</h2>
        <Button onClick={() => setOpenNewPiggyBankDialog(true)}>
          <PlusCircle className="mr-2" /> Criar Nova Caixinha
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {piggyBanks.map(piggy => (
          <Card key={piggy.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <CardTitle>{piggy.name}</CardTitle>
              <CardDescription>Objetivo: {formatCurrency(piggy.goal)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-lg">{formatCurrency(piggy.currentAmount)}</span>
                <span className="text-sm text-muted-foreground">{((piggy.currentAmount / piggy.goal) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(piggy.currentAmount / piggy.goal) * 100} className="[&>div]:bg-accent" />
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { setSelectedPiggyBank(piggy); setOpenDepositDialog(true); }}>
                <Coins className="mr-2"/> Aportar
              </Button>
              <Button variant="outline" onClick={() => { setSelectedPiggyBank(piggy); setOpenWithdrawDialog(true); }}>
                <MinusCircle className="mr-2"/> Resgatar
              </Button>
              <Button variant="outline" className="col-span-2" onClick={() => { setSelectedPiggyBank(piggy); setOpenStatementDialog(true); }}>
                <BookOpen className="mr-2"/> Extrato
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* New Piggy Bank Dialog */}
      <Dialog open={openNewPiggyBankDialog} onOpenChange={setOpenNewPiggyBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Caixinha</DialogTitle>
            <DialogDescription>Defina um nome e um objetivo para sua nova caixinha de economia.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={newPiggyBankData.name} onChange={e => setNewPiggyBankData({...newPiggyBankData, name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal" className="text-right">Objetivo (R$)</Label>
              <Input id="goal" type="number" value={newPiggyBankData.goal} onChange={e => setNewPiggyBankData({...newPiggyBankData, goal: e.target.value})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddPiggyBank}>Criar Caixinha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Deposit Dialog */}
      <Dialog open={openDepositDialog} onOpenChange={setOpenDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aportar na Caixinha: {selectedPiggyBank?.name}</DialogTitle>
            <DialogDescription>Informe o valor e a origem do dinheiro.</DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deposit-amount" className="text-right">Valor (R$)</Label>
                <Input id="deposit-amount" type="number" value={depositData.amount} onChange={e => setDepositData({...depositData, amount: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right">Forma Pgto.</Label>
                <Select onValueChange={(value) => setDepositData(d => ({...d, paymentMethod: value}))}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                        {nonCreditCardPaymentMethods.map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Pagadores</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    {justPayers.map(payer => (
                        <div key={payer.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`payer-deposit-${payer.id}`}
                                checked={depositData.payers.includes(payer.name)}
                                onCheckedChange={(checked) => setDepositData(prev => ({
                                    ...prev,
                                    payers: checked ? [...prev.payers, payer.name] : prev.payers.filter(p => p !== payer.name)
                                }))}
                            />
                            <Label htmlFor={`payer-deposit-${payer.id}`} className="font-normal">{payer.name}</Label>
                        </div>
                    ))}
                </div>
              </div>
           </div>
          <DialogFooter>
            <Button onClick={handleDeposit}>Confirmar Aporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Withdraw Dialog */}
      <Dialog open={openWithdrawDialog} onOpenChange={setOpenWithdrawDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Resgatar da Caixinha: {selectedPiggyBank?.name}</DialogTitle>
                <DialogDescription>Informe o valor e para quem será destinado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="withdraw-amount" className="text-right">Valor (R$)</Label>
                    <Input id="withdraw-amount" type="number" value={withdrawData.amount} onChange={e => setWithdrawData({...withdrawData, amount: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="withdraw-payer" className="text-right">Destinatário</Label>
                    <Select onValueChange={(value) => setWithdrawData(d => ({...d, payer: value}))}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o destinatário" />
                        </SelectTrigger>
                        <SelectContent>
                            {justPayers.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleWithdraw}>Confirmar Resgate</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Statement Dialog */}
      <Dialog open={openStatementDialog} onOpenChange={setOpenStatementDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Extrato: {selectedPiggyBank?.name}</DialogTitle>
                <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted-foreground">Saldo Atual:</span>
                    <span className="font-bold">{formatCurrency(selectedPiggyBank?.currentAmount || 0)}</span>
                </div>
            </DialogHeader>
            <div className="max-h-80 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {getStatement().map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{format(t.date, 'dd/MM/yy')}</TableCell>
                                <TableCell>
                                    <span className={cn('capitalize', {
                                        'text-accent': t.type === 'deposit' || t.type === 'yield',
                                        'text-destructive': t.type === 'withdrawal'
                                    })}>
                                        {t.type === 'deposit' && 'Aporte'}
                                        {t.type === 'withdrawal' && 'Resgate'}
                                        {t.type === 'yield' && 'Rendimento'}
                                    </span>
                                </TableCell>
                                <TableCell className={cn('text-right font-medium', {
                                    'text-accent': t.type === 'deposit' || t.type === 'yield',
                                    'text-destructive': t.type === 'withdrawal'
                                })}>
                                    {t.type === 'withdrawal' ? '-' : '+'} {formatCurrency(t.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setOpenYieldDialog(true)}>
                    <TrendingUp className="mr-2" /> Adicionar Rendimento
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Yield Dialog */}
       <Dialog open={openYieldDialog} onOpenChange={setOpenYieldDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Adicionar Rendimento</DialogTitle>
                <DialogDescription>Adicione manualmente um valor de rendimento à caixinha.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Label htmlFor="yield-amount">Valor do Rendimento (R$)</Label>
                <Input id="yield-amount" type="number" value={yieldAmount} onChange={e => setYieldAmount(e.target.value)} />
            </div>
            <DialogFooter>
                <Button onClick={handleYield}>Adicionar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
