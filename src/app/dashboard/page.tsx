
"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from "@/components/app-header";
import { Sidebar, SidebarProvider, SidebarItem } from "@/components/ui/sidebar";
import TransactionsTab from "@/app/tabs/transactions";
import ShoppingListTab from "@/app/tabs/shopping-list";
import SummaryTab from "@/app/tabs/summary";
import SettingsTab from "@/app/tabs/settings";
import PiggyBanksTab from "@/app/tabs/piggy-banks";
import TasksTab from "@/app/tabs/tasks";
import { ListChecks, Settings, BarChart3, ReceiptText, PiggyBank as PiggyBankIcon, ClipboardList } from 'lucide-react';
import {
  payers as mockPayers,
  categories as mockCategories,
  benefitCards as mockBenefitCards,
  creditCards as mockCreditCards,
  paymentMethods as mockPaymentMethods,
  transactions as mockTransactions,
  piggyBanks as mockPiggyBanks,
  piggyBankTransactions as mockPiggyBankTransactions,
  products as mockProducts,
  productCategories as mockProductCategories,
  recurringLists as mockRecurringLists,
  debts as mockDebts,
  tasks as mockTasks,
  Payer,
  Category,
  BenefitCard,
  CreditCard,
  PaymentMethod,
  Transaction,
  PiggyBank,
  PiggyBankTransaction,
  Product,
  ProductCategory,
  RecurringList,
  ShoppingListItem,
  Debt,
  Task
} from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

// Helper to get data from localStorage
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      // Dates are stored as strings, so we need to convert them back
      return JSON.parse(storedValue, (key, value) => {
        if (['date', 'lastCompleted', 'dueDate'].includes(key) && typeof value === 'string') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        return value;
      });
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Helper to save data to localStorage
const saveToLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};


