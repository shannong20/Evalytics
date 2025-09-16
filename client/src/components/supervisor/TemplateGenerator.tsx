import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Settings, 
  Copy, 
  Save, 
  Eye, 
  Edit3,
  Star,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { toast } from "sonner";

// Mock existing templates
const existingTemplates = [
  {
    id: 1,
    name: 'Administrative Staff Template',
    description: 'Standard evaluation template for administrative personnel',
    category: 'administrative',
    criteriaCount: 5,
    isDefault: true,
    lastModified: '2024-01-15',
    usageCount: 8
  },
  {
    id: 2,
    name: 'Technical Staff Template',
    description: 'Evaluation template for IT and technical support staff',
    category: 'technical',
    criteriaCount: 5,
    isDefault: true,
    lastModified: '2024-01-10',
    usageCount: 3
  },
  {
    id: 3,
    name: 'Laboratory Assistant Template',
    description: 'Specialized template for lab personnel',
    category: 'laboratory',
    criteriaCount: 4,
    isDefault: false,
    lastModified: '2024-01-08',
    usageCount: 2
  },
  {
    id: 4,
    name: 'Security Staff Template',
    description: 'Template for security and safety personnel',
    category: 'security',
    criteriaCount: 4,
    isDefault: false,
    lastModified: '2024-01-05',
    usageCount: 1
  }
];

const defaultCriteria = {
  rating: {
    key: '',
    label: '',
    description: '',
    type: 'rating',
    required: true
  },
  yes_no: {
    key: '',
    label: '',
    description: '',
    type: 'yes_no',
    required: true
  },
  text: {
    key: '',
    label: '',
    description: '',
    type: 'text',
    required: false
  }
};

