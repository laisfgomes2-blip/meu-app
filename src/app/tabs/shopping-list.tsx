
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Pencil, Check, ArrowUp, ArrowDown, History, PlusCircle, MessageSquareShare, Send, X, QrCode } from 'lucide-react';
import { ShoppingListItem, Transaction, Category, Payer, PaymentMethod, BenefitCard, CreditCard, Product, unitsOfMeasure, RecurringList, RecurringListItem, ProductCategory, Task } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { processReceipt } from '@/ai/flows/process-receipt-flow';
import { Loader2 } from 'lucide-react';
import jsQR from 'jsqr';

interface ShoppingListTabProps {
  items: ShoppingListItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingListItem[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  payers: Payer[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  benefitCards: BenefitCard[];
  setBenefitCards: React.Dispatch<React.SetStateAction<BenefitCard[]>>;
  creditCards: CreditCard[];
  setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productCategories: ProductCategory[];
  setProductCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;
  recurringLists: RecurringList[];
  setRecurringLists: React.Dispatch<React.SetStateAction<RecurringList[]>>;
  generateShoppingList: (list: RecurringList, taskData?: Omit<Task, 'id' | 'done' | 'lastCompleted'>) => void;
}

const frequencyMap = {
  single: 'Compra Única',
  daily: 'Diária',
  weekly: 'Semanal',
  'bi-weekly': 'Quinzenal',
  monthly: 'Mensal'
};

export default function ShoppingListTab({ 
  items,
  setItems,
  transactions, 
  setTransactions,
  payers,
  categories,
  paymentMethods,
  benefitCards,
  setBenefitCards,
  creditCards,
  setCreditCards,
  products,
  setProducts,
  productCategories,
  setProductCategories,
  recurringLists,
  setRecurringLists,
  generateShoppingList
}: ShoppingListTabProps) {
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('un');
  
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; cost: string; quantity: string; unit: string; originalPricePerUnit: number; } | null>(null);
  const [priceChange, setPriceChange] = useState<{ id: string, diff: number, percent: number } | null>(null);

  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [transactionData, setTransactionData] = useState<Omit<Transaction, 'id' | 'payer' | 'amount'>>({
    description: 'Compras da Lista',
    date: new Date(),
    type: 'expense',
    category: 'Alimentação',
    subcategory: 'Supermercado',
    paymentMethod: '',
  });
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareableList, setShareableList] = useState('');
  const { toast } = useToast();
  
