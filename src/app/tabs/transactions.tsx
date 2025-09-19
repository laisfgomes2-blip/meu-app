
"use client";

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, PiggyBank as PiggyBankIcon, CreditCard as CreditCardIcon, Calendar as CalendarIcon, Pencil, ChevronLeft, ChevronRight, Trash2, RefreshCw, Landmark, Filter, MessageSquareShare, Pin, Upload, Loader2, FileUp, XCircle } from 'lucide-react';
import { Transaction, BenefitCard, CreditCard, PiggyBank, Payer, Category, PaymentMethod, Debt } from '@/lib/data';
import { format, addMonths, subMonths, isSameMonth, isBefore, startOfDay, parse, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface TransactionsTabProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  payers: Payer[];
  categories: Category[];
  benefitCards: BenefitCard[];
  setBenefitCards: React.Dispatch<React.SetStateAction<BenefitCard[]>>;
  creditCards: CreditCard[];
  setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
  paymentMethods: PaymentMethod[];
  piggyBanks: PiggyBank[];
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
}

type GroupedTransaction = Transaction & { payers: string[]; totalAmount: number, individualAmount: number };

export default function TransactionsTab({
  transactions,
  setTransactions,
  payers,
  categories,
  benefitCards,
  setBenefitCards,
  creditCards,
  setCreditCards,
  paymentMethods,
  piggyBanks,
  debts,
  setDebts
}: TransactionsTabProps) {
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactionToDelete, setTransactionToDelete] = useState<GroupedTransaction | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [transactionData, setTransactionData] = useState<Omit<Transaction, 'id' | 'payer' | 'amount'>>({
    description: '',
    date: new Date(),
    type: 'expense',
    category: '',
    subcategory: '',
    paymentMethod: '',
    paid: false,
    isFixed: false,
    debtId: undefined,
  });
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [recurrenceType, setRecurrenceType] = useState('single');
  const [installments, setInstallments] = useState(1);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);


  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterPayer, setFilterPayer] = useState('');

  const [report, setReport] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  const [cardToPay, setCardToPay] = useState<CreditCard | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ payers: string[], method: string }>({ payers: [], method: '' });
  
  const [cardToRecharge, setCardToRecharge] = useState<BenefitCard | null>(null);

  // Statement Import State
  const [cardToImport, setCardToImport] = useState<CreditCard | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statementFile, setStatementFile] = useState<File | null>(null);

  const justPayers = useMemo(() => payers.filter(p => p.isPayer), [payers]);

  const combinedPaymentMethods = [
    ...paymentMethods,
    ...benefitCards.map(card => ({ id: card.id, name: card.name })),
    ...creditCards.map(card => ({ id: card.id, name: card.name })),
  ];
  
  const nonCreditCardPaymentMethods = [
    ...paymentMethods,
    ...benefitCards.map(card => ({ id: card.id, name: card.name })),
  ];


  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'amount') {
        setTransactionAmount(parseFloat(value) || 0);
    } else if (name === 'installments') {
        setInstallments(parseInt(value, 10) || 1);
    } else if (type === 'checkbox') {
        setTransactionData(prev => ({ ...prev, [name]: checked }));
    }
    else {
        setTransactionData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setTransactionData(prev => ({ ...prev, [name]: value }));
    
    // Auto-check "paid" if a card is selected
    if (name === 'paymentMethod') {
      const isCard = benefitCards.some(c => c.name === value) || creditCards.some(c => c.name === value);
      if (isCard) {
        setTransactionData(prev => ({ ...prev, paid: true, paymentMethod: value }));
      } else {
        setTransactionData(prev => ({ ...prev, paymentMethod: value }));
      }
    }
  };

  const handleDateChange = (date?: Date) => {
    if (date) {
      setTransactionData(prev => ({ ...prev, date }));
    }
  };
  
  const resetForm = () => {
    setEditingTransaction(null);
    setTransactionData({
        description: '',
        date: new Date(),
        type: 'expense',
        category: '',
        subcategory: '',
        paymentMethod: '',
        paid: false,
        isFixed: false,
        debtId: undefined,
    });
    setTransactionAmount(0);
    setSelectedPayers([]);
    setRecurrenceType('single');
    setInstallments(1);
  }

  const handleOpenDialog = (transaction: Transaction | null = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setTransactionData({
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        subcategory: transaction.subcategory,
        paymentMethod: transaction.paymentMethod,
        paid: transaction.paid || false,
        isFixed: transaction.isFixed || false,
        debtId: transaction.debtId,
      });
      const totalAmount = transactions
        .filter(t => t.description === transaction.description && t.date.getTime() === transaction.date.getTime())
        .reduce((acc, t) => acc + t.amount, 0);
      const transactionPayers = transactions
        .filter(t => t.description === transaction.description && t.date.getTime() === transaction.date.getTime())
        .map(t => t.payer);
      
      setTransactionAmount(totalAmount);
      setSelectedPayers(transactionPayers);
      setRecurrenceType('single');
      setInstallments(1);
    } else {
      resetForm();
    }
    setOpen(true);
  };
  
  const proceedToSaveTransaction = () => {
    if (selectedPayers.length === 0 || !transactionData.description || transactionAmount <= 0) {
      toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha a descrição, valor e selecione pelo menos um pagador."
      });
      return;
    }

    const isBenefitCardPayment = benefitCards.some(card => card.name === transactionData.paymentMethod);
    const isCreditCardPayment = creditCards.some(card => card.name === transactionData.paymentMethod);

    const isPaidAutomatically = transactionData.paid;

    const newOrUpdatedTransactions: Transaction[] = [];
    const isInstallment = recurrenceType === 'installment' && !editingTransaction;
    const isRecurring = recurrenceType === 'recurring' && !editingTransaction;

    let loopCount = 1;
    let amountPerInstallment = transactionAmount;

    if (isInstallment) {
        loopCount = installments;
        amountPerInstallment = transactionAmount / installments;
    } else if (isRecurring) {
        const transactionMonth = transactionData.date.getMonth();
        loopCount = 12 - transactionMonth;
    }

    const amountPerPayer = amountPerInstallment / selectedPayers.length;

    for (let i = 0; i < loopCount; i++) {
        const transactionDate = addMonths(transactionData.date, i);
        let description = transactionData.description;

        if (isInstallment && loopCount > 1) {
            description = `${description} (${i + 1}/${installments})`;
        }

        selectedPayers.forEach(payer => {
            newOrUpdatedTransactions.push({
                id: `t${Date.now()}-${payer}-${i}`,
                ...transactionData,
                date: transactionDate,
                description: description,
                amount: amountPerPayer,
                payer: payer,
                paid: isPaidAutomatically,
            });
        });
    }

    if (transactionData.type === 'expense' && !editingTransaction) {
        if (isBenefitCardPayment) {
            setBenefitCards(prevCards =>
                prevCards.map(card =>
                    card.name === transactionData.paymentMethod
                        ? { ...card, balance: card.balance - transactionAmount }
                        : card
                )
            );
        } else if (isCreditCardPayment) {
            setCreditCards(prevCards =>
                prevCards.map(card =>
                    card.name === transactionData.paymentMethod
                        ? { ...card, balance: card.balance + transactionAmount }
                        : card
                )
            );
        }
    }

    if (transactionData.debtId && transactionData.paid && !editingTransaction) {
        setDebts(prevDebts => prevDebts.map(debt => 
            debt.id === transactionData.debtId
            ? { ...debt, amountPaid: debt.amountPaid + transactionAmount }
            : debt
        ));
    }


    if (editingTransaction) {
        const otherTransactions = transactions.filter(
            t => !(t.description === editingTransaction.description && t.date.getTime() === editingTransaction.date.getTime())
        );
        setTransactions([...otherTransactions, ...newOrUpdatedTransactions]);
    } else {
        setTransactions(prev => [...prev, ...newOrUpdatedTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()));
    }

    resetForm();
    setOpen(false);
  };

  const handleSaveTransaction = () => {
    // Check for duplicates only on new transactions
    if (!editingTransaction) {
        const groupedExisting = Object.values(transactions.reduce((acc, t) => {
            const key = `${t.description.toLowerCase().trim()}-${t.date.toISOString().split('T')[0]}`;
            if (!acc[key]) {
                acc[key] = { ...t, totalAmount: 0 };
            }
            acc[key].totalAmount += t.amount;
            return acc;
        }, {} as Record<string, Transaction & { totalAmount: number }>));
        
        const isDuplicate = groupedExisting.some(t => 
            t.description.toLowerCase().trim() === transactionData.description.toLowerCase().trim() &&
            isSameDay(t.date, transactionData.date) &&
            Math.abs(t.totalAmount - transactionAmount) < 0.01 // Compare floats with a small tolerance
        );

        if (isDuplicate) {
            setShowDuplicateWarning(true);
            return;
        }
    }
    proceedToSaveTransaction();
  };
  
  const handleTogglePaid = (transaction: GroupedTransaction) => {
    const isMarkingAsPaid = !transaction.paid;

    if (isMarkingAsPaid) {
        if (!transaction.paymentMethod || transaction.payers.length === 0) {
            toast({
                variant: "destructive",
                title: "Informação Faltando",
                description: "É necessário informar o pagador e a forma de pagamento antes de marcar como pago. Edite a transação.",
            });
            return;
        }
        if (transaction.debtId) {
            setDebts(prevDebts => prevDebts.map(debt => 
                debt.id === transaction.debtId
                ? { ...debt, amountPaid: debt.amountPaid + transaction.totalAmount }
                : debt
            ));
        }
    } else {
        if (transaction.debtId) {
            setDebts(prevDebts => prevDebts.map(debt => 
                debt.id === transaction.debtId
                ? { ...debt, amountPaid: debt.amountPaid - transaction.totalAmount }
                : debt
            ));
        }
    }
    
    setTransactions(prev =>
      prev.map(t => {
        if (t.description === transaction.description && isSameDay(t.date, transaction.date)) {
          return { ...t, paid: isMarkingAsPaid };
        }
        return t;
      })
    );
  };


  const handleDeleteClick = (transactionToDelete: GroupedTransaction) => {
    const installmentRegex = /\s\((\d+)\/(\d+)\)$/;
    const isInstallmentOrRecurring = installmentRegex.test(transactionToDelete.description);

    if (isInstallmentOrRecurring) {
        setTransactionToDelete(transactionToDelete);
    } else {
        executeDelete(transactionToDelete);
    }
  };

  const executeDelete = (transactionToDelete: GroupedTransaction, deleteAllFuture: boolean = false) => {
    let amountToReturn = transactionToDelete.totalAmount;
    let transactionsToKeep = [...transactions];
    const installmentRegex = /\s\((\d+)\/(\d+)\)$/;

    if (deleteAllFuture) {
        const match = transactionToDelete.description.match(installmentRegex);
        if (match) {
            const baseDescription = transactionToDelete.description.replace(installmentRegex, '').trim();
            const currentInstallment = parseInt(match[1], 10);
            
            const futureTransactions = transactions.filter(t => {
                const tMatch = t.description.match(installmentRegex);
                if (tMatch) {
                    const tBaseDescription = t.description.replace(installmentRegex, '').trim();
                    const tInstallment = parseInt(tMatch[1], 10);
                    return tBaseDescription === baseDescription && tInstallment >= currentInstallment;
                }
                return false;
            });

            amountToReturn = futureTransactions.reduce((acc, t) => acc + t.amount, 0);

            const futureTransactionIds = new Set(futureTransactions.map(t => t.id));
            transactionsToKeep = transactions.filter(t => !futureTransactionIds.has(t.id));
        } else {
             // It's a recurring transaction, not an installment one.
             transactionsToKeep = transactions.filter(t => 
                !(t.description === transactionToDelete.description && t.date >= transactionToDelete.date)
            );
             amountToReturn = transactions.filter(t => 
                t.description === transactionToDelete.description && t.date >= transactionToDelete.date
            ).reduce((acc, t) => acc + t.amount, 0);
        }

    } else {
        transactionsToKeep = transactions.filter(t => 
            !(t.description === transactionToDelete.description && isSameDay(t.date, transactionToDelete.date))
        );
    }

    if (transactionToDelete.type === 'expense') {
        const isBenefitCardPayment = benefitCards.some(card => card.name === transactionToDelete.paymentMethod);
        const isCreditCardPayment = creditCards.some(card => card.name === transactionToDelete.paymentMethod);
        
        if (isBenefitCardPayment) {
            setBenefitCards(prevCards =>
                prevCards.map(card =>
                    card.name === transactionToDelete.paymentMethod
                        ? { ...card, balance: card.balance + amountToReturn }
                        : card
                )
            );
        } else if (isCreditCardPayment) {
            setCreditCards(prevCards =>
                prevCards.map(card =>
                    card.name === transactionToDelete.paymentMethod
                        ? { ...card, balance: card.balance - amountToReturn }
                        : card
                )
            );
        }
    }

    setTransactions(transactionsToKeep);
    setTransactionToDelete(null);
  };

  const handleConfirmRecharge = () => {
    if (!cardToRecharge) return;

    const originalBalance = cardToRecharge.balance;
    const { id: cardId, monthlyCredit } = cardToRecharge;
    
    // Check if recharge has already happened this month
    const lastRechargeRecord = localStorage.getItem(`recharge_${cardId}`);
    const currentMonthYear = format(new Date(), 'yyyy-MM');
    if (lastRechargeRecord === currentMonthYear) {
         toast({
            variant: "destructive",
            title: "Recarga já realizada",
            description: `A recarga para ${cardToRecharge.name} já foi feita este mês.`
        });
        setCardToRecharge(null);
        return;
    }

    setBenefitCards(prevCards =>
        prevCards.map(card => 
            card.id === cardId 
                ? { ...card, balance: card.balance + monthlyCredit }
                : card
        )
    );
    
    localStorage.setItem(`recharge_${cardId}`, currentMonthYear);

    const handleUndo = () => {
      setBenefitCards(prevCards =>
          prevCards.map(card => 
              card.id === cardId ? { ...card, balance: originalBalance } : card
          )
      );
      localStorage.removeItem(`recharge_${cardId}`);
      toast({
        title: "Recarga desfeita!",
        description: `O saldo do cartão ${cardToRecharge.name} foi restaurado.`
      });
    };

    toast({
      title: "Cartão Recarregado!",
      description: `O saldo do cartão ${cardToRecharge.name} foi atualizado.`,
      action: <Button variant="secondary" size="sm" onClick={handleUndo}>Desfazer</Button>
    });
    setCardToRecharge(null);
  };
  
  const handlePayCreditCard = () => {
      if (!cardToPay || paymentDetails.payers.length === 0 || !paymentDetails.method) {
          toast({
              variant: "destructive",
              title: "Erro",
              description: "Por favor, selecione pagador(es) e uma forma de pagamento.",
          });
          return;
      }

      const newTransactions: Transaction[] = [];
      const amountPerPayer = cardToPay.balance / paymentDetails.payers.length;

      paymentDetails.payers.forEach(payer => {
        newTransactions.push({
            id: `t${Date.now()}-payment-${payer}`,
            date: new Date(),
            description: `Pagamento Fatura - ${cardToPay.name}`,
            amount: amountPerPayer,
            type: 'expense',
            category: 'Pagamentos',
            subcategory: 'Fatura Cartão',
            payer: payer,
            paymentMethod: paymentDetails.method,
            paid: true,
            isFixed: true,
        });
      });

      setTransactions(prev => [...prev, ...newTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()));

      // Reset card balance
      setCreditCards(prev =>
          prev.map(c => (c.id === cardToPay.id ? { ...c, balance: 0 } : c))
      );

      toast({
          title: "Fatura Paga!",
          description: `A fatura do cartão ${cardToPay.name} foi paga com sucesso.`,
      });

      setCardToPay(null);
      setPaymentDetails({ payers: [], method: '' });
  };
  
  const selectedCategory = categories.find(c => c.name === transactionData.category);
  const selectedFilterCategory = categories.find(c => c.name === filterCategory);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const clearFilters = () => {
    setFilterCategory('');
    setFilterSubcategory('');
    setFilterPaymentMethod('');
    setFilterPayer('');
  }

  const filteredTransactions = transactions.filter(t => {
    const sameMonth = isSameMonth(t.date, currentMonth);
    const categoryMatch = !filterCategory || t.category === filterCategory;
    const subcategoryMatch = !filterSubcategory || t.subcategory === filterSubcategory;
    const paymentMethodMatch = !filterPaymentMethod || t.paymentMethod === filterPaymentMethod;
    const payerMatch = !filterPayer || t.payer === filterPayer;

    return sameMonth && categoryMatch && subcategoryMatch && paymentMethodMatch && payerMatch;
  });

  const groupedTransactions = Object.values(
    filteredTransactions.reduce((acc, t) => {
      const key = `${t.description}-${t.date.toISOString().split('T')[0]}`;
      if (!acc[key]) {
        acc[key] = {
          ...t,
          payers: [t.payer],
          totalAmount: t.amount,
          individualAmount: t.amount,
        };
      } else {
        acc[key].payers.push(t.payer);
        acc[key].totalAmount += t.amount;
      }
      return acc;
    }, {} as Record<string, GroupedTransaction>)
  );

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleGenerateReport = () => {
    if (groupedTransactions.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma transação",
        description: "Não há transações para gerar um relatório com os filtros atuais.",
      });
      return;
    }

    const header = `Relatório de Transações - ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}`;
    
    const rows = groupedTransactions
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(t => {
        const typeSymbol = t.type === 'income' ? '[+]' : '[-]';
        const categoryInfo = t.subcategory ? `${t.category} / ${t.subcategory}` : t.category;
        const payersString = t.payers.join(', ');
        return `${typeSymbol} ${format(t.date, 'dd/MM/yyyy')} - ${t.description} (${categoryInfo}) - ${payersString}: ${formatCurrency(t.totalAmount)}`;
      });
    
    const summary = [
      '',
      '--- Resumo do Período ---',
      `Receitas: ${formatCurrency(totalIncome)}`,
      `Despesas: ${formatCurrency(totalExpenses)}`,
      `Saldo: ${formatCurrency(totalIncome - totalExpenses)}`
    ].join('\n');

    const textToCopy = [header, '', ...rows, summary].join('\n');

    setReport(textToCopy);
    setShowReportDialog(true);
  };
  
  const handleCopyToClipboard = () => {
      navigator.clipboard.writeText(report).then(() => {
          toast({
              title: "Copiado!",
              description: "O relatório foi copiado para a área de transferência."
          });
          setShowReportDialog(false);
      });
  };

    const parseOfx = (ofxContent: string) => {
        const transactions = [];
        const transactionBlocks = ofxContent.split('<STMTTRN>');
        transactionBlocks.shift(); // Remove the header part

        for (const block of transactionBlocks) {
            const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
            const amountMatch = block.match(/<TRNAMT>(-?[\d.]+)/);
            const memoMatch = block.match(/<MEMO>(.+)/);

            if (dateMatch && amountMatch && memoMatch) {
                // Ignore credit card payments
                if (memoMatch[1].toUpperCase().includes('PAGAMENTO') || memoMatch[1].toUpperCase().includes('PAYMENT')) {
                    continue;
                }
                
                transactions.push({
                    date: parse(dateMatch[1], 'yyyyMMdd', new Date()),
                    amount: Math.abs(parseFloat(amountMatch[1])), // Amount is negative for expenses
                    description: memoMatch[1].split('</')[0].trim(), // Clean up memo
                });
            }
        }
        return transactions;
    };
  
  const handleImportStatement = async () => {
    if (!cardToImport || !statementFile) return;
    setIsImporting(true);

    try {
        let parsedTransactions: { date: Date; amount: number; description: string; }[] = [];

        const text = await statementFile.text();
        parsedTransactions = parseOfx(text);
        processImportedTransactions(parsedTransactions);

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro na Importação",
            description: "Não foi possível processar a fatura. Verifique o arquivo e tente novamente."
        });
        setIsImporting(false);
    }
  };
  
  const processImportedTransactions = (parsedTransactions: { date: Date; amount: number; description: string }[]) => {
      if (!cardToImport) return;

      if (parsedTransactions.length === 0) {
            toast({
              variant: "destructive",
              title: "Nenhuma transação encontrada",
              description: "Não foi possível encontrar transações no arquivo. Verifique o conteúdo."
          });
          setIsImporting(false);
          return;
      }
      
      const allNewTransactions: Transaction[] = [];
      
      parsedTransactions.forEach(t => {
          const installmentRegex = /(.+?)\s*-\s*(\d+)\/(\d+)/;
          const match = t.description.match(installmentRegex);

          if (match) {
              const [, baseDescription, currentInstallmentStr, totalInstallmentsStr] = match;
              const currentInstallment = parseInt(currentInstallmentStr, 10);
              const totalInstallments = parseInt(totalInstallmentsStr, 10);
              const amountPerInstallment = t.amount;

              for (let i = 0; i < totalInstallments; i++) {
                  const installmentNumber = i + 1;
                  const transactionDate = addMonths(t.date, i - (currentInstallment - 1));
                  
                  allNewTransactions.push({
                      id: `t${Date.now()}-${Math.random()}-${i}`,
                      date: transactionDate,
                      description: `${baseDescription.trim()} (${installmentNumber}/${totalInstallments})`,
                      amount: amountPerInstallment,
                      type: 'expense',
                      category: 'Pagamentos',
                      subcategory: 'Fatura Cartão',
                      payer: justPayers[0]?.name || 'Pessoa 1',
                      paymentMethod: cardToImport.name,
                      paid: true,
                      isFixed: true,
                  });
              }

          } else {
                allNewTransactions.push({
                  id: `t${Date.now()}-${Math.random()}`,
                  date: t.date,
                  description: t.description,
                  amount: t.amount,
                  type: 'expense',
                  category: 'Pagamentos',
                  subcategory: 'Fatura Cartão',
                  payer: justPayers[0]?.name || 'Pessoa 1',
                  paymentMethod: cardToImport.name,
                  paid: true,
              });
          }
      });

      const totalImportedAmount = allNewTransactions.reduce((acc, t) => acc + t.amount, 0);

      setTransactions(prev => [...prev, ...allNewTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()));

      setCreditCards(prev => prev.map(c => 
          c.id === cardToImport!.id 
              ? { ...c, balance: c.balance + totalImportedAmount } 
              : c
      ));

      toast({
          title: "Fatura Importada!",
          description: `${allNewTransactions.length} transações foram adicionadas.`
      });

      setCardToImport(null);
      setStatementFile(null);
      setIsImporting(false);
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setStatementFile(file);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-bold">Transações</CardTitle>
                <CardDescription>
                  Acompanhe suas movimentações financeiras.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-32 text-center capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerateReport}>
                  <MessageSquareShare className="mr-2" /> Gerar Relatório
                </Button>
                <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setOpen(isOpen); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => handleOpenDialog()}>
                      <PlusCircle className="mr-2" /> Nova Transação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle>
                      <DialogDescription>
                        {editingTransaction ? 'Modifique os detalhes da sua transação.' : 'Preencha os detalhes da sua nova transação aqui.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descrição</Label>
                        <Input id="description" name="description" value={transactionData.description} onChange={handleInputChange} className="col-span-3" />
                      </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-4 items-center gap-4 col-span-1">
                          <Label htmlFor="amount" className="text-right col-span-1">Valor</Label>
                          <Input id="amount" name="amount" type="number" value={transactionAmount || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                          <div className="grid grid-cols-4 items-center gap-4 col-span-1">
                          <Label htmlFor="date" className="text-right col-span-1">Data</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !transactionData.date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {transactionData.date ? format(transactionData.date, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={transactionData.date}
                                onSelect={handleDateChange}
                                initialFocus
                                />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Tipo</Label>
                        <Select onValueChange={(value) => handleSelectChange('type', value)} value={transactionData.type}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="income">Receita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentMethod" className="text-right">Forma Pgto.</Label>
                        <Select onValueChange={(value) => handleSelectChange('paymentMethod', value)} value={transactionData.paymentMethod}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                                {combinedPaymentMethods.map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Categoria</Label>
                        <Select onValueChange={(value) => { handleSelectChange('category', value); handleSelectChange('subcategory', ''); }} value={transactionData.category}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </div>
                      {selectedCategory && selectedCategory.subcategories.length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subcategory" className="text-right">Subcategoria</Label>
                              <Select onValueChange={(value) => handleSelectChange('subcategory', value)} value={transactionData.subcategory}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione a subcategoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedCategory.subcategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                      )}
                      {transactionData.category === 'Pagamentos' && transactionData.subcategory === 'Parcela Financiamento' && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="debtId" className="text-right">Dívida Assoc.</Label>
                              <Select onValueChange={(value) => handleSelectChange('debtId', value)} value={transactionData.debtId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione a dívida" />
                                </SelectTrigger>
                                <SelectContent>
                                    {debts.map(debt => <SelectItem key={debt.id} value={debt.id}>{debt.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Pagadores</Label>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                          {justPayers.map(payer => {
                            const isSelected = selectedPayers.includes(payer.name);
                            return (
                              <div key={payer.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`payer-${payer.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPayers([...selectedPayers, payer.name]);
                                    } else {
                                      setSelectedPayers(selectedPayers.filter(p => p !== payer.name));
                                    }
                                  }}
                                />
                                <Label htmlFor={`payer-${payer.id}`} className="font-normal">{payer.name}</Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Opções</Label>
                          <div className="col-span-3 flex items-center gap-4">
                              <div className="flex items-center space-x-2">
                                  <Checkbox id="isFixed" name="isFixed" checked={transactionData.isFixed} onCheckedChange={(checked) => handleSelectChange('isFixed', !!checked)} />
                                  <Label htmlFor="isFixed" className="font-normal">Despesa Fixa</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Checkbox id="paid" name="paid" checked={transactionData.paid} onCheckedChange={(checked) => handleSelectChange('paid', !!checked)} />
                                  <Label htmlFor="paid" className="font-normal">Pago</Label>
                              </div>
                          </div>
                      </div>
                      {!editingTransaction && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Recorrência</Label>
                            <div className="col-span-3">
                              <RadioGroup defaultValue="single" onValueChange={setRecurrenceType} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="r1" />
                                    <Label htmlFor="r1">Única</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="recurring" id="r2" />
                                    <Label htmlFor="r2">Recorrente</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="installment" id="r3" />
                                    <Label htmlFor="r3">Parcelada</Label>
                                </div>
                              </RadioGroup>
                            </div>
                        </div>
                      )}
                      {recurrenceType === 'installment' && !editingTransaction && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="installments" className="text-right">Nº Parcelas</Label>
                            <Input id="installments" name="installments" type="number" value={installments} onChange={handleInputChange} className="col-span-3" min="1" />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleSaveTransaction}>{editingTransaction ? 'Salvar Alterações': 'Adicionar Transação'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Receita Mensal</CardTitle>
                  <ArrowUpCircle className="h-8 w-8 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Despesa Mensal</CardTitle>
                  <ArrowDownCircle className="h-8 w-8 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
                </CardContent>
              </Card>
        </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full mb-4">
            <AccordionItem value="filters">
              <AccordionTrigger>
                <div className='flex items-center gap-2 text-sm'>
                  <Filter className="h-4 w-4" />
                  Filtros
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 items-center">
                    <Select value={filterCategory} onValueChange={value => { setFilterCategory(value); setFilterSubcategory(''); }}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por Categoria" /></SelectTrigger>
                        <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterSubcategory} onValueChange={setFilterSubcategory} disabled={!filterCategory || !selectedFilterCategory?.subcategories.length}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por Subcategoria" /></SelectTrigger>
                        <SelectContent>
                            {selectedFilterCategory?.subcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por Forma de Pgto." /></SelectTrigger>
                        <SelectContent>
                            {combinedPaymentMethods.map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterPayer} onValueChange={setFilterPayer}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por Pagador" /></SelectTrigger>
                        <SelectContent>
                            {justPayers.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="secondary" onClick={clearFilters} className="lg:col-start-3">
                        <XCircle className="mr-2 h-4 w-4" />
                        Limpar Filtros
                    </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {isMobile ? (
            <div className="space-y-2">
              {groupedTransactions.length > 0 ? (
                groupedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()).map((transaction) => {
                  const isOverdue = transaction.type === 'expense' && !transaction.paid && isBefore(transaction.date, startOfDay(new Date()));
                  return (
                    <Card key={transaction.id} className={cn("p-3", isOverdue ? "bg-destructive/10" : "bg-secondary/50")}>
                        <div className="flex items-start gap-3 w-full">
                           <div className="pt-1">
                                {transaction.type === 'expense' && (
                                    <Checkbox checked={transaction.paid} onCheckedChange={() => handleTogglePaid(transaction)} />
                                )}
                           </div>
                           <div className="flex-1 text-left">
                                <p className={cn("font-medium", isOverdue && 'text-destructive')}>{transaction.description}</p>
                                <p className="text-xs text-muted-foreground">{format(transaction.date, 'dd/MM/yyyy')}</p>
                                
                                <div className="mt-2 text-sm">
                                    <p>{transaction.category}{transaction.subcategory ? ` / ${transaction.subcategory}`: ''}</p>
                                    <p className="text-muted-foreground">{transaction.paymentMethod}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-2">
                                    {transaction.payers.map(payerName => {
                                        const payer = payers.find(p => p.name === payerName);
                                        return payer ? (
                                            <Badge key={payer.id} style={{ backgroundColor: `hsl(${payer.color})` }} className="text-white text-xs">
                                            {payer.name}
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-medium text-lg ${transaction.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                                    {formatCurrency(transaction.totalAmount)}
                                </p>
                                {transaction.payers.length > 1 && (
                                    <p className="text-xs text-muted-foreground font-normal">
                                        {formatCurrency(transaction.individualAmount)} cada
                                    </p>
                                )}
                                <div className="flex mt-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(transaction)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(transaction)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pago</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedTransactions.length > 0 ? (
                  groupedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()).map((transaction) => {
                    const isOverdue = transaction.type === 'expense' && !transaction.paid && isBefore(transaction.date, startOfDay(new Date()));
                    return (
                      <TableRow key={transaction.id} className={cn(
                        transaction.paid && 'bg-secondary/50',
                        isOverdue && 'bg-destructive/10 hover:bg-destructive/20'
                      )}>
                        <TableCell>
                          {transaction.type === 'expense' && (
                            <Checkbox checked={transaction.paid} onCheckedChange={() => handleTogglePaid(transaction)} />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.type === 'income' ? <ArrowUpCircle className="h-5 w-5 text-accent" /> : <ArrowDownCircle className="h-5 w-5 text-destructive" />}
                            <div>
                              <div className={cn("font-medium flex items-center gap-2", isOverdue && 'text-destructive')}>
                                  {transaction.description}
                                  {transaction.isFixed &&
                                      <TooltipProvider>
                                          <Tooltip>
                                              <TooltipTrigger>
                                                  <Pin className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>Despesa Fixa</p>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                  }
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.category}
                                {transaction.subcategory ? ` / ${transaction.subcategory}`: ''}
                                <span className="mx-1">·</span>
                                {transaction.paymentMethod}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {transaction.payers.map(payerName => {
                              const payer = payers.find(p => p.name === payerName);
                              return payer ? (
                                <Badge key={payer.id} style={{ backgroundColor: `hsl(${payer.color})` }} className="text-white">
                                  {payer.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                          {formatCurrency(transaction.totalAmount)}
                            {transaction.payers.length > 1 && (
                                <div className="text-xs text-muted-foreground font-normal">
                                    {formatCurrency(transaction.individualAmount)} cada
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleOpenDialog(transaction)}>
                                <Pencil className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteClick(transaction)}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Nenhuma transação encontrada para este mês ou filtro.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5"/> Cartões Benefício</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {benefitCards.map(card => (
            <div key={card.id}>
              <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 mb-1">
                <span className="font-medium">{card.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(card.balance)} / {formatCurrency(card.monthlyCredit)}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCardToRecharge(card)}>
                          <RefreshCw className="h-3 w-3 text-accent" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Recarregar cartão</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Progress value={(card.balance / card.monthlyCredit) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCardIcon className="w-5 h-5"/> Cartões de Crédito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {creditCards.map(card => (
            <div key={card.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
                    <span className="font-medium">{card.name}</span>
                     <span className="text-sm text-muted-foreground">
                        {formatCurrency(card.balance)} / {formatCurrency(card.limit)}
                    </span>
                </div>
                <Progress value={(card.balance / card.limit) * 100} className="[&>div]:bg-destructive" />
                <div className="flex flex-wrap justify-end items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCardToImport(card)}>
                                    <Upload className="h-4 w-4 text-primary" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Importar Fatura (OFX)</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant="outline" size="sm" className="h-7" onClick={() => setCardToPay(card)} disabled={card.balance <= 0}>
                                        Pagar Fatura
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Pagar Fatura</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PiggyBankIcon className="w-5 h-5" /> Caixinhas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {piggyBanks.map(piggy => (
            <div key={piggy.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{piggy.name}</span>
                  <span className="text-sm text-muted-foreground">
                  {formatCurrency(piggy.currentAmount)} / {formatCurrency(piggy.goal)}
                </span>
              </div>
              <Progress value={(piggy.currentAmount / piggy.goal) * 100} className="[&>div]:bg-accent" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta é uma transação parcelada ou recorrente. Deseja excluir apenas esta ocorrência ou esta e todas as futuras?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => transactionToDelete && executeDelete(transactionToDelete, false)}>Excluir Somente Esta</AlertDialogAction>
                <AlertDialogAction onClick={() => transactionToDelete && executeDelete(transactionToDelete, true)}>
                    Excluir Todas as Futuras
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Relatório de Transações</AlertDialogTitle>
                <AlertDialogDescription>
                    Abaixo está o relatório das transações filtradas. Copie o texto para compartilhar.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea value={report} readOnly rows={10} className="bg-muted"/>
            <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
                <Button onClick={handleCopyToClipboard}>Copiar Relatório</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!cardToPay} onOpenChange={() => setCardToPay(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Pagar Fatura do Cartão</AlertDialogTitle>
                <AlertDialogDescription>
                    Confirme o pagamento da fatura do cartão <strong>{cardToPay?.name}</strong> no valor de <strong>{formatCurrency(cardToPay?.balance || 0)}</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Pagadores</Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                        {justPayers.map(payer => (
                            <div key={`payer-cc-${payer.id}`} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`payer-cc-${payer.id}`}
                                    checked={paymentDetails.payers.includes(payer.name)}
                                    onCheckedChange={(checked) => {
                                        setPaymentDetails(prev => {
                                            if (checked) {
                                                return { ...prev, payers: [...prev.payers, payer.name] };
                                            } else {
                                                return { ...prev, payers: prev.payers.filter(p => p !== payer.name) };
                                            }
                                        });
                                    }}
                                />
                                <Label htmlFor={`payer-cc-${payer.id}`} className="font-normal">{payer.name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentMethod" className="text-right">Forma Pgto.</Label>
                      <Select onValueChange={(value) => setPaymentDetails(p => ({ ...p, method: value }))}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {nonCreditCardPaymentMethods.map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCardToPay(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePayCreditCard}>
                    Confirmar Pagamento
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cardToRecharge} onOpenChange={() => setCardToRecharge(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Recarga</AlertDialogTitle>
                <AlertDialogDescription>
                    Deseja mesmo adicionar {formatCurrency(cardToRecharge?.monthlyCredit || 0)} ao saldo do cartão {cardToRecharge?.name}?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmRecharge}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Transação Duplicada?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Já existe uma transação com a mesma data, descrição e valor. Deseja adicionar mesmo assim?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        setShowDuplicateWarning(false);
                        proceedToSaveTransaction();
                    }}>
                        Adicionar Mesmo Assim
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      {/* Import Statement Dialog */}
      <Dialog open={!!cardToImport} onOpenChange={(isOpen) => { if (!isOpen) { setCardToImport(null); setStatementFile(null); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Fatura - {cardToImport?.name}</DialogTitle>
            <DialogDescription>
              Carregue um arquivo OFX da sua fatura. O sistema irá analisar e criar as transações para você.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".ofx"
                onChange={handleFileChange}
              />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2" /> Selecionar arquivo (OFX)
            </Button>
            {statementFile && (
                <div className="text-sm text-center text-muted-foreground">
                    Arquivo selecionado: {statementFile.name}
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCardToImport(null); setStatementFile(null); }}>Cancelar</Button>
            <Button onClick={handleImportStatement} disabled={isImporting || !statementFile}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar e Lançar Despesas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
