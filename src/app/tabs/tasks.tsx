
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Task, Payer, TaskFrequency } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { isToday, isSameDay, addWeeks, addMonths, startOfDay, getDay, addDays, isPast, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';

interface TasksTabProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  payers: Payer[];
}

const frequencyMap: Record<TaskFrequency, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  'bi-weekly': 'Quinzenal',
  monthly: 'Mensal',
  single: 'Única',
  'specific-days': 'Dias Específicos'
};

const daysOfWeek = [
  { label: 'D', value: '0' },
  { label: 'S', value: '1' },
  { label: 'T', value: '2' },
  { label: 'Q', value: '3' },
  { label: 'Q', value: '4' },
  { label: 'S', value: '5' },
  { label: 'S', value: '6' },
];

export default function TasksTab({ tasks, setTasks, payers }: TasksTabProps) {
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskData, setTaskData] = useState<Omit<Task, 'id' | 'done' | 'lastCompleted'>>({
    description: '',
    frequency: 'single',
    assignees: [],
    daysOfWeek: [],
    dueDate: undefined,
    dueTime: '',
    reminder: undefined
  });
  const { toast } = useToast();
  const [filterAssignee, setFilterAssignee] = useState('all');

  const handleOpenDialog = (task: Task | null = null) => {
    if (task) {
      setEditingTask(task);
      setTaskData({
        description: task.description,
        frequency: task.frequency,
        assignees: task.assignees,
        daysOfWeek: task.daysOfWeek || [],
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        reminder: task.reminder,
      });
    } else {
      setEditingTask(null);
      setTaskData({
        description: '',
        frequency: 'single',
        assignees: [],
        daysOfWeek: [],
        dueDate: undefined,
        dueTime: '',
        reminder: undefined
      });
    }
    setOpenTaskDialog(true);
  };

  const handleSaveTask = () => {
    if (!taskData.description || taskData.assignees.length === 0) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Preencha a descrição e selecione pelo menos um responsável."
        });
      return;
    }
    
    if (taskData.frequency === 'specific-days' && taskData.daysOfWeek?.length === 0) {
        toast({
            variant: "destructive",
            title: "Seleção de dias obrigatória",
            description: "Por favor, selecione pelo menos um dia da semana para tarefas com essa periodicidade."
        });
      return;
    }

    const taskToSave = {
      ...taskData,
      daysOfWeek: taskData.frequency === 'specific-days' ? taskData.daysOfWeek : [],
    };

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...editingTask, ...taskToSave } : t));
      toast({ title: "Tarefa atualizada com sucesso!" });
    } else {
      const newTask: Task = {
        id: `task${Date.now()}`,
        ...taskToSave,
        done: false,
      };
      setTasks([...tasks, newTask]);
      toast({ title: "Tarefa criada com sucesso!" });
    }

    setOpenTaskDialog(false);
  };
  
  const handleDeleteTask = (id: string) => {
      setTasks(tasks.filter(t => t.id !== id));
      toast({ title: "Tarefa removida." });
  }

  const handleToggleDone = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const isDone = !t.done;
        return { 
          ...t, 
          done: isDone,
          lastCompleted: isDone ? new Date() : t.lastCompleted // only update lastCompleted when marking as done
        };
      }
      return t;
    }));
  };
  
  const isTaskPending = (task: Task): boolean => {
    // If a task with a due date is done, it's not pending
    if (task.dueDate && task.done) {
        return false;
    }
    // If a task has a due date, its pendency is determined by that date.
    if (task.dueDate) {
        return isToday(task.dueDate) || isPast(task.dueDate);
    }
    
    // Logic for recurring tasks without a specific due date
    if (task.frequency === 'single') {
        return !task.done;
    }

    if (!task.lastCompleted) {
        return true;
    }
    
    const today = startOfDay(new Date());
    const lastCompleted = startOfDay(task.lastCompleted);

    if (isSameDay(today, lastCompleted)) {
        return false; // Already done today
    }
    
    switch (task.frequency) {
        case 'daily':
            return true; // If not completed today, it's pending
        case 'weekly':
            return today >= addWeeks(lastCompleted, 1);
        case 'bi-weekly':
            return today >= addDays(lastCompleted, 14);
        case 'monthly':
            return today >= addMonths(lastCompleted, 1);
        case 'specific-days':
            const todayDay = getDay(today);
            return task.daysOfWeek?.includes(todayDay) ?? false;
        default:
            return !task.done;
    }
  };


  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        if (filterAssignee === 'all') return true;
        return task.assignees.includes(filterAssignee);
    });
  }, [tasks, filterAssignee]);
  
  const pendingTasks = filteredTasks.filter(isTaskPending);
  const completedTodayTasks = filteredTasks.filter(t => t.lastCompleted && isToday(t.lastCompleted));


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle>Lista de Tarefas</CardTitle>
            <CardDescription>
              Acompanhe as tarefas domésticas. {pendingTasks.length} tarefa(s) pendente(s).
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por pessoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {payers.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto gap-2">
              <PlusCircle /> Nova Tarefa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingTasks.length > 0 ? (
              pendingTasks.map(task => {
                  const assigneesDetails = task.assignees.map(name => payers.find(p => p.name === name)).filter(Boolean) as Payer[];
                  return (
                      <div key={task.id} className={cn("flex items-center gap-4 p-3 rounded-lg bg-secondary/50")}>
                           <Checkbox
                              id={`task-${task.id}`}
                              checked={false} // Pending tasks are always unchecked here
                              onCheckedChange={() => handleToggleDone(task.id)}
                              className="h-5 w-5"
                          />
                          <div className="flex-grow">
                              <label htmlFor={`task-${task.id}`} className="font-medium">{task.description}</label>
                              <div className="text-xs flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline">{frequencyMap[task.frequency]}</Badge>
                                  {assigneesDetails.map(assignee => (
                                      <Badge key={assignee.id} style={{ backgroundColor: `hsl(${assignee.color})` }} className="text-white">
                                          {assignee.name}
                                      </Badge>
                                  ))}
                              </div>
                          </div>
                          <div className="flex items-center">
                              <Button variant="ghost" size="icon" className="bg-secondary h-9 w-9" onClick={() => handleOpenDialog(task)}>
                                  <Pencil className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="bg-secondary h-9 w-9" onClick={() => handleDeleteTask(task.id)}>
                                  <Trash2 className="h-5 w-5 text-destructive" />
                              </Button>
                          </div>
                      </div>
                  )
              })
          ) : (
              <div className="text-center text-muted-foreground py-8">
                  <p>Nenhuma tarefa pendente.</p>
                  <p className="text-sm">Clique em "Nova Tarefa" para começar ou altere o filtro.</p>
              </div>
          )}
          
          {completedTodayTasks.length > 0 && (
            <>
              <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">
                      Concluídas Hoje
                  </span>
              </div>
              {completedTodayTasks.map(task => {
                   const assigneesDetails = task.assignees.map(name => payers.find(p => p.name === name)).filter(Boolean) as Payer[];
                   return (
                       <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                           <Checkbox
                               id={`task-${task.id}`}
                               checked={true}
                               onCheckedChange={() => handleToggleDone(task.id)}
                               className="h-5 w-5"
                           />
                           <div className="flex-grow line-through text-muted-foreground">
                               <label htmlFor={`task-${task.id}`} className="font-medium">{task.description}</label>
                               <div className="text-xs flex items-center gap-2 mt-2 flex-wrap">
                                   <Badge variant="outline">{frequencyMap[task.frequency]}</Badge>
                                   {assigneesDetails.map(assignee => (
                                       <Badge key={assignee.id} style={{ backgroundColor: `hsl(${assignee.color})` }} className="text-white no-underline">
                                           {assignee.name}
                                       </Badge>
                                   ))}
                               </div>
                           </div>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" className="bg-secondary h-9 w-9" onClick={() => handleOpenDialog(task)}>
                                  <Pencil className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="bg-secondary h-9 w-9" onClick={() => handleDeleteTask(task.id)}>
                                  <Trash2 className="h-5 w-5 text-destructive" />
                              </Button>
                          </div>
                       </div>
                   )
              })}
            </>
          )}

        </div>
      </CardContent>
      
      {/* Task Dialog */}
      <Dialog open={openTaskDialog} onOpenChange={setOpenTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da tarefa doméstica.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Input
                id="description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Responsáveis</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                  {payers.map(payer => (
                      <div key={payer.id} className="flex items-center space-x-2">
                          <Checkbox
                              id={`payer-task-${payer.id}`}
                              checked={taskData.assignees.includes(payer.name)}
                              onCheckedChange={(checked) => setTaskData(prev => ({
                                  ...prev,
                                  assignees: checked ? [...prev.assignees, payer.name] : prev.assignees.filter(p => p !== payer.name)
                              }))}
                          />
                          <Label htmlFor={`payer-task-${payer.id}`} className="font-normal">{payer.name}</Label>
                      </div>
                  ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">Periodicidade</Label>
              <Select
                value={taskData.frequency}
                onValueChange={(value: TaskFrequency) => setTaskData({ ...taskData, frequency: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Única</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="bi-weekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="specific-days">Dias Específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskData.frequency === 'specific-days' && (
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Dias</Label>
                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        value={taskData.daysOfWeek?.map(String) || []}
                        onValueChange={(value) => setTaskData({...taskData, daysOfWeek: value.map(Number)})}
                        className="col-span-3 justify-start"
                    >
                        {daysOfWeek.map(day => (
                            <ToggleGroupItem key={day.value} value={day.value} aria-label={`Toggle ${day.label}`}>
                                {day.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Prazo</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "justify-start text-left font-normal",
                                    !taskData.dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {taskData.dueDate ? format(taskData.dueDate, "dd/MM/yyyy") : <span>Data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={taskData.dueDate}
                                onSelect={(date) => setTaskData({...taskData, dueDate: date})}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Input
                        type="time"
                        value={taskData.dueTime}
                        onChange={(e) => setTaskData({ ...taskData, dueTime: e.target.value })}
                        disabled={!taskData.dueDate}
                    />
                </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reminder" className="text-right">Lembrete</Label>
                <Select
                    value={taskData.reminder?.toString()}
                    onValueChange={(value) => setTaskData({...taskData, reminder: value ? Number(value) as Task['reminder'] : undefined})}
                    disabled={!taskData.dueTime}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Definir lembrete" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5 minutos antes</SelectItem>
                        <SelectItem value="10">10 minutos antes</SelectItem>
                        <SelectItem value="15">15 minutos antes</SelectItem>
                        <SelectItem value="30">30 minutos antes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveTask}>{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
