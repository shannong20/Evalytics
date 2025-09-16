import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { UserCheck, Star, MessageSquare, CheckCircle, Clock, Users, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for non-teaching personnel
const ntpData = [
  {
    id: 1,
    name: 'Maria Santos',
    position: 'Administrative Assistant',
    department: 'Computer Science',
    email: 'maria.santos@dmmmsu.edu.ph',
    status: 'not_evaluated',
    employeeId: 'NTP-001',
    template: 'administrative'
  },
  {
    id: 2,
    name: 'John Lee',
    position: 'IT Support Specialist',
    department: 'Computer Science',
    email: 'john.lee@dmmmsu.edu.ph',
    status: 'not_evaluated',
    employeeId: 'NTP-002',
    template: 'technical'
  },
  {
    id: 3,
    name: 'Anna Garcia',
    position: 'Laboratory Assistant',
    department: 'Computer Science',
    email: 'anna.garcia@dmmmsu.edu.ph',
    status: 'evaluated',
    employeeId: 'NTP-003',
    template: 'laboratory'
  },
  {
    id: 4,
    name: 'Robert Kim',
    position: 'Security Officer',
    department: 'Computer Science',
    email: 'robert.kim@dmmmsu.edu.ph',
    status: 'not_evaluated',
    employeeId: 'NTP-004',
    template: 'security'
  }
];

// Mock evaluation templates
const evaluationTemplates = {
  administrative: {
    name: 'Administrative Staff Template',
    criteria: [
      {
        key: 'punctuality',
        label: 'Punctuality & Attendance',
        description: 'Consistent attendance and timeliness',
        type: 'rating'
      },
      {
        key: 'task_efficiency',
        label: 'Task Efficiency',
        description: 'Quality and speed of task completion',
        type: 'rating'
      },
      {
        key: 'communication',
        label: 'Communication Skills',
        description: 'Effectiveness in verbal and written communication',
        type: 'rating'
      },
      {
        key: 'teamwork',
        label: 'Teamwork & Collaboration',
        description: 'Ability to work well with others',
        type: 'rating'
      },
      {
        key: 'customer_service',
        label: 'Customer Service',
        description: 'Quality of service to students and faculty',
        type: 'rating'
      }
    ]
  },
  technical: {
    name: 'Technical Staff Template',
    criteria: [
      {
        key: 'technical_skills',
        label: 'Technical Competency',
        description: 'Proficiency in required technical skills',
        type: 'rating'
      },
      {
        key: 'problem_solving',
        label: 'Problem Solving',
        description: 'Ability to diagnose and resolve issues',
        type: 'rating'
      },
      {
        key: 'initiative',
        label: 'Initiative & Innovation',
        description: 'Proactive approach and innovative solutions',
        type: 'rating'
      },
      {
        key: 'reliability',
        label: 'Reliability',
        description: 'Dependability in completing tasks',
        type: 'rating'
      },
      {
        key: 'safety_compliance',
        label: 'Safety Compliance',
        description: 'Adherence to safety protocols',
        type: 'yes_no'
      }
    ]
  },
  laboratory: {
    name: 'Laboratory Staff Template',
    criteria: [
      {
        key: 'equipment_handling',
        label: 'Equipment Handling',
        description: 'Proper use and maintenance of laboratory equipment',
        type: 'rating'
      },
      {
        key: 'safety_protocols',
        label: 'Safety Protocol Adherence',
        description: 'Following laboratory safety procedures',
        type: 'yes_no'
      },
      {
        key: 'organization',
        label: 'Organization & Cleanliness',
        description: 'Maintaining organized and clean workspace',
        type: 'rating'
      },
      {
        key: 'student_assistance',
        label: 'Student Assistance',
        description: 'Helping students with laboratory activities',
        type: 'rating'
      }
    ]
  },
  security: {
    name: 'Security Staff Template',
    criteria: [
      {
        key: 'vigilance',
        label: 'Vigilance & Alertness',
        description: 'Maintaining awareness of surroundings',
        type: 'rating'
      },
      {
        key: 'protocol_adherence',
        label: 'Protocol Adherence',
        description: 'Following security procedures',
        type: 'yes_no'
      },
      {
        key: 'incident_handling',
        label: 'Incident Response',
        description: 'Appropriate response to security incidents',
        type: 'rating'
      },
      {
        key: 'professionalism',
        label: 'Professional Conduct',
        description: 'Appropriate behavior and appearance',
        type: 'rating'
      }
    ]
  }
};

export default function EvaluateNTP() {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [evaluationData, setEvaluationData] = useState({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStaffSelect = (staff) => {
    if (staff.status === 'evaluated') {
      toast.error('You have already evaluated this staff member.');
      return;
    }
    setSelectedStaff(staff);
    setSelectedTemplate(evaluationTemplates[staff.template]);
    setEvaluationData({});
    setComments('');
  };

  const handleRatingChange = (criterion, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [criterion]: value
    }));
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    
    if (!selectedTemplate) {
      toast.error('No evaluation template selected.');
      return;
    }

    // Validate all criteria are completed
    const missingCriteria = selectedTemplate.criteria.filter(
      criterion => !evaluationData[criterion.key]
    );

    if (missingCriteria.length > 0) {
      toast.error('Please complete all evaluation criteria before submitting.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('NTP evaluation submitted successfully!');
      setSelectedStaff(null);
      setSelectedTemplate(null);
      setEvaluationData({});
      setComments('');
      setIsSubmitting(false);
      
      // Update staff status in mock data
      const staffIndex = ntpData.findIndex(s => s.id === selectedStaff.id);
      if (staffIndex !== -1) {
        ntpData[staffIndex].status = 'evaluated';
      }
    }, 1500);
  };

  const renderCriterion = (criterion) => {
    if (criterion.type === 'rating') {
      return (
        <div key={criterion.key} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-base">{criterion.label}</Label>
            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
          </div>
          
          <RadioGroup
            value={evaluationData[criterion.key] || ''}
            onValueChange={(value) => handleRatingChange(criterion.key, value)}
            className="grid grid-cols-5 gap-4"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <div key={rating} className="flex flex-col items-center space-y-2 p-3 border rounded-lg hover:bg-white transition-colors">
                <RadioGroupItem 
                  value={rating.toString()} 
                  id={`${criterion.key}_${rating}`}
                  className="peer"
                />
                <Label 
                  htmlFor={`${criterion.key}_${rating}`}
                  className="text-center cursor-pointer peer-checked:text-blue-600"
                >
                  <div className="flex justify-center mb-1">
                    {[...Array(rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-3 w-3 text-yellow-400 fill-current" 
                      />
                    ))}
                  </div>
                  <span className="text-xs">{rating}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    if (criterion.type === 'yes_no') {
      return (
        <div key={criterion.key} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-base">{criterion.label}</Label>
            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
          </div>
          
          <RadioGroup
            value={evaluationData[criterion.key] || ''}
            onValueChange={(value) => handleRatingChange(criterion.key, value)}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`${criterion.key}_yes`} />
              <Label htmlFor={`${criterion.key}_yes`} className="cursor-pointer">
                <CheckCircle className="h-4 w-4 text-green-600 inline mr-1" />
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${criterion.key}_no`} />
              <Label htmlFor={`${criterion.key}_no`} className="cursor-pointer">
                <MessageSquare className="h-4 w-4 text-red-600 inline mr-1" />
                No
              </Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    return null;
  };

  if (selectedStaff && selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Evaluate Non-Teaching Personnel</h1>
            <p className="text-gray-600 mt-1">
              Evaluation for {selectedStaff.name} using {selectedTemplate.name}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedStaff(null);
              setSelectedTemplate(null);
            }}
          >
            Back to Staff List
          </Button>
        </div>

        {/* Staff Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div>{selectedStaff.name}</div>
                <p className="text-sm text-gray-600">{selectedStaff.position} - {selectedStaff.department}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Employee ID:</span> {selectedStaff.employeeId}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selectedStaff.email}
              </div>
              <div>
                <span className="font-medium">Template:</span> {selectedTemplate.name}
              </div>
              <div>
                <span className="font-medium">Department:</span> {selectedStaff.department}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmitEvaluation} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Evaluation Criteria - {selectedTemplate.name}</span>
              </CardTitle>
              <CardDescription>
                Complete all evaluation criteria based on the selected template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTemplate.criteria.map(renderCriterion)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Additional Comments & Feedback</span>
              </CardTitle>
              <CardDescription>
                Provide specific feedback, recommendations, and areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter detailed feedback, strengths, areas for improvement, and recommendations for professional development..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setSelectedStaff(null);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Evaluation'
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Evaluate Non-Teaching Personnel</h1>
          <p className="text-gray-600 mt-1">
            Select a staff member to conduct their performance evaluation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {ntpData.filter(s => s.status === 'not_evaluated').length} Pending Evaluations
          </Badge>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="pending">Pending Evaluation</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="grid gap-4 md:grid-cols-2">
        {ntpData.map((staff) => (
          <Card 
            key={staff.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              staff.status === 'evaluated' 
                ? 'opacity-75 bg-gray-50' 
                : 'hover:border-green-300'
            }`}
            onClick={() => handleStaffSelect(staff)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{staff.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{staff.position}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {evaluationTemplates[staff.template]?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ID: {staff.employeeId}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Badge 
                    variant={staff.status === 'evaluated' ? 'default' : 'outline'}
                    className={
                      staff.status === 'evaluated' 
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }
                  >
                    {staff.status === 'evaluated' ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Evaluated</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Pending</span>
                      </div>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Available Evaluation Templates</span>
          </CardTitle>
          <CardDescription>
            Overview of evaluation templates used for different staff positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(evaluationTemplates).map(([key, template]) => (
              <div key={key} className="p-4 border rounded-lg">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {template.criteria.length} evaluation criteria
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  Criteria: {template.criteria.map(c => c.label).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      {ntpData.filter(s => s.status === 'not_evaluated').length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All NTP Evaluations Complete</h3>
            <p className="text-gray-600">
              You have successfully evaluated all non-teaching personnel under your supervision.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}