export default function TemplateGenerator() {
  const [templates, setTemplates] = useState(existingTemplates);
  const [activeTab, setActiveTab] = useState('existing');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // New template state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    criteria: []
  });

  const [previewTemplate, setPreviewTemplate] = useState(null);

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      description: '',
      category: '',
      criteria: []
    });
    setActiveTab('create');
  };

  const handleEditTemplate = (template) => {
    setIsCreating(false);
    setEditingTemplate(template);
    // In a real app, you'd load the full template details here
    setNewTemplate({
      name: template.name,
      description: template.description,
      category: template.category,
      criteria: [] // Load existing criteria
    });
    setActiveTab('create');
  };

  const addCriterion = (type) => {
    const newCriterion = {
      ...defaultCriteria[type],
      id: Date.now(),
      key: `criterion_${Date.now()}`,
      label: `New ${type === 'yes_no' ? 'Yes/No' : type.charAt(0).toUpperCase() + type.slice(1)} Criterion`
    };
    
    setNewTemplate(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }));
  };

  const removeCriterion = (criterionId) => {
    setNewTemplate(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== criterionId)
    }));
  };

  const updateCriterion = (criterionId, field, value) => {
    setNewTemplate(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => 
        c.id === criterionId ? { ...c, [field]: value } : c
      )
    }));
  };

  const saveTemplate = () => {
    if (!newTemplate.name || !newTemplate.category || newTemplate.criteria.length === 0) {
      toast.error('Please fill in all required fields and add at least one criterion.');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...newTemplate, criteriaCount: newTemplate.criteria.length, lastModified: new Date().toISOString().split('T')[0] }
          : t
      ));
      toast.success('Template updated successfully!');
    } else {
      // Create new template
      const template = {
        id: Date.now(),
        ...newTemplate,
        criteriaCount: newTemplate.criteria.length,
        isDefault: false,
        lastModified: new Date().toISOString().split('T')[0],
        usageCount: 0
      };
      setTemplates(prev => [...prev, template]);
      toast.success('Template created successfully!');
    }

    setActiveTab('existing');
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const duplicateTemplate = (template) => {
    const duplicated = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      isDefault: false,
      usageCount: 0,
      lastModified: new Date().toISOString().split('T')[0]
    };
    setTemplates(prev => [...prev, duplicated]);
    toast.success('Template duplicated successfully!');
  };

  const deleteTemplate = (templateId) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted successfully!');
  };

  const renderCriterionEditor = (criterion) => (
    <Card key={criterion.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {criterion.type === 'rating' && <><Star className="h-3 w-3 mr-1" />Rating (1-5)</>}
              {criterion.type === 'yes_no' && <><CheckCircle className="h-3 w-3 mr-1" />Yes/No</>}
              {criterion.type === 'text' && <><MessageSquare className="h-3 w-3 mr-1" />Text</>}
            </Badge>
            <Switch
              checked={criterion.required}
              onCheckedChange={(checked) => updateCriterion(criterion.id, 'required', checked)}
            />
            <Label className="text-sm">Required</Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCriterion(criterion.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`label_${criterion.id}`}>Criterion Label</Label>
          <Input
            id={`label_${criterion.id}`}
            value={criterion.label}
            onChange={(e) => updateCriterion(criterion.id, 'label', e.target.value)}
            placeholder="Enter criterion label"
          />
        </div>
        <div>
          <Label htmlFor={`desc_${criterion.id}`}>Description</Label>
          <Textarea
            id={`desc_${criterion.id}`}
            value={criterion.description}
            onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
            placeholder="Enter criterion description"
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor={`key_${criterion.id}`}>Key (for data storage)</Label>
          <Input
            id={`key_${criterion.id}`}
            value={criterion.key}
            onChange={(e) => updateCriterion(criterion.id, 'key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="criterion_key"
          />
        </div>
      </CardContent>
    </Card>
  );

  const TemplatePreviewDialog = ({ template }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Preview: {template.name}</DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Category:</span> {template.category}</div>
            <div><span className="font-medium">Criteria Count:</span> {template.criteriaCount}</div>
            <div><span className="font-medium">Usage Count:</span> {template.usageCount}</div>
            <div><span className="font-medium">Last Modified:</span> {template.lastModified}</div>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Sample Evaluation Criteria</h4>
            <div className="space-y-3">
              {/* Mock criteria for preview */}
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <span>Sample Rating Criterion</span>
                <Badge variant="outline">Rating (1-5)</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <span>Sample Yes/No Criterion</span>
                <Badge variant="outline">Yes/No</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Template Generator</h1>
          <p className="text-gray-600 mt-1">
            Create and manage evaluation templates for non-teaching personnel
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create New Template</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="existing">Existing Templates</TabsTrigger>
          <TabsTrigger value="create">
            {isCreating ? 'Create Template' : editingTemplate ? 'Edit Template' : 'Create Template'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-6">
          {/* Template Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Default Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.filter(t => t.isDefault).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Custom Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.filter(t => !t.isDefault).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Template List */}
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span> {template.category}
                    </div>
                    <div>
                      <span className="font-medium">Criteria:</span> {template.criteriaCount}
                    </div>
                    <div>
                      <span className="font-medium">Usage:</span> {template.usageCount} times
                    </div>
                    <div>
                      <span className="font-medium">Modified:</span> {template.lastModified}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      <TemplatePreviewDialog template={template} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      {!template.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>
                  {isCreating ? 'Create New Template' : editingTemplate ? 'Edit Template' : 'Template Builder'}
                </span>
              </CardTitle>
              <CardDescription>
                Design custom evaluation templates for different staff categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="laboratory">Laboratory</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Criteria Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evaluation Criteria</CardTitle>
                  <CardDescription>
                    Add and configure evaluation criteria for this template
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCriterion('rating')}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Add Rating
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCriterion('yes_no')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Yes/No
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCriterion('text')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Text
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {newTemplate.criteria.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No criteria added yet. Click the buttons above to add evaluation criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newTemplate.criteria.map(renderCriterionEditor)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save/Cancel Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab('existing')}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTemplate}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}