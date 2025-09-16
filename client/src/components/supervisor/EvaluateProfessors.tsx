import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Star, MessageSquare, CheckCircle, BookOpen, Award, Users as UsersIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for professors under supervision
const professorsData = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    position: 'Associate Professor',
    subjects: ['Database Systems', 'Software Engineering'],
    email: 'sarah.johnson@dmmmsu.edu.ph',
    status: 'not_evaluated',
    employeeId: 'CS-001'
  },
  {
    id: 2,
    name: 'Prof. Michael Chen',
    department: 'Computer Science',
    position: 'Assistant Professor',
    subjects: ['Data Structures', 'Algorithms'],
    email: 'michael.chen@dmmmsu.edu.ph',
    status: 'not_evaluated',
    employeeId: 'CS-002'
  },
  {
    id: 3,
    name: 'Dr. Maria Rodriguez',
    department: 'Computer Science',
    position: 'Professor',
    subjects: ['Machine Learning', 'AI'],
    email: 'maria.rodriguez@dmmmsu.edu.ph',
    status: 'evaluated',
    employeeId: 'CS-003'
  },
  {
    id: 4,
    name: 'Prof. James Wilson',
    department: 'Computer Science',
    position: 'Assistant Professor',
    subjects: ['Web Development', 'Mobile Programming'],
    email: 'james.wilson@dmmmsu.edu.ph',
    status: 'not_evaluated',
    employeeId: 'CS-004'
  }
];

const evaluationCriteria = [
  {
    key: 'teaching_effectiveness',
    label: 'Teaching Effectiveness',
    description: 'Quality of instruction, course preparation, and student engagement',
    icon: BookOpen
  },
  {
    key: 'professionalism',
    label: 'Professionalism',
    description: 'Professional conduct, ethics, and interaction with colleagues',
    icon: Briefcase
  },
  {
    key: 'research',
    label: 'Research & Publications',
    description: 'Research output, publications, and scholarly activities',
    icon: Award
  },
  {
    key: 'leadership',
    label: 'Leadership & Service',
    description: 'Administrative roles, committee participation, and institutional service',
    icon: UsersIcon
  }
];

export default function EvaluateProfessors() {
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [evaluationData, setEvaluationData] = useState({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfessorSelect = (professor) => {
    if (professor.status === 'evaluated') {
      toast.error('You have already evaluated this professor.');
      return;
    }
    setSelectedProfessor(professor);
    setEvaluationData({});
    setComments('');
  };

  const handleRatingChange = (criterion, rating) => {
    setEvaluationData(prev => ({
      ...prev,
      [criterion]: rating
    }));
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    
    // Validate all criteria are rated
    const missingCriteria = evaluationCriteria.filter(
      criteria => !evaluationData[criteria.key]
    );

    if (missingCriteria.length > 0) {
      toast.error('Please rate all criteria before submitting.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Professor evaluation submitted successfully!');
      setSelectedProfessor(null);
      setEvaluationData({});
      setComments('');
      setIsSubmitting(false);
      
      // Update professor status in mock data
      const professorIndex = professorsData.findIndex(p => p.id === selectedProfessor.id);
      if (professorIndex !== -1) {
        professorsData[professorIndex].status = 'evaluated';
      }
    }, 1500);
  };

  const renderRatingScale = (criterion) => {
    const Icon = criterion.icon;
    return (
      <div key={criterion.key} className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <Label className="text-base">{criterion.label}</Label>
            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
          </div>
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
  };

  if (selectedProfessor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Evaluate Professor</h1>
            <p className="text-gray-600 mt-1">
              Supervisor evaluation for {selectedProfessor.name}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedProfessor(null)}
          >
            Back to Professor List
          </Button>
        </div>

        {/* Professor Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div>{selectedProfessor.name}</div>
                <p className="text-sm text-gray-600">{selectedProfessor.position} - {selectedProfessor.department}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Employee ID:</span> {selectedProfessor.employeeId}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selectedProfessor.email}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Subjects:</span> {selectedProfessor.subjects.join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmitEvaluation} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
              <CardDescription>
                Rate each criterion on a scale of 1-5 (1 = Poor, 5 = Excellent)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {evaluationCriteria.map(renderRatingScale)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Additional Comments</span>
              </CardTitle>
              <CardDescription>
                Provide detailed feedback and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your detailed evaluation comments, strengths, areas for improvement, and recommendations..."
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
              onClick={() => setSelectedProfessor(null)}
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
          <h1>Evaluate Professors</h1>
          <p className="text-gray-600 mt-1">
            Select a professor to conduct their performance evaluation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {professorsData.filter(p => p.status === 'not_evaluated').length} Pending Evaluations
          </Badge>
        </div>
      </div>

      {/* Filter/Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Professors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Professors</SelectItem>
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
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="associate">Associate Professor</SelectItem>
                <SelectItem value="assistant">Assistant Professor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Professor List */}
      <div className="grid gap-4 md:grid-cols-2">
        {professorsData.map((professor) => (
          <Card 
            key={professor.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              professor.status === 'evaluated' 
                ? 'opacity-75 bg-gray-50' 
                : 'hover:border-blue-300'
            }`}
            onClick={() => handleProfessorSelect(professor)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{professor.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{professor.position}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{professor.subjects.join(', ')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ID: {professor.employeeId}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Badge 
                    variant={professor.status === 'evaluated' ? 'default' : 'outline'}
                    className={
                      professor.status === 'evaluated' 
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }
                  >
                    {professor.status === 'evaluated' ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Evaluated</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
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

      {/* Completion Status */}
      {professorsData.filter(p => p.status === 'not_evaluated').length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Professor Evaluations Complete</h3>
            <p className="text-gray-600">
              You have successfully evaluated all professors under your supervision for this period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}