  // Recurring List State
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [editingList, setEditingList] = useState<RecurringList | null>(null);
  const [listData, setListData] = useState<{ name: string; frequency: 'single' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly'; items: RecurringListItem[] }>({
    name: '',
    frequency: 'weekly',
    items: []
  });
  const [listToDelete, setListToDelete] = useState<RecurringList | null>(null);


  // QR Code Scanner State
  const [openScannerDialog, setOpenScannerDialog] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'detected' | 'processing'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanRequestRef = useRef<number>();

  const justPayers = useMemo(() => payers.filter(p => p.isPayer), [payers]);

  // New Product Dialog State
  const [openNewProductDialog, setOpenNewProductDialog] = useState(false);
  const [newProductData, setNewProductData] = useState<{ name: string; categoryId: string | undefined }>({ name: '', categoryId: undefined });

  // Generate List Dialog State
  const [listToGenerate, setListToGenerate] = useState<RecurringList | null>(null);
  const [createTask, setCreateTask] = useState(false);
  const [taskDetails, setTaskDetails] = useState({ assignees: [] as string[], dueDate: undefined as Date | undefined });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const purchasedItems = items.filter(item => item.purchased);
  const totalPurchasedCost = purchasedItems.reduce((acc, item) => acc + item.estimatedCost, 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemProductId) {
      const product = products.find(p => p.id === newItemProductId);
      if (!product) return;

      const cost = parseFloat(newItemCost) || 0;
      const quantity = parseFloat(newItemQty) || 1;

      const newItem: ShoppingListItem = {
        id: `sli${Date.now()}`,
        name: product.name,
        estimatedCost: cost * quantity,
        purchased: false,
        quantity: quantity,
        unit: newItemUnit,
        productId: product.id,
      };
      setItems([...items, newItem]);
      setNewItemProductId('');
      setNewItemCost('');
      setNewItemQty('1');
      setNewItemUnit('un');
    }
  };

  const handleTogglePurchased = (id: string) => {
    const item = items.find(item => item.id === id);
    if (item && !item.purchased && item.estimatedCost === 0) {
        toast({
            title: "Aviso: Preço não informado",
            description: "Por favor, edite o item e informe o preço antes de marcá-lo como comprado.",
            variant: "destructive",
        });
        return;
    }
    setItems(items.map(item => item.id === id ? { ...item, purchased: !item.purchased } : item));
  };
  
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (item: ShoppingListItem) => {
    // When editing, the cost field should reflect price per unit
    const pricePerUnit = item.quantity > 0 ? item.estimatedCost / item.quantity : 0;
    setEditingItem({
      id: item.id,
      name: item.name,
      cost: pricePerUnit > 0 ? String(pricePerUnit) : '', // Show price per unit, or empty if 0
      quantity: String(item.quantity),
      unit: item.unit,
      originalPricePerUnit: pricePerUnit,
    });
    setPriceChange(null);
  };

  const handleSaveItem = () => {
    if (editingItem) {
        const editedItem = items.find(item => item.id === editingItem.id);
        if (!editedItem) return;

        const newPricePerUnit = parseFloat(editingItem.cost) || 0;
        const quantity = parseFloat(editingItem.quantity) || 1;
        const newTotalCost = newPricePerUnit * quantity;

        const originalPricePerUnit = editingItem.originalPricePerUnit > 0 
            ? editingItem.originalPricePerUnit
            : (editedItem.productId && products.find(p => p.id === editedItem.productId)?.lastPrice) || 0;
            
        setItems(items.map(item =>
            item.id === editingItem.id
                ? { ...item, name: editingItem.name, estimatedCost: newTotalCost, quantity: quantity, unit: editingItem.unit }
                : item
        ));

        if (newPricePerUnit !== originalPricePerUnit && originalPricePerUnit > 0) {
            const diff = newPricePerUnit - originalPricePerUnit;
            const percent = (diff / originalPricePerUnit) * 100;
            setPriceChange({ id: editingItem.id, diff, percent });
        }

        // Update product catalog with the new price per unit
        if (editedItem.productId && newPricePerUnit > 0) {
            setProducts(products.map(p => p.id === editedItem.productId ? { ...p, lastPrice: newPricePerUnit } : p));
        }

        setEditingItem(null);
    }
  };


  const getPriceHistory = (itemName: string) => {
    const history = transactions
      .filter(t => t.description.toLowerCase().includes(itemName.toLowerCase()) && t.type === 'expense')
      .map(t => ({
        date: format(t.date, 'MMM/yy', { locale: ptBR }),
        price: t.amount / (t.quantity || 1), // Price per unit
      }));

    // For demonstration, also using item's own potential past values if it existed multiple times in lists
    const itemHistory = items
        .filter(i => i.name === itemName)
        .map((i, index) => ({
             date: `Compra ${index + 1}`,
             price: i.estimatedCost / i.quantity
        }));
        
    return [...history, ...itemHistory].slice(-5);
  };

  // Transaction Dialog Logic
  const handleOpenTransactionDialog = () => {
    setTransactionAmount(totalPurchasedCost);
    setOpenTransactionDialog(true);
  };

  const resetTransactionForm = () => {
    setTransactionData({
      description: 'Compras da Lista',
      date: new Date(),
      type: 'expense',
      category: 'Alimentação',
      subcategory: 'Supermercado',
      paymentMethod: '',
    });
    setTransactionAmount(0);
    setSelectedPayers([]);
  };

  const handleTransactionSelectChange = (name: string, value: string) => {
    setTransactionData(prev => ({ ...prev, [name]: value }));
  };

  const handleTransactionDateChange = (date?: Date) => {
    if (date) {
      setTransactionData(prev => ({ ...prev, date }));
    }
  };
  
  const handleSaveTransaction = () => {
    if (selectedPayers.length === 0 || !transactionData.description || transactionAmount <= 0) {
      return;
    }

    const isBenefitCardPayment = benefitCards.some(card => card.name === transactionData.paymentMethod);
    const isCreditCardPayment = creditCards.some(card => card.name === transactionData.paymentMethod);
    const isPaidAutomatically = isBenefitCardPayment || isCreditCardPayment;

    const newTransactions: Transaction[] = [];
    
    // Create one transaction per item to keep price history
    purchasedItems.forEach(item => {
        const amountPerPayer = item.estimatedCost / selectedPayers.length;
        selectedPayers.forEach(payer => {
            newTransactions.push({
                id: `t${Date.now()}-${payer}-${item.id}`,
                ...transactionData,
                description: item.name,
                amount: amountPerPayer,
                payer: payer,
                productId: item.productId,
                quantity: item.quantity,
                paid: isPaidAutomatically,
            });
        });
    });

    // Update card balances if applicable
    if (isBenefitCardPayment) {
        setBenefitCards(prevCards =>
            prevCards.map(card =>
                card.name === transactionData.paymentMethod
                    ? { ...card, balance: card.balance - totalPurchasedCost }
                    : card
            )
        );
    } else if (isCreditCardPayment) {
        setCreditCards(prevCards =>
            prevCards.map(card =>
                card.name === transactionData.paymentMethod
                    ? { ...card, balance: card.balance + totalPurchasedCost }
                    : card
            )
        );
    }

    setTransactions(prev => [...prev, ...newTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()));
    
    // Remove purchased items from the list
    setItems(items.filter(item => !item.purchased));

    resetTransactionForm();
    setOpenTransactionDialog(false);
  };

  // Share list logic
  const handleShareList = () => {
    const unpurchasedItems = items.filter(item => !item.purchased);
    if (unpurchasedItems.length === 0) {
      toast({
        title: 'Nada a compartilhar',
        description: 'Não há itens não comprados na lista para compartilhar.',
        variant: 'destructive'
      });
      return;
    }

    const listText = "Lista de Compras:\n" + unpurchasedItems.map(item => `- ${item.quantity}${item.unit} de ${item.name}`).join('\n');
    setShareableList(listText);
    setShowShareDialog(true);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareableList).then(() => {
        toast({
            title: "Copiado!",
            description: "A lista de compras foi copiada para a área de transferência."
        });
        setShowShareDialog(false);
    });
  };

  // Recurring List Logic
  const handleOpenRecurringDialog = (list: RecurringList | null = null) => {
    if (list) {
      setEditingList(list);
      setListData({ name: list.name, frequency: list.frequency, items: [...list.items] });
    } else {
      setEditingList(null);
      setListData({ name: '', frequency: 'weekly', items: [] });
    }
    setOpenRecurringDialog(true);
  };
  
  const handleSaveList = () => {
    if (!listData.name || listData.items.length === 0) {
      return;
    }

    if (editingList) {
      setRecurringLists(prev => prev.map(l => l.id === editingList.id ? { ...editingList, ...listData } : l));
    } else {
      setRecurringLists(prev => [...prev, { id: `rl${Date.now()}`, ...listData }]);
    }
    setOpenRecurringDialog(false);
  };

  const executeDeleteList = () => {
    if (listToDelete) {
      setRecurringLists(prev => prev.filter(l => l.id !== listToDelete.id));
      setListToDelete(null);
    }
  };
  
  const handleAddItemToList = () => {
    setListData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unit: 'un' }]
    }));
  };

  const handleRemoveItemFromList = (index: number) => {
    setListData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  
  const handleItemChangeInList = (index: number, field: keyof RecurringListItem, value: string | number) => {
    setListData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      if (field === 'quantity') {
        item[field] = Number(value);
      } else {
        item[field] = value as string;
      }
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  // QR Code Scanner Logic
  const handleProcessReceipt = useCallback(async (qrCodeUrl: string) => {
    setScanStatus('processing');
    
    try {
        const result = await processReceipt({ qrCodeUrl });
        
        if (!result || !result.items || result.items.length === 0) {
            throw new Error("No items found in receipt");
        }

        const newItems: ShoppingListItem[] = result.items.map((item, index) => {
            let product = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
            if (!product) {
                const newProduct: Product = {
                    id: `prod${Date.now()}-${index}`,
                    name: item.name,
                    lastPrice: item.price
                };
                setProducts(prev => [...prev, newProduct]);
                product = newProduct;
            } else {
                setProducts(prev => prev.map(p => p.id === product!.id ? {...p, lastPrice: item.price} : p));
            }
            
            return {
                id: `sli${Date.now()}-${index}`,
                name: item.name,
                estimatedCost: item.price * item.quantity,
                purchased: false,
                productId: product.id,
                quantity: item.quantity,
                unit: item.unit || 'un',
            };
        });

        setItems(prev => [...prev, ...newItems]);

        toast({
            title: "Itens Importados!",
            description: `${newItems.length} itens foram adicionados à sua lista de compras.`
        });
        setOpenScannerDialog(false);

    } catch (error) {
        console.error("Error processing receipt:", error);
        toast({
            variant: 'destructive',
            title: "Erro ao Processar",
            description: "Não foi possível ler os itens da nota fiscal. Tente novamente."
        });
        setScanStatus('scanning'); // Allow retrying
    }
  }, [products, setProducts, setItems, toast]);

  const scanQRCode = useCallback(() => {
    if (scanStatus !== 'scanning' || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        scanRequestRef.current = requestAnimationFrame(scanQRCode);
        return;
    }
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            setScanStatus('detected');
            handleProcessReceipt(code.data);
        } else {
            scanRequestRef.current = requestAnimationFrame(scanQRCode);
        }
    }
  }, [scanStatus, handleProcessReceipt]);

  useEffect(() => {
    if (openScannerDialog) {
        setScanStatus('idle');
        const getCameraPermission = async () => {
            if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    setHasCameraPermission(true);

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                          setScanStatus('scanning');
                        };
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Acesso à câmera negado',
                        description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador para usar esta função.',
                    });
                }
            } else {
                console.error('Camera API not supported');
                setHasCameraPermission(false);
            }
        };

        getCameraPermission();

        return () => {
            if (scanRequestRef.current) cancelAnimationFrame(scanRequestRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }
  }, [openScannerDialog, toast]);

  useEffect(() => {
    if (scanStatus === 'scanning') {
        scanRequestRef.current = requestAnimationFrame(scanQRCode);
    } else {
        if (scanRequestRef.current) {
            cancelAnimationFrame(scanRequestRef.current);
        }
    }
    return () => {
        if (scanRequestRef.current) {
            cancelAnimationFrame(scanRequestRef.current);
        }
    };
  }, [scanStatus, scanQRCode]);

  const handleAddNewProduct = () => {
    if (newProductData.name.trim()) {
      const newProduct: Product = {
        id: `prod${Date.now()}`,
        name: newProductData.name.trim(),
        categoryId: newProductData.categoryId,
      };
      setProducts([...products, newProduct]);
      setNewItemProductId(newProduct.id); // auto-select the new product
      setNewProductData({ name: '', categoryId: undefined });
      setOpenNewProductDialog(false);
    }
  };

  const handleConfirmGenerateList = () => {
    if (!listToGenerate) return;

    let taskData: Omit<Task, 'id' | 'done' | 'lastCompleted'> | undefined = undefined;
    if (createTask) {
        if (taskDetails.assignees.length === 0) {
            toast({
                variant: "destructive",
                title: "Responsáveis necessários",
                description: "Por favor, selecione ao menos um responsável para a tarefa."
            });
            return;
        }
        taskData = {
            description: `Fazer compras: ${listToGenerate.name}`,
            assignees: taskDetails.assignees,
            dueDate: taskDetails.dueDate,
            frequency: 'single',
        };
    }
    generateShoppingList(listToGenerate, taskData);
    setListToGenerate(null);
  };

  const handleOpenGenerateDialog = (list: RecurringList) => {
    setListToGenerate(list);
    setCreateTask(false);
    setTaskDetails({ assignees: [], dueDate: undefined });
  };


  const combinedPaymentMethods = [
    ...paymentMethods,
    ...benefitCards.map(card => ({ id: card.id, name: card.name })),
    ...creditCards.map(card => ({ id: card.id, name: card.name })),
  ];
  const selectedCategory = categories.find(c => c.name === transactionData.category);

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Lista de Compras</CardTitle>
                <Button variant="outline" onClick={() => setOpenScannerDialog(true)}>
                    <QrCode className="mr-2"/> Importar de NF-e
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="flex flex-col gap-2 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-4">
                  <Label>Produto</Label>
                  <Select
                      value={newItemProductId}
                      onValueChange={(value) => {
                          if (value === 'add-new') {
                              setOpenNewProductDialog(true);
                          } else {
                              setNewItemProductId(value);
                              setNewItemCost('');
                          }
                      }}
                  >
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="add-new">
                              <span className="flex items-center gap-2">
                                  <PlusCircle className="h-4 w-4" />
                                  Adicionar novo produto...
                              </span>
                          </SelectItem>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="md:col-span-2">
                  <Label>Qtde.</Label>
                  <Input
                    type="number"
                    placeholder="Qtde."
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
              </div>
              <div className="md:col-span-2">
                  <Label>Unidade</Label>
                  <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitsOfMeasure.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
              <div className="md:col-span-4">
                  <Label>Custo/un.</Label>
                  <Input
                    type="number"
                    placeholder="Custo/un."
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                  />
              </div>
            </div>
             <Button type="submit" className="w-full">Incluir</Button>
          </form>
          <div className="space-y-2">
            {items.length > 0 ? items.map(item => {
              const pricePerUnit = item.quantity > 0 ? item.estimatedCost / item.quantity : 0;
              return (
              <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-2 rounded-md hover:bg-secondary">
                <div className="flex items-center gap-4 w-full">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.purchased}
                    onCheckedChange={() => handleTogglePurchased(item.id)}
                    className="mt-1.5 md:mt-0"
                  />
                  {editingItem?.id === item.id ? (
                    <div className="flex-grow flex flex-col gap-2">
                      <div className="flex-grow">
                          <Input
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              className="h-8 w-full"
                          />
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                          <Input
                              type="number"
                              value={editingItem.quantity}
                              onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                              className="w-20 h-8"
                          />
                          <Select value={editingItem.unit} onValueChange={(value) => setEditingItem({...editingItem, unit: value})}>
                              <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  {unitsOfMeasure.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <Input
                              type="number"
                              placeholder="Preço/un."
                              value={editingItem.cost}
                              onChange={(e) => setEditingItem({ ...editingItem, cost: e.target.value })}
                              className="w-28 h-8"
                          />
                      </div>
                    </div>
                  ) : (
                      <div className={`flex-grow ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                        <label htmlFor={`item-${item.id}`}><span className="font-medium">{item.quantity}{item.unit}</span> de {item.name}</label>
                        {priceChange?.id === item.id && (
                          <div className={`text-xs flex items-center gap-1 ${priceChange.diff > 0 ? 'text-destructive' : 'text-accent'}`}>
                              {priceChange.diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              <span>{formatCurrency(Math.abs(priceChange.diff))} ({priceChange.percent.toFixed(1)}%)</span>
                          </div>
                        )}
                      </div>
                  )}
                </div>
                 <div className="flex items-center justify-end w-full md:w-auto">
                    <div className="text-right">
                        <span className={`font-medium ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                            {formatCurrency(item.estimatedCost)}
                        </span>
                        {pricePerUnit > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(pricePerUnit)}/{item.unit}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10">
                                    <History className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <p className="text-sm font-medium mb-2">Histórico de Preços para "{item.name}" (por unidade)</p>
                                <ResponsiveContainer width="100%" height={150}>
                                    <BarChart data={getPriceHistory(item.name)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <XAxis dataKey="date" fontSize={12} />
                                        <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value)}/>
                                        <Tooltip
                                            contentStyle={{
                                                background: "hsl(var(--card))",
                                                borderColor: "hsl(var(--border))",
                                                fontSize: '12px',
                                                padding: '5px'
                                            }}
                                            formatter={(value: number) => [formatCurrency(value), 'Preço/un.']}
                                        />
                                        <Bar dataKey="price" fill="hsl(var(--primary))" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </PopoverContent>
                        </Popover>

                        {editingItem?.id === item.id ? (
                           <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleSaveItem}>
                                <Check className="h-5 w-5 text-accent" />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" className="h-10 w-10 bg-secondary" onClick={() => handleEditItem(item)}>
                                <Pencil className="h-5 w-5" />
                            </Button>
                        )}
                         <Button variant="ghost" size="icon" className="h-10 w-10 bg-secondary" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                </div>
              </div>
            )}) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Sua lista de compras está vazia.</p>
                    <p className="text-sm">Vá para "Listas Recorrentes" abaixo para gerar uma lista ou adicione itens manualmente.</p>
                </div>
            )}
          </div>
        </CardContent>
        {items.length > 0 && (
            <CardFooter className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-grow text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">Total Estimado</p>
                    <p className="text-2xl font-bold">{formatCurrency(items.reduce((acc, item) => acc + item.estimatedCost, 0))}</p>
                </div>
                 <div className="flex w-full flex-col-reverse sm:w-auto sm:flex-row gap-2">
                    <Button onClick={handleOpenTransactionDialog} disabled={purchasedItems.length === 0} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2" />
                        Criar Despesa ({formatCurrency(totalPurchasedCost)})
                    </Button>
                    <Button onClick={handleShareList} variant="outline" className="w-full sm:w-auto">
                        <MessageSquareShare className="mr-2" />
                        Compartilhar
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>

      <Card className="max-w-4xl mx-auto shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Listas Recorrentes</CardTitle>
                <CardDescription>Crie modelos de listas para agilizar suas compras.</CardDescription>
            </div>
            <Button onClick={() => handleOpenRecurringDialog()}>
                <PlusCircle className="mr-2" /> Criar Nova Lista
            </Button>
        </CardHeader>
        <CardContent>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recurringLists.map(list => (
                <Card key={list.id} className="shadow-sm flex flex-col">
                    <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        {list.name}
                        <Badge variant="outline">{frequencyMap[list.frequency]}</Badge>
                    </CardTitle>
                    <CardDescription>{list.items.length} produtos</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <ScrollArea className="h-40">
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                        {list.items.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            return <li key={`${item.productId}-${index}`}>{item.quantity}{item.unit} - {product?.name || 'Produto Removido'}</li>;
                        })}
                        </ul>
                    </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                    <div>
                        <Button variant="ghost" size="icon" className="bg-secondary" onClick={() => handleOpenRecurringDialog(list)}><Pencil className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="bg-secondary" onClick={() => setListToDelete(list)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                    <Button onClick={() => handleOpenGenerateDialog(list)}>
                        <Send className="mr-2"/> Gerar Lista
                    </Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
        </CardContent>
      </Card>

      <Dialog open={openTransactionDialog} onOpenChange={(isOpen) => { if (!isOpen) resetTransactionForm(); setOpenTransactionDialog(isOpen); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Despesa da Lista</DialogTitle>
            <DialogDescription>
              Crie uma nova transação com os itens selecionados. As despesas serão lançadas individualmente para manter o histórico de preços.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descrição</Label>
                <Input
                    id="description"
                    name="description"
                    value={transactionData.description}
                    className="col-span-3"
                    readOnly
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="grid grid-cols-4 items-center gap-4 col-span-1">
                <Label htmlFor="amount" className="text-right col-span-1">Valor Total</Label>
                <Input id="amount" name="amount" type="number" value={transactionAmount || ''} readOnly className="col-span-3" />
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
                      onSelect={handleTransactionDateChange}
                      initialFocus
                      />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">Forma Pgto.</Label>
              <Select onValueChange={(value) => handleTransactionSelectChange('paymentMethod', value)} value={transactionData.paymentMethod}>
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
              <Select onValueChange={(value) => { handleTransactionSelectChange('category', value); handleTransactionSelectChange('subcategory', ''); }} value={transactionData.category}>
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
                   <Select onValueChange={(value) => handleTransactionSelectChange('subcategory', value)} value={transactionData.subcategory}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione a subcategoria" />
                      </SelectTrigger>
                      <SelectContent>
                          {selectedCategory.subcategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
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
                        id={`payer-shopping-${payer.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPayers([...selectedPayers, payer.name]);
                          } else {
                            setSelectedPayers(selectedPayers.filter(p => p !== payer.name));
                          }
                        }}
                      />
                      <Label htmlFor={`payer-shopping-${payer.id}`} className="font-normal">{payer.name}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveTransaction}>Adicionar Transação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Compartilhar Lista de Compras</AlertDialogTitle>
                <AlertDialogDescription>
                    Copie o texto abaixo para compartilhar sua lista de compras.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea value={shareableList} readOnly rows={10} className="bg-muted"/>
            <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
                <Button onClick={handleCopyToClipboard}>Copiar Lista</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={openRecurringDialog} onOpenChange={setOpenRecurringDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingList ? 'Editar Lista' : 'Criar Nova Lista Recorrente'}</DialogTitle>
            <DialogDescription>
              Organize seus produtos em listas para facilitar suas compras rotineiras.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={listData.name} onChange={e => setListData({...listData, name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">Frequência</Label>
              <Select onValueChange={(value: any) => setListData({...listData, frequency: value})} value={listData.frequency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Compra Única</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="bi-weekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Produtos</Label>
              <ScrollArea className="h-60 mt-2 border rounded-md p-2">
                <div className="space-y-2">
                  {listData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                      <Select value={item.productId} onValueChange={(value) => handleItemChangeInList(index, 'productId', value)}>
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder="Selecione um produto"/>
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChangeInList(index, 'quantity', e.target.value)}
                        className="w-20"
                      />
                      <Select value={item.unit} onValueChange={(value) => handleItemChangeInList(index, 'unit', value)}>
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Un."/>
                        </SelectTrigger>
                        <SelectContent>
                          {unitsOfMeasure.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                       <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromList(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddItemToList} className="w-full mt-2">
                    <Plus className="mr-2" /> Adicionar Produto
                  </Button>
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveList}>{editingList ? 'Salvar Alterações' : 'Criar Lista'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!listToDelete} onOpenChange={() => setListToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir a lista recorrente "{listToDelete?.name}"? Essa ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={executeDeleteList} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={!!listToGenerate} onOpenChange={(isOpen) => !isOpen && setListToGenerate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Lista e Tarefa</DialogTitle>
            <DialogDescription>
              Confirme a geração da lista de compras. Você também pode criar uma tarefa associada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Você está prestes a gerar a lista de compras <strong>"{listToGenerate?.name}"</strong>. Deseja continuar?</p>
            <div className="flex items-center space-x-2">
              <Checkbox id="create-task" checked={createTask} onCheckedChange={(checked) => setCreateTask(!!checked)} />
              <Label htmlFor="create-task">Criar tarefa para esta compra</Label>
            </div>
            {createTask && (
              <div className="space-y-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label>Responsáveis</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {justPayers.map(payer => (
                      <div key={payer.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`task-assignee-${payer.id}`}
                          checked={taskDetails.assignees.includes(payer.name)}
                          onCheckedChange={(checked) => setTaskDetails(prev => ({
                            ...prev,
                            assignees: checked ? [...prev.assignees, payer.name] : prev.assignees.filter(p => p !== payer.name)
                          }))}
                        />
                        <Label htmlFor={`task-assignee-${payer.id}`} className="font-normal">{payer.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento (Opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !taskDetails.dueDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {taskDetails.dueDate ? format(taskDetails.dueDate, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={taskDetails.dueDate}
                        onSelect={(date) => setTaskDetails(prev => ({ ...prev, dueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListToGenerate(null)}>Cancelar</Button>
            <Button onClick={handleConfirmGenerateList}>Confirmar e Gerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Scanner Dialog */}
      <Dialog open={openScannerDialog} onOpenChange={setOpenScannerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Cupom Fiscal</DialogTitle>
            <DialogDescription>
              Aponte a câmera para o QR Code da sua nota fiscal para importar os itens.
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex flex-col items-center justify-center p-4">
            {hasCameraPermission === null && <p>Solicitando acesso à câmera...</p>}
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                    <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                    <AlertDescription>
                        Por favor, habilite a permissão da câmera nas configurações do seu navegador para usar esta função.
                    </AlertDescription>
                </Alert>
            )}
            <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden">
                <video 
                    ref={videoRef} 
                    className={cn("w-full h-full object-cover", { 'hidden': !hasCameraPermission })} 
                    autoPlay 
                    playsInline 
                    muted 
                />
                <canvas ref={canvasRef} className="hidden" />
                {scanStatus === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-2/3 h-2/3 border-4 border-white/50 rounded-lg animate-pulse" />
                    </div>
                )}
                {(scanStatus === 'detected' || scanStatus === 'processing') && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>
                          {scanStatus === 'detected' && 'QR Code detectado!'}
                          {scanStatus === 'processing' && 'Processando nota fiscal...'}
                        </p>
                    </div>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Product Dialog */}
      <Dialog open={openNewProductDialog} onOpenChange={setOpenNewProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Cadastre um novo produto no seu catálogo de compras.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-product-name" className="text-right">Nome</Label>
              <Input
                id="new-product-name"
                value={newProductData.name}
                onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-product-category" className="text-right">Categoria</Label>
              <Select value={newProductData.categoryId} onValueChange={(value) => setNewProductData({...newProductData, categoryId: value})}>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                      {productCategories.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddNewProduct}>Salvar Produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
