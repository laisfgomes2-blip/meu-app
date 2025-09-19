
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Users, LayoutGrid, CreditCard as CreditCardIcon, Pencil, Check, Wallet, Landmark, PiggyBank as PiggyBankIcon, ShoppingCart, FileText, History, LineChart as LineChartIcon, X, FolderKanban } from 'lucide-react';
import { Payer, Category, BenefitCard, CreditCard, PaymentMethod, PiggyBank, Product, RecurringList, Debt, Transaction, ProductCategory } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  payers: Payer[];
  setPayers: React.Dispatch<React.SetStateAction<Payer[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  benefitCards: BenefitCard[];
  setBenefitCards: React.Dispatch<React.SetStateAction<BenefitCard[]>>;
  creditCards: CreditCard[];
  setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  piggyBanks: PiggyBank[];
  setPiggyBanks: React.Dispatch<React.SetStateAction<PiggyBank[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productCategories: ProductCategory[];
  setProductCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;
  recurringLists: RecurringList[];
  setRecurringLists: React.Dispatch<React.SetStateAction<RecurringList[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  updatePayerName: (oldName: string, newName: string) => void;
  updateBenefitCardName: (oldName: string, newName: string) => void;
  updateCreditCardName: (oldName: string, newName: string) => void;
}

interface NewDebtData extends Omit<Debt, 'id'> {
  payers: string[];
  paymentMethod: string;
}

export default function SettingsTab({ 
  payers, setPayers, 
  categories, setCategories, 
  benefitCards, setBenefitCards,
  creditCards, setCreditCards, 
  paymentMethods, setPaymentMethods,
  piggyBanks, setPiggyBanks,
  products, setProducts,
  productCategories, setProductCategories,
  recurringLists, setRecurringLists,
  debts, setDebts,
  transactions, setTransactions,
  updatePayerName, updateBenefitCardName, updateCreditCardName
}: SettingsTabProps) {
  const { toast } = useToast();
  // Payer state
  const [editingPayerId, setEditingPayerId] = useState<string | null>(null);
  const [editingPayerName, setEditingPayerName] = useState('');
  const [editingPayerIsPayer, setEditingPayerIsPayer] = useState(true);
  const [newPayerName, setNewPayerName] = useState('');
  const [newPayerIsPayer, setNewPayerIsPayer] = useState(true);

  // Category state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategory, setNewSubcategory] = useState<{ categoryId: string, value: string }>({ categoryId: '', value: '' });

  // Payment Method state
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null);
  const [editingPaymentMethodName, setEditingPaymentMethodName] = useState('');
  const [newPaymentMethodName, setNewPaymentMethodName] = useState('');

  // Benefit Card state
  const [editingBenefitCardId, setEditingBenefitCardId] = useState<string | null>(null);
  const [editingBenefitCardData, setEditingBenefitCardData] = useState<{ name: string; monthlyCredit: string }>({ name: '', monthlyCredit: '' });
  const [newBenefitCardData, setNewBenefitCardData] = useState<{ name: string; monthlyCredit: string }>({ name: '', monthlyCredit: '' });
  
  // Credit Card state
  const [editingCreditCardId, setEditingCreditCardId] = useState<string | null>(null);
  const [editingCreditCardData, setEditingCreditCardData] = useState<{ name: string; limit: string }>({ name: '', limit: '' });
  const [newCreditCardData, setNewCreditCardData] = useState<{ name: string; limit: string }>({ name: '', limit: '' });
  
  // Piggy Bank state
  const [editingPiggyBankId, setEditingPiggyBankId] = useState<string | null>(null);
  const [editingPiggyBankData, setEditingPiggyBankData] = useState<{ name: string; goal: string }>({ name: '', goal: '' });
  
  // Product state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductData, setEditingProductData] = useState<{ name: string; categoryId: string | undefined }>({ name: '', categoryId: undefined });
  const [newProductData, setNewProductData] = useState<{ name: string; categoryId: string | undefined }>({ name: '', categoryId: undefined });
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Product Category state
  const [newProductCategoryName, setNewProductCategoryName] = useState('');
  const [editingProductCategoryId, setEditingProductCategoryId] = useState<string | null>(null);
  const [editingProductCategoryName, setEditingProductCategoryName] = useState('');

  // Debt state
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editingDebtData, setEditingDebtData] = useState<Omit<Debt, 'id'>>({ name: '', totalAmount: 0, amountPaid: 0, monthlyPayment: 0, interestRate: 0 });
  const [newDebtData, setNewDebtData] = useState<NewDebtData>({ name: '', totalAmount: 0, amountPaid: 0, monthlyPayment: 0, interestRate: 0, payers: [], paymentMethod: '' });
  
  // Product History state
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyFilterPayer, setHistoryFilterPayer] = useState<string>('all');

  const justPayers = useMemo(() => payers.filter(p => p.isPayer), [payers]);

  const combinedPaymentMethods = [
    ...paymentMethods,
    ...benefitCards.map(card => ({ id: card.id, name: card.name, type: 'Benefício' })),
    ...creditCards.map(card => ({ id: card.id, name: card.name, type: 'Crédito' }))
  ];
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Payer handlers
  const handleEditPayer = (payer: Payer) => {
    setEditingPayerId(payer.id);
    setEditingPayerName(payer.name);
    setEditingPayerIsPayer(payer.isPayer);
  };

  const handleSavePayer = (id: string) => {
    const originalPayer = payers.find(p => p.id === id);
    if (originalPayer && originalPayer.name !== editingPayerName) {
      updatePayerName(originalPayer.name, editingPayerName);
    }
    setPayers(payers.map(p => p.id === id ? { ...p, name: editingPayerName, isPayer: editingPayerIsPayer } : p));
    setEditingPayerId(null);
    setEditingPayerName('');
  };

  const handleAddPayer = () => {
    if (newPayerName.trim()) {
      const newPayer: Payer = {
        id: `p${Date.now()}`,
        name: newPayerName.trim(),
        color: `${Math.floor(Math.random() * 360)} 60% 50%`,
        isPayer: newPayerIsPayer,
      };
      setPayers([...payers, newPayer]);
      setNewPayerName('');
      setNewPayerIsPayer(true);
    }
  };

  const handleDeletePayer = (id: string) => {
    setPayers(payers.filter(p => p.id !== id));
  };

  // Category handlers
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
        const newCategory: Category = {
            id: `c${Date.now()}`,
            name: newCategoryName.trim(),
            subcategories: [],
        };
        setCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddSubcategory = (categoryId: string) => {
      if (newSubcategory.value.trim()) {
          setCategories(prev => prev.map(c => 
              c.id === categoryId 
                  ? { ...c, subcategories: [...c.subcategories, newSubcategory.value.trim()] }
                  : c
          ));
          setNewSubcategory({ categoryId: '', value: '' });
      }
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryName: string) => {
      setCategories(prev => prev.map(c => 
          c.id === categoryId 
              ? { ...c, subcategories: c.subcategories.filter(s => s !== subcategoryName) }
              : c
      ));
  };

  // Payment Method handlers
  const handleEditPaymentMethod = (pm: PaymentMethod) => {
      setEditingPaymentMethodId(pm.id);
      setEditingPaymentMethodName(pm.name);
  };

  const handleSavePaymentMethod = (id: string) => {
      if (editingPaymentMethodName.trim()) {
          setPaymentMethods(prev => prev.map(pm => pm.id === id ? { ...pm, name: editingPaymentMethodName.trim() } : pm));
          setEditingPaymentMethodId(null);
          setEditingPaymentMethodName('');
      }
  };
  
  const handleAddPaymentMethod = () => {
    if (newPaymentMethodName.trim()) {
        const newMethod: PaymentMethod = {
            id: `pm${Date.now()}`,
            name: newPaymentMethodName.trim(),
        };
        setPaymentMethods(prev => [...prev, newMethod]);
        setNewPaymentMethodName('');
    }
  };

  const handleDeletePaymentMethod = (id: string) => {
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  };

  // Benefit Card handlers
  const handleEditBenefitCard = (card: BenefitCard) => {
    setEditingBenefitCardId(card.id);
    setEditingBenefitCardData({ name: card.name, monthlyCredit: String(card.monthlyCredit) });
  };

  const handleSaveBenefitCard = (id: string) => {
    if (editingBenefitCardData.name.trim() && parseFloat(editingBenefitCardData.monthlyCredit) > 0) {
      const originalCard = benefitCards.find(c => c.id === id);
      if (originalCard && originalCard.name !== editingBenefitCardData.name) {
        updateBenefitCardName(originalCard.name, editingBenefitCardData.name);
      }
      setBenefitCards(benefitCards.map(c => c.id === id ? { ...c, name: editingBenefitCardData.name, monthlyCredit: parseFloat(editingBenefitCardData.monthlyCredit) } : c));
      setEditingBenefitCardId(null);
      setEditingBenefitCardData({ name: '', monthlyCredit: '' });
    }
  };

  const handleAddBenefitCard = () => {
    if (newBenefitCardData.name.trim() && parseFloat(newBenefitCardData.monthlyCredit) > 0) {
      const newCard: BenefitCard = {
        id: `bc${Date.now()}`,
        name: newBenefitCardData.name.trim(),
        monthlyCredit: parseFloat(newBenefitCardData.monthlyCredit),
        balance: 0,
      };
      setBenefitCards([...benefitCards, newCard]);
      setNewBenefitCardData({ name: '', monthlyCredit: '' });
    }
  };

  const handleDeleteBenefitCard = (id: string) => {
    setBenefitCards(benefitCards.filter(c => c.id !== id));
  };
  
  // Credit Card handlers
  const handleEditCreditCard = (card: CreditCard) => {
    setEditingCreditCardId(card.id);
    setEditingCreditCardData({ name: card.name, limit: String(card.limit) });
  };

  const handleSaveCreditCard = (id: string) => {
    if (editingCreditCardData.name.trim() && parseFloat(editingCreditCardData.limit) > 0) {
      const originalCard = creditCards.find(c => c.id === id);
      if (originalCard && originalCard.name !== editingCreditCardData.name) {
        updateCreditCardName(originalCard.name, editingCreditCardData.name);
      }
      setCreditCards(creditCards.map(c => c.id === id ? { ...c, name: editingCreditCardData.name, limit: parseFloat(editingCreditCardData.limit) } : c));
      setEditingCreditCardId(null);
      setEditingCreditCardData({ name: '', limit: '' });
    }
  };

  const handleAddCreditCard = () => {
    if (newCreditCardData.name.trim() && parseFloat(newCreditCardData.limit) > 0) {
      const newCard: CreditCard = {
        id: `cc${Date.now()}`,
        name: newCreditCardData.name.trim(),
        limit: parseFloat(newCreditCardData.limit),
        balance: 0,
      };
      setCreditCards([...creditCards, newCard]);
      setNewCreditCardData({ name: '', limit: '' });
    }
  };

  const handleDeleteCreditCard = (id: string) => {
    setCreditCards(creditCards.filter(c => c.id !== id));
  };

  // Piggy Bank handlers
  const handleEditPiggyBank = (piggy: PiggyBank) => {
    setEditingPiggyBankId(piggy.id);
    setEditingPiggyBankData({ name: piggy.name, goal: String(piggy.goal) });
  };

  const handleSavePiggyBank = (id: string) => {
    if (editingPiggyBankData.name.trim() && parseFloat(editingPiggyBankData.goal) > 0) {
      setPiggyBanks(piggyBanks.map(p => p.id === id ? { ...p, name: editingPiggyBankData.name, goal: parseFloat(editingPiggyBankData.goal) } : p));
      setEditingPiggyBankId(null);
      setEditingPiggyBankData({ name: '', goal: '' });
    }
  };

  const handleDeletePiggyBank = (id: string) => {
    setPiggyBanks(piggyBanks.filter(p => p.id !== id));
  };

  // Product handlers
  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditingProductData({ name: product.name, categoryId: product.categoryId });
  };

  const handleSaveProduct = (id: string) => {
    if (editingProductData.name.trim()) {
      setProducts(products.map(p => p.id === id ? { ...p, name: editingProductData.name.trim(), categoryId: editingProductData.categoryId } : p));
      setEditingProductId(null);
      setEditingProductData({ name: '', categoryId: undefined });
    }
  };

  const handleAddProduct = () => {
    if (newProductData.name.trim()) {
      const newProduct: Product = {
        id: `prod${Date.now()}`,
        name: newProductData.name.trim(),
        categoryId: newProductData.categoryId,
      };
      setProducts([...products, newProduct]);
      setNewProductData({ name: '', categoryId: undefined });
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    // Also remove from recurring lists
    setRecurringLists(prevLists => 
      prevLists.map(list => ({
        ...list,
        items: list.items.filter(item => item.productId !== id)
      }))
    );
  };
  
  // Product Category handlers
  const handleAddProductCategory = () => {
    if (newProductCategoryName.trim()) {
      const newCategory: ProductCategory = {
        id: `pc${Date.now()}`,
        name: newProductCategoryName.trim(),
      };
      setProductCategories([...productCategories, newCategory]);
      setNewProductCategoryName('');
    }
  };
  
  const handleEditProductCategory = (category: ProductCategory) => {
    setEditingProductCategoryId(category.id);
    setEditingProductCategoryName(category.name);
  };

  const handleSaveProductCategory = (id: string) => {
    if (editingProductCategoryName.trim()) {
      setProductCategories(productCategories.map(pc => pc.id === id ? { ...pc, name: editingProductCategoryName.trim() } : pc));
      setEditingProductCategoryId(null);
      setEditingProductCategoryName('');
    }
  };

  const handleDeleteProductCategory = (id: string) => {
    setProductCategories(productCategories.filter(pc => pc.id !== id));
    // Also remove category from products
    setProducts(prev => prev.map(p => p.categoryId === id ? { ...p, categoryId: undefined } : p));
  };


  // Debt handlers
  const handleEditDebt = (debt: Debt) => {
    setEditingDebtId(debt.id);
    setEditingDebtData({ ...debt });
  };

  const handleSaveDebt = (id: string) => {
    if (editingDebtData.name.trim() && editingDebtData.totalAmount > 0) {
      setDebts(debts.map(d => d.id === id ? { ...editingDebtData, id } : d));
      setEditingDebtId(null);
      setEditingDebtData({ name: '', totalAmount: 0, amountPaid: 0, monthlyPayment: 0, interestRate: 0 });
    }
  };

  const handleAddDebt = () => {
    if (newDebtData.name.trim() && newDebtData.totalAmount > 0 && newDebtData.monthlyPayment > 0 && newDebtData.payers.length > 0 && newDebtData.paymentMethod) {
      const debtId = `d${Date.now()}`;
      const newDebt: Debt = {
        id: debtId,
        name: newDebtData.name,
        totalAmount: newDebtData.totalAmount,
        amountPaid: newDebtData.amountPaid,
        monthlyPayment: newDebtData.monthlyPayment,
        interestRate: newDebtData.interestRate,
      };
      setDebts([...debts, newDebt]);

      // Create recurring transaction
      const newTransactions: Transaction[] = [];
      const remainingAmount = newDebtData.totalAmount - newDebtData.amountPaid;
      const totalMonths = Math.ceil(remainingAmount / newDebtData.monthlyPayment);
      const amountPerPayer = newDebtData.monthlyPayment / newDebtData.payers.length;

      for (let i = 0; i < totalMonths; i++) {
        const transactionDate = addMonths(new Date(), i);
        newDebtData.payers.forEach(payer => {
            newTransactions.push({
                id: `t${Date.now()}-${payer}-${i}`,
                date: transactionDate,
                description: `${newDebtData.name} (${i + 1}/${totalMonths})`,
                amount: amountPerPayer,
                type: 'expense',
                category: 'Pagamentos',
                subcategory: 'Parcela Financiamento',
                payer: payer,
                paymentMethod: newDebtData.paymentMethod,
                paid: false,
                isFixed: true,
                debtId: debtId,
            });
        });
      }
      setTransactions(prev => [...prev, ...newTransactions].sort((a,b) => b.date.getTime() - a.date.getTime()));

      setNewDebtData({ name: '', totalAmount: 0, amountPaid: 0, monthlyPayment: 0, interestRate: 0, payers: [], paymentMethod: '' });
    }
  };

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
    // Also delete associated transactions
    setTransactions(prev => prev.filter(t => t.debtId !== id));
  };

  // Product History Logic
  const filteredHistoryTransactions = useMemo(() => {
    if (!historyProduct) return [];
    return transactions.filter(t => 
      t.productId === historyProduct.id && 
      (historyFilterPayer === 'all' || t.payer === historyFilterPayer)
    );
  }, [historyProduct, transactions, historyFilterPayer]);

  const chartData = useMemo(() => {
    if (!historyProduct) return [];
    return transactions
      .filter(t => t.productId === historyProduct.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(t => ({
        date: format(t.date, 'MMM/yy', { locale: ptBR }),
        price: t.quantity && t.quantity > 0 ? t.amount / t.quantity : t.amount,
      }));
  }, [historyProduct, transactions]);
  
  const filteredProducts = useMemo(() => {
    if (productCategoryFilter === 'all') {
      return products;
    }
    return products.filter(p => p.categoryId === productCategoryFilter);
  }, [products, productCategoryFilter]);

  return (
    <>
      <Card className="max-w-3xl mx-auto shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Gerencie pessoas, categorias e cartões do seu aplicativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Pessoas */}
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5"/> Pessoas
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {payers.map(payer => (
                  <div key={payer.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    <div className="flex items-center gap-3">
                       <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${payer.color})` }}
                      />
                      {editingPayerId === payer.id ? (
                        <div className="grid grid-cols-1 gap-2 items-center">
                          <Input 
                            value={editingPayerName}
                            onChange={(e) => setEditingPayerName(e.target.value)}
                            className="h-8"
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`edit-isPayer-${payer.id}`} checked={editingPayerIsPayer} onCheckedChange={(checked) => setEditingPayerIsPayer(!!checked)} />
                            <Label htmlFor={`edit-isPayer-${payer.id}`} className="text-sm font-normal">É pagador?</Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span>{payer.name}</span>
                          {!payer.isPayer && <Badge variant="outline" className="ml-2">Não pagador</Badge>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {editingPayerId === payer.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSavePayer(payer.id)}>
                          <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditPayer(payer)}>
                          <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeletePayer(payer.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nova pessoa"
                            value={newPayerName}
                            onChange={(e) => setNewPayerName(e.target.value)}
                        />
                        <Button onClick={handleAddPayer}><Plus /></Button>
                    </div>
                    <div className="flex items-center space-x-2 pl-1">
                        <Checkbox id="new-isPayer" checked={newPayerIsPayer} onCheckedChange={(checked) => setNewPayerIsPayer(!!checked)} />
                        <Label htmlFor="new-isPayer" className="font-normal">É um pagador?</Label>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Categorias */}
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5"/> Categorias
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {categories.map(cat => (
                  <div key={cat.id} className="p-2 bg-secondary rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{cat.name}</span>
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories.map(sub => (
                        <Badge key={sub} variant="outline" className="flex items-center gap-1">
                          {sub}
                          <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="rounded-full hover:bg-destructive/20 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Input 
                            placeholder="Nova subcategoria"
                            value={newSubcategory.categoryId === cat.id ? newSubcategory.value : ''}
                            onChange={(e) => setNewSubcategory({ categoryId: cat.id, value: e.target.value })}
                        />
                        <Button onClick={() => handleAddSubcategory(cat.id)}><Plus /></Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                    <Input 
                        placeholder="Nova categoria principal"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button onClick={handleAddCategory}><Plus /></Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Formas de Pagamento */}
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5"/> Formas de Pagamento
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                      {editingPaymentMethodId === pm.id ? (
                        <Input 
                          value={editingPaymentMethodName}
                          onChange={(e) => setEditingPaymentMethodName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        <span>{pm.name}</span>
                      )}
                    <div className="flex items-center">
                      {editingPaymentMethodId === pm.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSavePaymentMethod(pm.id)}>
                            <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditPaymentMethod(pm)}>
                            <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeletePaymentMethod(pm.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input 
                      placeholder="Nova forma de pagamento"
                      value={newPaymentMethodName}
                      onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  />
                  <Button onClick={handleAddPaymentMethod}><Plus /></Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cartões Benefício */}
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5"/> Cartões Benefício
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {benefitCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                      {editingBenefitCardId === card.id ? (
                        <div className="flex-grow flex flex-col sm:flex-row items-center gap-2">
                            <Input 
                              value={editingBenefitCardData.name}
                              onChange={(e) => setEditingBenefitCardData({...editingBenefitCardData, name: e.target.value})}
                              placeholder="Nome do Cartão"
                              className="mr-2"
                            />
                            <Input 
                              type="number"
                              value={editingBenefitCardData.monthlyCredit}
                              onChange={(e) => setEditingBenefitCardData({...editingBenefitCardData, monthlyCredit: e.target.value})}
                              placeholder="Crédito Mensal"
                              className="w-full sm:w-40"
                            />
                        </div>
                      ) : (
                        <div>
                            <p>{card.name}</p>
                            <p className="text-sm text-muted-foreground">Crédito: {card.monthlyCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                    <div className="flex items-center">
                      {editingBenefitCardId === card.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSaveBenefitCard(card.id)}>
                            <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditBenefitCard(card)}>
                            <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteBenefitCard(card.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Input 
                      placeholder="Nome do cartão" 
                      value={newBenefitCardData.name}
                      onChange={(e) => setNewBenefitCardData({...newBenefitCardData, name: e.target.value})}
                  />
                  <Input 
                      type="number" 
                      placeholder="Crédito Mensal" 
                      value={newBenefitCardData.monthlyCredit}
                      onChange={(e) => setNewBenefitCardData({...newBenefitCardData, monthlyCredit: e.target.value})}
                  />
                  <Button onClick={handleAddBenefitCard}><Plus /></Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cartões de Crédito */}
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5"/> Cartões de Crédito
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {creditCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                      {editingCreditCardId === card.id ? (
                        <div className="flex-grow flex flex-col sm:flex-row items-center gap-2">
                            <Input 
                              value={editingCreditCardData.name}
                              onChange={(e) => setEditingCreditCardData({...editingCreditCardData, name: e.target.value})}
                              placeholder="Nome do Cartão"
                              className="mr-2"
                            />
                            <Input 
                              type="number"
                              value={editingCreditCardData.limit}
                              onChange={(e) => setEditingCreditCardData({...editingCreditCardData, limit: e.target.value})}
                              placeholder="Limite do Cartão"
                              className="w-full sm:w-40"
                            />
                        </div>
                      ) : (
                        <div>
                            <p>{card.name}</p>
                            <p className="text-sm text-muted-foreground">Limite: {card.limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                    <div className="flex items-center">
                      {editingCreditCardId === card.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSaveCreditCard(card.id)}>
                            <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditCreditCard(card)}>
                            <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteCreditCard(card.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Input 
                      placeholder="Nome do cartão" 
                      value={newCreditCardData.name}
                      onChange={(e) => setNewCreditCardData({...newCreditCardData, name: e.target.value})}
                  />
                  <Input 
                      type="number" 
                      placeholder="Limite do Cartão" 
                      value={newCreditCardData.limit}
                      onChange={(e) => setNewCreditCardData({...newCreditCardData, limit: e.target.value})}
                  />
                  <Button onClick={handleAddCreditCard}><Plus /></Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Caixinhas */}
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <PiggyBankIcon className="w-5 h-5"/> Caixinhas
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {piggyBanks.map(piggy => (
                  <div key={piggy.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                      {editingPiggyBankId === piggy.id ? (
                        <div className="flex-grow flex flex-col sm:flex-row items-center gap-2">
                            <Input 
                              value={editingPiggyBankData.name}
                              onChange={(e) => setEditingPiggyBankData({...editingPiggyBankData, name: e.target.value})}
                              placeholder="Nome da Caixinha"
                              className="mr-2"
                            />
                            <Input 
                              type="number"
                              value={editingPiggyBankData.goal}
                              onChange={(e) => setEditingPiggyBankData({...editingPiggyBankData, goal: e.target.value})}
                              placeholder="Objetivo"
                              className="w-full sm:w-40"
                            />
                        </div>
                      ) : (
                        <div>
                            <p>{piggy.name}</p>
                            <p className="text-sm text-muted-foreground">Objetivo: {piggy.goal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      )}
                    <div className="flex items-center">
                      {editingPiggyBankId === piggy.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSavePiggyBank(piggy.id)}>
                            <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditPiggyBank(piggy)}>
                            <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeletePiggyBank(piggy.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            
            {/* Dívidas e Financiamentos */}
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5"/> Dívidas e Financiamentos
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {debts.map(debt => (
                  <div key={debt.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                      {editingDebtId === debt.id ? (
                        <div className="flex-grow grid grid-cols-2 gap-2">
                            <Input 
                              value={editingDebtData.name}
                              onChange={(e) => setEditingDebtData({...editingDebtData, name: e.target.value})}
                              placeholder="Nome da Dívida"
                            />
                            <Input 
                              type="number"
                              value={editingDebtData.totalAmount}
                              onChange={(e) => setEditingDebtData({...editingDebtData, totalAmount: parseFloat(e.target.value)})}
                              placeholder="Valor Total"
                            />
                            <Input 
                              type="number"
                              value={editingDebtData.amountPaid}
                              onChange={(e) => setEditingDebtData({...editingDebtData, amountPaid: parseFloat(e.target.value)})}
                              placeholder="Valor Pago"
                            />
                            <Input 
                              type="number"
                              value={editingDebtData.monthlyPayment}
                              onChange={(e) => setEditingDebtData({...editingDebtData, monthlyPayment: parseFloat(e.target.value)})}
                              placeholder="Parcela Mensal"
                            />
                        </div>
                      ) : (
                        <div>
                            <p>{debt.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {debt.amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {debt.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                      )}
                    <div className="flex items-center">
                      {editingDebtId === debt.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSaveDebt(debt.id)}>
                            <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditDebt(debt)}>
                            <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteDebt(debt.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-1 gap-4 pt-4 border-t mt-4">
                  <h4 className="font-medium">Adicionar Nova Dívida</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input 
                        placeholder="Nome da Dívida" 
                        value={newDebtData.name}
                        onChange={(e) => setNewDebtData({...newDebtData, name: e.target.value})}
                    />
                    <Input 
                        type="number" 
                        placeholder="Valor Total" 
                        value={newDebtData.totalAmount || ''}
                        onChange={(e) => setNewDebtData({...newDebtData, totalAmount: parseFloat(e.target.value)})}
                    />
                    <Input 
                        type="number" 
                        placeholder="Valor Já Pago (Opcional)" 
                        value={newDebtData.amountPaid || ''}
                        onChange={(e) => setNewDebtData({...newDebtData, amountPaid: parseFloat(e.target.value)})}
                    />
                    <Input 
                        type="number" 
                        placeholder="Parcela Mensal" 
                        value={newDebtData.monthlyPayment || ''}
                        onChange={(e) => setNewDebtData({...newDebtData, monthlyPayment: parseFloat(e.target.value)})}
                    />
                    <div className="md:col-span-2">
                      <Label>Pagadores</Label>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                        {justPayers.map(payer => (
                            <div key={payer.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`payer-debt-${payer.id}`}
                                    checked={newDebtData.payers.includes(payer.name)}
                                    onCheckedChange={(checked) => setNewDebtData(prev => ({
                                        ...prev,
                                        payers: checked ? [...prev.payers, payer.name] : prev.payers.filter(p => p !== payer.name)
                                    }))}
                                />
                                <Label htmlFor={`payer-debt-${payer.id}`} className="font-normal">{payer.name}</Label>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="debt-pm">Forma de Pagamento</Label>
                        <Select value={newDebtData.paymentMethod} onValueChange={(value) => setNewDebtData({...newDebtData, paymentMethod: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Forma de Pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {combinedPaymentMethods.map(pm => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddDebt} className="w-full gap-2"><Plus />Adicionar Dívida</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Categorias de Produtos */}
            <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5"/> Categorias de Produtos
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {productCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    {editingProductCategoryId === cat.id ? (
                      <Input 
                        value={editingProductCategoryName}
                        onChange={(e) => setEditingProductCategoryName(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <span>{cat.name}</span>
                    )}
                    <div className="flex items-center">
                      {editingProductCategoryId === cat.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSaveProductCategory(cat.id)}>
                            <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditProductCategory(cat)}>
                            <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteProductCategory(cat.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input 
                    placeholder="Nova categoria de produto"
                    value={newProductCategoryName}
                    onChange={(e) => setNewProductCategoryName(e.target.value)}
                  />
                  <Button onClick={handleAddProductCategory}><Plus /></Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Catálogo de Compras */}
            <AccordionItem value="item-9">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5"/> Catálogo de Compras
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="my-4">
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                      <SelectTrigger>
                          <SelectValue placeholder="Filtrar por categoria" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          {productCategories.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    {editingProductId === product.id ? (
                       <div className="flex-grow flex flex-col sm:flex-row items-center gap-2">
                          <Input 
                            value={editingProductData.name}
                            onChange={(e) => setEditingProductData({...editingProductData, name: e.target.value})}
                            className="mr-2"
                          />
                           <Select value={editingProductData.categoryId} onValueChange={(value) => setEditingProductData({...editingProductData, categoryId: value})}>
                              <SelectTrigger className="w-full sm:w-48">
                                  <SelectValue placeholder="Sem categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                  {productCategories.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                       </div>
                    ) : (
                      <div>
                        <p>{product.name}</p>
                        {product.categoryId && (
                          <Badge variant="outline" className="mt-1">{productCategories.find(pc => pc.id === product.categoryId)?.name}</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setHistoryProduct(product); setHistoryFilterPayer('all'); }}>
                          <History className="h-5 w-5" />
                      </Button>
                      {editingProductId === product.id ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleSaveProduct(product.id)}>
                          <Check className="h-5 w-5 text-accent" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleEditProduct(product)}>
                          <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 bg-secondary" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Input 
                    placeholder="Novo produto"
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                  />
                  <Select value={newProductData.categoryId} onValueChange={(value) => setNewProductData({...newProductData, categoryId: value})}>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                          {productCategories.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Button onClick={handleAddProduct}><Plus /></Button>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
      
      {/* Product History Dialog */}
      <Dialog open={!!historyProduct} onOpenChange={(isOpen) => !isOpen && setHistoryProduct(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Compras: {historyProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><LineChartIcon className="w-5 h-5 text-primary" /> Variação de Preço</h3>
            </div>
             <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover text-popover-foreground p-2 border rounded-md shadow-lg text-sm">
                            <p className="font-bold">{label}</p>
                            <p>Preço/un.: {formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}/>
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} name="Preço"/>
                </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between">
               <h3 className="font-semibold">Histórico de Transações</h3>
                <Select value={historyFilterPayer} onValueChange={setHistoryFilterPayer}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por pagador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Pagadores</SelectItem>
                    {justPayers.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Pagador</TableHead>
                            <TableHead className="text-right">Preço/un.</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistoryTransactions.length > 0 ? filteredHistoryTransactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{t.payer}</TableCell>
                                <TableCell className="text-right">{formatCurrency(t.quantity && t.quantity > 0 ? t.amount / t.quantity : t.amount)}</TableCell>
                            </TableRow>
                        )) : (
                           <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    Nenhuma compra encontrada para este produto.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-2">
                {filteredHistoryTransactions.length > 0 ? filteredHistoryTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-secondary rounded-md">
                      <div>
                        <p>{format(t.date, 'dd/MM/yyyy')}</p>
                        <p className="text-muted-foreground">{t.payer}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(t.quantity && t.quantity > 0 ? t.amount / t.quantity : t.amount)}</p>
                  </div>
                )) : (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhuma compra encontrada.</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
