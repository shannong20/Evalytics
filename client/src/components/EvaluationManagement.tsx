import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Calendar as CalendarIcon, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import CreateQuestionForm from './admin/CreateQuestionForm';
import type { QuestionRecord, CategoryRecord } from '../types/question';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const sampleEvaluations = [
  { id: 1, title: 'Faculty Performance Evaluation - Spring 2024', type: 'Faculty', status: 'Active', startDate: '2024-03-01', endDate: '2024-03-31', responses: 245 },
  { id: 2, title: 'Staff Annual Review 2024', type: 'Staff', status: 'Draft', startDate: '2024-04-01', endDate: '2024-04-30', responses: 0 },
  { id: 3, title: 'Student Course Evaluation - Fall 2023', type: 'Course', status: 'Completed', startDate: '2023-11-01', endDate: '2023-11-30', responses: 1847 },
  { id: 4, title: '360-Degree Leadership Assessment', type: 'Leadership', status: 'Active', startDate: '2024-02-15', endDate: '2024-03-15', responses: 67 },
];

// Removed mock questions; will fetch from API

export default function EvaluationManagement() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [title, setTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [semester, setSemester] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questions, setQuestions] = useState([] as QuestionRecord[]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState(null as string | null);
  // Edit question state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null as QuestionRecord | null);
  const [editValues, setEditValues] = useState({ text: '', category_id: 0 as number, weight: undefined as number | undefined });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [categories, setCategories] = useState([] as CategoryRecord[]);
  const [catsLoading, setCatsLoading] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Load questions from backend
  const fetchQuestions = async () => {
    setQLoading(true);
    setQError(null);
    try {
      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/v1/questions`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        throw new Error(problem?.error?.message || `Failed to load questions (${res.status})`);
      }
      const data: QuestionRecord[] = await res.json();
      setQuestions(data);
    } catch (e: any) {
      setQError(e?.message || 'Failed to load questions');
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab]);

  // Load categories only when editing dialog opens
  useEffect(() => {
    const loadCats = async () => {
      if (!editOpen) return;
      try {
        setCatsLoading(true);
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/v1/categories/public`);
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const data: CategoryRecord[] = await res.json();
        setCategories(data);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Failed to load categories');
      } finally {
        setCatsLoading(false);
      }
    };
    loadCats();
  }, [editOpen]);

  const openEdit = (q: QuestionRecord) => {
    setEditing(q);
    setEditValues({
      text: q.question_text || (q as any).text || '',
      category_id: q.category_id,
      weight: q.weight ?? undefined,
    });
    setEditOpen(true);
  };

  const handleDelete = async (q: QuestionRecord) => {
    const ok = window.confirm('Delete this question? This action cannot be undone.');
    if (!ok) return;
    try {
      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/v1/questions/${q.question_id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 204) {
        toast.success('Question deleted');
        fetchQuestions();
      } else {
        const problem = await res.json().catch(() => null);
        throw new Error(problem?.error?.message || `Failed to delete question (${res.status})`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete question');
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      setEditSubmitting(true);
      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const payload: any = {};
      if (typeof editValues.text === 'string') payload.text = editValues.text;
      if (typeof editValues.category_id === 'number' && editValues.category_id > 0) payload.category_id = editValues.category_id;
      if (editValues.weight != null) payload.weight = editValues.weight;
      const res = await fetch(`${baseUrl}/api/v1/questions/${editing.question_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Question updated');
        setEditOpen(false);
        setEditing(null);
        fetchQuestions();
      } else {
        const problem = await res.json().catch(() => null);
        throw new Error(problem?.error?.message || `Failed to update question (${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to update question');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Evaluation Management</h2>
          <p className="text-gray-600 mt-1">Create and manage evaluation forms and periods</p>
        </div>
        <Button 
          onClick={() => setActiveTab('create')}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Evaluation
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Active Evaluations</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {sampleEvaluations.map((evaluation) => (
            <Card key={evaluation.id} className="border-0 shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{evaluation.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(evaluation.startDate), 'MMM dd, yyyy')} - {format(new Date(evaluation.endDate), 'MMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(evaluation.status)}>
                    {evaluation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-6">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{evaluation.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Responses</p>
                      <p className="font-medium">{evaluation.responses}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Create New Evaluation</CardTitle>
              <CardDescription>Set up a new evaluation form and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Evaluation Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter evaluation title"
                    className="border-gray-200 focus:border-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    placeholder="e.g., 1st"
                    className="border-gray-200 focus:border-blue-500"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_year">School Year</Label>
                  <Input
                    id="school_year"
                    placeholder="e.g., 2024-2025"
                    className="border-gray-200 focus:border-blue-500"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                  />
                </div>
                {/* Right column intentionally left for future fields */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal border-gray-200">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal border-gray-200">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="border-gray-200 text-gray-600"
                    onClick={() => {
                      setTitle(''); setSchoolYear(''); setSemester(''); setStartDate(undefined); setEndDate(undefined); setIsActive(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    disabled={creating}
                    onClick={async () => {
                      try {
                        if (!title.trim()) { toast.error('Title is required'); return; }
                        if (!/^[0-9]{4}-[0-9]{4}$/.test(schoolYear.trim())) { toast.error('School year must be YYYY-YYYY'); return; }
                        if (!startDate || !endDate) { toast.error('Start and end dates are required'); return; }
                        if (startDate.getTime() > endDate.getTime()) { toast.error('Start date must be before or equal to end date'); return; }
                        setCreating(true);
                        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
                        const payload: any = {
                          title: title.trim(),
                          school_year: schoolYear.trim(),
                          semester: semester.trim() || null,
                          start_date: format(startDate, 'yyyy-MM-dd'),
                          end_date: format(endDate, 'yyyy-MM-dd'),
                          is_active: !!isActive,
                        };
                        const res = await fetch(`${baseUrl}/api/v1/forms`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify(payload),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          const msg = (data && ((data as any).message || (data as any).error?.message)) || 'Failed to create form';
                          throw new Error(msg);
                        }
                        toast.success('Form created');
                        setActiveTab('list');
                      } catch (e: any) {
                        console.error(e);
                        toast.error(e?.message || 'Failed to create form');
                      } finally {
                        setCreating(false);
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0"
                  >
                    {creating ? 'Creating…' : 'Create Evaluation'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>Manage evaluation questions and templates</CardDescription>
                </div>
                <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Question</DialogTitle>
                      <DialogDescription>Define a question to include in evaluations.</DialogDescription>
                    </DialogHeader>
                    <CreateQuestionForm onCreated={() => { setQuestionOpen(false); setActiveTab('questions'); fetchQuestions(); }} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qLoading && (
                  <p className="text-sm text-gray-600">Loading questions…</p>
                )}
                {!qLoading && qError && (
                  <p className="text-sm text-red-600">{qError}</p>
                )}
                {!qLoading && !qError && questions.length === 0 && (
                  <p className="text-sm text-gray-600">No questions yet. Click "Add Question" to create one.</p>
                )}
                {!qLoading && !qError && questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.question_id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{q.question_text}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline" className="text-xs">Rating Scale</Badge>
                              <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                              <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600" onClick={() => openEdit(q)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200" onClick={() => handleDelete(q)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Edit Question Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
                <DialogDescription>Update question details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_text">Question Text</Label>
                  <Input
                    id="edit_text"
                    value={editValues.text}
                    onChange={(e) => setEditValues((p) => ({ ...p, text: e.target.value }))}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_category">Category</Label>
                  <Select
                    value={editValues.category_id ? String(editValues.category_id) : ''}
                    onValueChange={(v: string) => setEditValues((p) => ({ ...p, category_id: Number(v) }))}
                    disabled={catsLoading}
                  >
                    <SelectTrigger id="edit_category" className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder={catsLoading ? 'Loading categories…' : (categories.length === 0 ? 'No categories found' : 'Select category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.category_id} value={String(c.category_id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_weight">Weight (optional)</Label>
                  <Input
                    id="edit_weight"
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    placeholder="e.g., 1.00"
                    value={editValues.weight ?? ''}
                    onChange={(e) => setEditValues((p) => ({ ...p, weight: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditOpen(false)} className="border-gray-200 text-gray-600">Cancel</Button>
                  <Button onClick={submitEdit} disabled={editSubmitting} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
                    {editSubmitting ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}