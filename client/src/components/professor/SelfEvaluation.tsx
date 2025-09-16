import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Search, 
  Users, 
  MessageCircle, 
  Save,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const evaluationCategories = [
  {
    id: 'teaching',
    title: 'Teaching Effectiveness',
    icon: BookOpen,
    description: 'Evaluate your teaching methods, course delivery, and student engagement',
    questions: [
      'I demonstrate mastery of my subject matter',
      'I present course content in an organized and clear manner',
      'I use effective teaching methods and techniques',
      'I encourage student participation and engagement',
      'I provide constructive feedback to students'
    ]
  },
  {
    id: 'research',
    title: 'Research & Scholarship',
    icon: Search,
    description: 'Assess your research activities, publications, and scholarly contributions',
    questions: [
      'I actively engage in research activities',
      'I publish my research in peer-reviewed journals',
      'I attend and present at academic conferences',
      'I collaborate with other researchers effectively',
      'I integrate current research into my teaching'
    ]
  },
  {
    id: 'service',
    title: 'Service & Leadership',
    icon: Users,
    description: 'Rate your contributions to the department, university, and profession',
    questions: [
      'I participate actively in department committees',
      'I contribute to university-wide initiatives',
      'I provide service to professional organizations',
      'I mentor junior faculty and students effectively',
      'I take on leadership roles when appropriate'
    ]
  },
  {
    id: 'communication',
    title: 'Communication & Collaboration',
    icon: MessageCircle,
    description: 'Evaluate your interpersonal and communication skills',
    questions: [
      'I communicate effectively with students',
      'I maintain positive relationships with colleagues',
      'I respond promptly to emails and requests',
      'I collaborate well on team projects',
      'I present my ideas clearly in meetings'
    ]
  }
];

export default function SelfEvaluation() {
  const [formData, setFormData] = useState({});
  const [comments, setComments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const handleRatingChange = (categoryId, questionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      [`${categoryId}_${questionIndex}`]: parseInt(value)
    }));
  };

  const handleCommentChange = (categoryId, value) => {
    setComments(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const validateForm = () => {
    const totalQuestions = evaluationCategories.reduce((sum, cat) => sum + cat.questions.length, 0);
    const answeredQuestions = Object.keys(formData).length;
    
    if (answeredQuestions < totalQuestions) {
      toast.error(`Please answer all questions. ${answeredQuestions}/${totalQuestions} completed.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft && !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsDraft(asDraft);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (asDraft) {
        toast.success('Evaluation saved as draft successfully!');
      } else {
        toast.success('Self-evaluation submitted successfully!');
      }
    } catch (error) {
      toast.error('Failed to submit evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  const getCompletionStats = () => {
    const totalQuestions = evaluationCategories.reduce((sum, cat) => sum + cat.questions.length, 0);
    const answeredQuestions = Object.keys(formData).length;
    return { completed: answeredQuestions, total: totalQuestions };
  };

  const { completed, total } = getCompletionStats();
  const completionPercentage = Math.round((completed / total) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Self-Evaluation</h2>
          <p className="text-gray-600 mt-1">Spring 2024 Faculty Self-Assessment</p>
        </div>
        <div className="text-right">
          <Badge className={`${completionPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} mb-2`}>
            {completed}/{total} questions completed
          </Badge>
          <div className="w-32 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-md bg-blue-50 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Evaluation Instructions</p>
              <p className="text-sm text-blue-800 mt-1">
                Rate each statement on a scale of 1-5 where: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree. 
                Please provide honest and reflective responses to help with your professional development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Categories */}
      <div className="space-y-6">
        {evaluationCategories.map((category, categoryIndex) => {
          const Icon = category.icon;
          const categoryAnswered = category.questions.filter((_, qIndex) => 
            formData[`${category.id}_${qIndex}`]
          ).length;
          
          return (
            <Card key={category.id} className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={categoryAnswered === category.questions.length ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {categoryAnswered}/{category.questions.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {category.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-3">
                    <Label className="text-base">{questionIndex + 1}. {question}</Label>
                    <RadioGroup
                      value={formData[`${category.id}_${questionIndex}`]?.toString() || ''}
                      onValueChange={(value) => handleRatingChange(category.id, questionIndex, value)}
                    >
                      <div className="flex space-x-6">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center space-x-2">
                            <RadioGroupItem value={rating.toString()} id={`${category.id}_${questionIndex}_${rating}`} />
                            <Label 
                              htmlFor={`${category.id}_${questionIndex}_${rating}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {rating}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Strongly Disagree</span>
                      <span>Strongly Agree</span>
                    </div>
                    {questionIndex < category.questions.length - 1 && <Separator />}
                  </div>
                ))}
                
                {/* Comments section for each category */}
                <div className="mt-6 space-y-2">
                  <Label htmlFor={`${category.id}_comments`}>Additional Comments (Optional)</Label>
                  <Textarea
                    id={`${category.id}_comments`}
                    placeholder={`Share any additional thoughts about your ${category.title.toLowerCase()}...`}
                    value={comments[category.id] || ''}
                    onChange={(e) => handleCommentChange(category.id, e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:border-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Comments */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Overall Comments</CardTitle>
          <CardDescription>Share any additional thoughts about your overall performance and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Provide an overall reflection on your performance this semester, including key achievements, challenges faced, and goals for improvement..."
            value={comments.overall || ''}
            onChange={(e) => handleCommentChange('overall', e.target.value)}
            className="min-h-[150px] border-gray-200 focus:border-blue-500"
          />
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {completionPercentage === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
              <span className="text-sm text-gray-600">
                {completionPercentage === 100 
                  ? 'All questions completed. Ready to submit!'
                  : `${total - completed} questions remaining`
                }
              </span>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="border-gray-200 text-gray-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || completionPercentage < 100}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting && !isDraft ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}