function DashboardPage() {
  const [payers, setPayers] = useState<Payer[]>(() => getFromLocalStorage('payers', mockPayers));
  const [categories, setCategories] = useState<Category[]>(() => getFromLocalStorage('categories', mockCategories));
  const [benefitCards, setBenefitCards] = useState<BenefitCard[]>(() => getFromLocalStorage('benefitCards', mockBenefitCards));
  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => getFromLocalStorage('creditCards', mockCreditCards));
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => getFromLocalStorage('paymentMethods', mockPaymentMethods));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getFromLocalStorage('transactions', mockTransactions));
  const [piggyBanks, setPiggyBanks] = useState<PiggyBank[]>(() => getFromLocalStorage('piggyBanks', mockPiggyBanks));
  const [piggyBankTransactions, setPiggyBankTransactions] = useState<PiggyBankTransaction[]>(() => getFromLocalStorage('piggyBankTransactions', mockPiggyBankTransactions));
  const [products, setProducts] = useState<Product[]>(() => getFromLocalStorage('products', mockProducts));
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(() => getFromLocalStorage('productCategories', mockProductCategories));
  const [recurringLists, setRecurringLists] = useState<RecurringList[]>(() => getFromLocalStorage('recurringLists', mockRecurringLists));
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>(() => getFromLocalStorage('shoppingListItems', []));
  const [debts, setDebts] = useState<Debt[]>(() => getFromLocalStorage('debts', mockDebts));
  const [tasks, setTasks] = useState<Task[]>(() => getFromLocalStorage('tasks', mockTasks));
  const [activeTab, setActiveTab] = useState("transactions");
  const { toast } = useToast();
  
  // Memoize all state data to pass to the save function
  const allData = {
    payers, categories, benefitCards, creditCards, paymentMethods, 
    transactions, piggyBanks, piggyBankTransactions, products, productCategories,
    recurringLists, shoppingListItems, debts, tasks
  };

  // useCallback to ensure the save function reference is stable
  const saveData = useCallback(() => {
    saveToLocalStorage('payers', allData.payers);
    saveToLocalStorage('categories', allData.categories);
    saveToLocalStorage('benefitCards', allData.benefitCards);
    saveToLocalStorage('creditCards', allData.creditCards);
    saveToLocalStorage('paymentMethods', allData.paymentMethods);
    saveToLocalStorage('transactions', allData.transactions);
    saveToLocalStorage('piggyBanks', allData.piggyBanks);
    saveToLocalStorage('piggyBankTransactions', allData.piggyBankTransactions);
    saveToLocalStorage('products', allData.products);
    saveToLocalStorage('productCategories', allData.productCategories);
    saveToLocalStorage('recurringLists', allData.recurringLists);
    saveToLocalStorage('shoppingListItems', allData.shoppingListItems);
    saveToLocalStorage('debts', allData.debts);
    saveToLocalStorage('tasks', allData.tasks);
  }, [allData]);
  
  // Effect to save all state changes to localStorage when the component unmounts
  useEffect(() => {
    // Add event listener for when the user is about to leave the page
    window.addEventListener('beforeunload', saveData);

    return () => {
      // Save data when the component unmounts
      saveData();
      window.removeEventListener('beforeunload', saveData);
    };
  }, [saveData]);


  const updatePayerName = (oldName: string, newName: string) => {
    setPayers(prevPayers => prevPayers.map(p => (p.name === oldName ? { ...p, name: newName } : p)));
    setTransactions(prevTransactions => 
      prevTransactions.map(t => t.payer === oldName ? { ...t, payer: newName } : t)
    );
    setTasks(prevTasks =>
      prevTasks.map(t => ({
        ...t,
        assignees: t.assignees.map(a => a === oldName ? newName : a)
      }))
    );
  };
  
  const updateBenefitCardName = (oldName: string, newName: string) => {
    setBenefitCards(prevCards => prevCards.map(c => (c.name === oldName ? { ...c, name: newName } : c)));
    setTransactions(prevTransactions =>
      prevTransactions.map(t => t.paymentMethod === oldName ? { ...t, paymentMethod: newName } : t)
    );
  };

  const updateCreditCardName = (oldName: string, newName: string) => {
    setCreditCards(prevCards => prevCards.map(c => (c.name === oldName ? { ...c, name: newName } : c)));
    setTransactions(prevTransactions =>
      prevTransactions.map(t => t.paymentMethod === oldName ? { ...t, paymentMethod: newName } : t)
    );
  };

  const generateShoppingList = (list: RecurringList, taskData?: Omit<Task, 'id' | 'done' | 'lastCompleted'>) => {
    const items: ShoppingListItem[] = list.items.map((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const estimatedCost = 0; // Start with 0 and let user input the price
        return {
            id: `sli-${Date.now()}-${index}`,
            name: product?.name || 'Produto desconhecido',
            estimatedCost: estimatedCost,
            purchased: false,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit
        }
    });
    setShoppingListItems(items);
    
    if (taskData) {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            description: taskData.description,
            assignees: taskData.assignees,
            dueDate: taskData.dueDate,
            frequency: 'single',
            done: false,
        };
        setTasks(prev => [...prev, newTask]);
        toast({
          title: "Lista e Tarefa geradas!",
          description: "Sua lista de compras e a tarefa associada foram criadas.",
        });
    } else {
        toast({
          title: "Lista de compras gerada com sucesso!",
        });
    }

    setActiveTab("shopping-list"); // Switch to shopping list tab
  };
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'transactions':
        return <TransactionsTab 
            transactions={transactions}
            setTransactions={setTransactions}
            payers={payers}
            categories={categories}
            benefitCards={benefitCards}
            setBenefitCards={setBenefitCards}
            creditCards={creditCards}
            setCreditCards={setCreditCards}
            paymentMethods={paymentMethods}
            piggyBanks={piggyBanks}
            debts={debts}
            setDebts={setDebts}
          />;
      case 'shopping-list':
        return <ShoppingListTab 
            items={shoppingListItems}
            setItems={setShoppingListItems}
            transactions={transactions} 
            setTransactions={setTransactions}
            payers={payers}
            categories={categories}
            paymentMethods={paymentMethods}
            benefitCards={benefitCards}
            setBenefitCards={setBenefitCards}
            creditCards={creditCards}
            setCreditCards={setCreditCards}
            products={products}
            setProducts={setProducts}
            productCategories={productCategories}
            setProductCategories={setProductCategories}
            recurringLists={recurringLists}
            setRecurringLists={setRecurringLists}
            generateShoppingList={generateShoppingList}
          />;
      case 'tasks':
        return <TasksTab
            tasks={tasks}
            setTasks={setTasks}
            payers={payers}
          />;
      case 'piggy-banks':
        return <PiggyBanksTab
            piggyBanks={piggyBanks}
            setPiggyBanks={setPiggyBanks}
            transactions={transactions}
            setTransactions={setTransactions}
            piggyBankTransactions={piggyBankTransactions}
            setPiggyBankTransactions={setPiggyBankTransactions}
            payers={payers}
            paymentMethods={paymentMethods}
            benefitCards={benefitCards}
            creditCards={creditCards}
          />;
      case 'summary':
        return <SummaryTab transactions={transactions} payers={payers} products={products} debts={debts} />;
      case 'settings':
        return <SettingsTab
            payers={payers}
            setPayers={setPayers}
            categories={categories}
            setCategories={setCategories}
            benefitCards={benefitCards}
            setBenefitCards={setBenefitCards}
            creditCards={creditCards}
            setCreditCards={setCreditCards}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            piggyBanks={piggyBanks}
            setPiggyBanks={setPiggyBanks}
            products={products}
            setProducts={setProducts}
            productCategories={productCategories}
            setProductCategories={setProductCategories}
            recurringLists={recurringLists}
            setRecurringLists={setRecurringLists}
            debts={debts}
            setDebts={setDebts}
            transactions={transactions}
            setTransactions={setTransactions}
            updatePayerName={updatePayerName}
            updateBenefitCardName={updateBenefitCardName}
            updateCreditCardName={updateCreditCardName}
          />;
      default:
        return null;
    }
  };


  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
              <SidebarItem icon={<ReceiptText />} isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
                Lançamentos
              </SidebarItem>
              <SidebarItem icon={<ListChecks />} isActive={activeTab === 'shopping-list'} onClick={() => setActiveTab('shopping-list')}>
                Compras
              </SidebarItem>
              <SidebarItem icon={<ClipboardList />} isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
                Tarefas
              </SidebarItem>
              <SidebarItem icon={<PiggyBankIcon />} isActive={activeTab === 'piggy-banks'} onClick={() => setActiveTab('piggy-banks')}>
                Caixinhas
              </SidebarItem>
              <SidebarItem icon={<BarChart3 />} isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
                Resumo
              </SidebarItem>
              <SidebarItem icon={<Settings />} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                Configurações
              </SidebarItem>
          </Sidebar>
          <main className="flex-grow p-4 md:p-8 overflow-y-auto">
            {renderActiveTab()}
          </main>
        </div>
        <footer className="py-6 px-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Desenvolvido por Lais Gomes - Apoio Administrativo
        </footer>
      </div>
    </SidebarProvider>
  );
}

export default function AuthenticatedDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    } else {
      router.replace('/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return <DashboardPage />;
}
