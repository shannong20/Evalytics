import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import EvaluateProfessors from '../student/EvaluateProfessors';
import { apiService } from '../../lib/api';

interface FacultyMember {
  user_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  department_id?: number;
}

type FacultyItem = { id: string; full_name: string; email?: string | null };
const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

export default function FacultyEvaluationFlow() {
  const [step, setStep] = useState(1 as 1 | 2 | 3);
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<Array<{department_id: string, name: string}>>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<{department_id: string, name: string} | null>(null);

  const handleDepartmentSelect = (value: string) => {
    console.log('[FacultyEvaluationFlow] Department selected:', value);
    
    // Find the selected department in the departments array
    const selectedDept = departments.find(dept => dept.name === value);
    console.log('[FacultyEvaluationFlow] Found department in state:', selectedDept);
    
    setDepartment(value);
    setSelectedDepartment(selectedDept || null);
    setFacultyName('');
  };

  // Load departments on component mount
  useEffect(() => {
    async function loadDepartments() {
      console.log('[FacultyEvaluationFlow] Loading departments...');
      try {
        const response = await apiService.departments.list();
        console.log('[FacultyEvaluationFlow] Departments API response:', response);
        
        if (response.status === 'success' && response.data) {
          console.log('[FacultyEvaluationFlow] Setting departments:', response.data);
          setDepartments(response.data);
          
          // Log the first department as a sample
          if (response.data.length > 0) {
            console.log('[FacultyEvaluationFlow] Sample department data:', {
              id: response.data[0].department_id,
              name: response.data[0].name,
              type: typeof response.data[0].department_id
            });
          }
        } else {
          console.error('[FacultyEvaluationFlow] Failed to load departments:', response);
          setDepartmentsError('Failed to load departments. Please try again later.');
        }
      } catch (error) {
        console.error('[FacultyEvaluationFlow] Error loading departments:', error);
        setDepartmentsError('Error loading departments. Please refresh the page to try again.');
      } finally {
        setLoadingDepartments(false);
        console.log('[FacultyEvaluationFlow] Finished loading departments');
      }
    }

    loadDepartments();
  }, []);
  const [facultyId, setFacultyId] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyOptions, setFacultyOptions] = useState([] as FacultyItem[]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [facultyError, setFacultyError] = useState(null as string | null);

  useEffect(() => {
    let ignore = false;
    async function loadFaculty() {
      setFacultyError(null);
      setFacultyOptions([]);
      setFacultyName('');
      if (!department) return;
      setLoadingFaculty(true);
      try {
        if (!selectedDepartment) {
          console.error('[FacultyEvaluationFlow] No department selected');
          setFacultyError('No department selected');
          return;
        }
        
        console.log('[FacultyEvaluationFlow] Using selected department:', selectedDepartment);
        const deptId = selectedDepartment.department_id;
        console.log('[FacultyEvaluationFlow] Using department ID:', deptId);
        
        let departmentId: string | number;

        if (typeof deptId === 'number') {
          departmentId = deptId;
        } else if (typeof deptId === 'string') {
          const numId = Number(deptId);
          departmentId = !isNaN(numId) && numId > 0 ? numId : deptId.trim();
        } else {
          setFacultyError(`Invalid department ID type: ${typeof deptId}`);
          return;
        }

        const response = await apiService.users.list({
          role: 'Faculty',
          departmentId: departmentId
        });
        
        if (ignore) return;
        
        console.log('Full faculty response:', response);
        
        // Handle the response based on its structure
        let facultyList: Array<{
          user_id: number;
          first_name: string;
          last_name: string;
          email?: string;
          [key: string]: any;
        }> = [];

        // Check different possible response structures
        if (Array.isArray(response)) {
          facultyList = response;
        } else if (response && typeof response === 'object') {
          if (response.status === 'success' && response.data) {
            // Handle { status: 'success', data: { users: [...] } }
            facultyList = (response.data as any)?.users || [];
          } else if ('users' in response && Array.isArray((response as any).users)) {
            // Handle { users: [...] }
            facultyList = (response as any).users;
          } else if (Array.isArray((response as any).data)) {
            // Handle { data: [...] }
            facultyList = (response as any).data;
          }
        }
        
        console.log('Processed faculty list:', facultyList);
        
        // Map the response to the expected FacultyItem format
        const items: FacultyItem[] = facultyList.map((faculty: any) => ({
          id: faculty.user_id.toString(),
          full_name: `${faculty.first_name} ${faculty.last_name}`.trim(),
          email: faculty.email || null
        }));
        
        setFacultyOptions(items);
      } catch (e) {
        if (!ignore) setFacultyError('Network error while loading faculty');
      } finally {
        if (!ignore) setLoadingFaculty(false);
      }
    }
    loadFaculty();
    return () => { ignore = true; };
  }, [department]);

  const canNextFromDept = !!department;
  const canNextFromFaculty = !!facultyId;

  // When the evaluation is successfully submitted, reset the flow for a new evaluation
  const handleEvaluationSubmitted = () => {
    // Clear selections and return to Step 1 for a fresh start
    setDepartment('');
    setSelectedDepartment(null);
    setFacultyId('');
    setFacultyName('');
    setStep(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty Evaluation</h1>
        <p className="text-gray-600 mt-1">Follow the steps to select a department and faculty, then complete the evaluation form.</p>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className={step >= 1 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 1: Department</CardTitle>
            <CardDescription>Select a department</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step >= 2 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 2: Faculty</CardTitle>
            <CardDescription>Choose a faculty member</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step >= 3 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 3: Evaluate</CardTitle>
            <CardDescription>Complete the existing form</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {step === 1 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Choose Department</CardTitle>
            <CardDescription>Select one of the available departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              {loadingDepartments ? (
                <div className="text-sm text-muted-foreground">Loading departments...</div>
              ) : departmentsError ? (
                <div className="text-sm text-destructive">{departmentsError}</div>
              ) : (
                <Select 
                  value={department} 
                  onValueChange={handleDepartmentSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canNextFromDept} className="min-w-32">Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Select Faculty</CardTitle>
            <CardDescription>Faculty list is generated for the chosen department.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-4">Department: <span className="font-medium">{department}</span></div>
            <div className="max-w-md">
              <Select 
                value={facultyId} 
                onValueChange={(id) => {
                  const selectedFaculty = facultyOptions.find(f => f.id === id);
                  setFacultyId(id);
                  setFacultyName(selectedFaculty?.full_name || '');
                }} 
                disabled={loadingFaculty || !!facultyError}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingFaculty
                      ? 'Loading faculty...'
                      : facultyError
                        ? 'Unable to load faculty'
                        : facultyOptions.length
                          ? 'Select a faculty member'
                          : 'No faculty available'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {facultyOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.full_name}{f.email ? ` (${f.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {facultyError && (
                <p className="text-sm text-red-600 mt-2">{facultyError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!canNextFromFaculty} className="min-w-32">Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="mr-2">Department:</span>
              <span className="font-medium">{department}</span>
              <Separator orientation="vertical" className="mx-3 h-4" />
              <span className="mr-2">Faculty:</span>
              <span className="font-medium">{facultyName}</span>
            </div>
            <div className="space-x-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Change Faculty</Button>
              <Button variant="outline" onClick={() => setStep(1)}>Change Department</Button>
            </div>
          </div>

          {/* Existing evaluation form (unchanged). We only pass metadata props. */}
          <EvaluateProfessors
            prefilledProfessorName={facultyName}
            lockProfessorName
            department={department}
            prefilledFacultyId={facultyId}
            lockFacultySelection
            onSubmitted={handleEvaluationSubmitted}
          />
        </div>
      )}
    </div>
  );
}
