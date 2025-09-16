import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { User, Eye, Calendar, Star, MessageSquare, BookOpen, CheckCircle } from 'lucide-react';

interface RatingScores {
  teaching_effectiveness: number;
  communication: number;
  punctuality: number;
  fairness: number;
  [key: string]: number;
}

interface Evaluation {
  id: number;
  professorName: string;
  department: string;
  subject: string;
  submittedDate: string;
  status: 'submitted' | 'draft' | 'pending';
  ratings: RatingScores;
  comments: string;
  averageRating: number;
}

// Mock data for submitted evaluations
const submittedEvaluations = [
  {
    id: 1,
    professorName: 'Jocelyn I. Ancheta',
    department: 'Computer Science',
    subject: 'Software Engineering',
    submittedDate: '2024-01-15',
    status: 'submitted',
    ratings: {
      teaching_effectiveness: 5,
      communication: 4,
      punctuality: 5,
      fairness: 4
    },
    comments: 'Dr. Rodriguez is an excellent professor who explains complex concepts clearly and is always available for questions.',
    averageRating: 4.5
  },
  {
    id: 2,
    professorName: 'Prof. Michael Chen',
    department: 'Mathematics',
    subject: 'Calculus II',
    submittedDate: '2024-01-12',
    status: 'submitted',
    ratings: {
      teaching_effectiveness: 4,
      communication: 4,
      punctuality: 5,
      fairness: 5
    },
    comments: 'Very structured teaching approach and fair grading. Math concepts are well explained.',
    averageRating: 4.5
  },
  {
    id: 3,
    professorName: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    subject: 'Database Systems',
    submittedDate: '2024-01-10',
    status: 'submitted',
    ratings: {
      teaching_effectiveness: 5,
      communication: 5,
      punctuality: 4,
      fairness: 5
    },
    comments: 'Outstanding professor with practical examples and real-world applications.',
    averageRating: 4.75
  }
];

const criteriaLabels = {
  teaching_effectiveness: 'Teaching Effectiveness',
  communication: 'Communication Skills',
  punctuality: 'Punctuality',
  fairness: 'Fairness'
};

export default function MyEvaluations() {
  // Removed unused state

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const renderStars = useCallback((rating: number) => {
    const roundedRating = Math.round(rating);
    return (
      <div className="flex" role="img" aria-label={`Rating: ${rating} out of 5`}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < roundedRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }, []);

  const EvaluationDetailsDialog = React.memo(function EvaluationDetailsDialog({ evaluation }: { evaluation: Evaluation }) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div>Evaluation Details</div>
                <p className="text-sm text-gray-600 font-normal">
                  {evaluation.professorName} - {evaluation.subject}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Submitted on {formatDate(evaluation.submittedDate)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Professor Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Professor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{evaluation.professorName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span>{evaluation.department} - {evaluation.subject}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Submitted: {formatDate(evaluation.submittedDate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Ratings</CardTitle>
                <CardDescription>
                  Overall Average: {evaluation.averageRating}/5.0
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(evaluation.ratings).map(([key, rating]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{criteriaLabels[key as keyof typeof criteriaLabels]}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {renderStars(rating as number)}
                      <span className="text-sm text-gray-600 w-8">{rating}/5</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Comments */}
            {evaluation.comments && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Your Comments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{evaluation.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  });

  if (submittedEvaluations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1>My Evaluations</h1>
          <p className="text-gray-600 mt-1">
            View your submitted professor evaluations
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't submitted any professor evaluations yet.
            </p>
            <Link to="/student">
              <Button variant="outline">
                Start Evaluating Professors
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>My Evaluations</h1>
          <p className="text-gray-600 mt-1">
            View and manage your submitted professor evaluations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {submittedEvaluations.length} Evaluations Submitted
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedEvaluations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating Given</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(submittedEvaluations.reduce((acc, evaluation) => acc + evaluation.averageRating, 0) / submittedEvaluations.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Latest Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {formatDate(new Date(Math.max(...submittedEvaluations.map(e => new Date(e.submittedDate).getTime()))).toISOString())}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Evaluations</CardTitle>
          <CardDescription>
            Review your submitted professor evaluations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Average Rating</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittedEvaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{evaluation.professorName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{evaluation.subject}</TableCell>
                  <TableCell>{evaluation.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {renderStars(Math.round(evaluation.averageRating))}
                      <span className="text-sm text-gray-600">
                        {evaluation.averageRating}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(evaluation.submittedDate)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="default"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <EvaluationDetailsDialog evaluation={evaluation} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}