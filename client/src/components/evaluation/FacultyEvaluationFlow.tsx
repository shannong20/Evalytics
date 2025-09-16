import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import EvaluateProfessors from '../student/EvaluateProfessors';

// Step 1 – Department Selection (fixed list per requirements)
const DEPARTMENTS = [
  'College of Agriculture',
  'College of Arts and Sciences',
  'College of Community Health and Allied Medical Sciences',
  'College of Computer Science',
  'College of Education',
  'College of Fisheries',
] as const;

type FacultyItem = { id: string; full_name: string; email?: string | null };
const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

export default function FacultyEvaluationFlow() {
  const [step, setStep] = useState(1 as 1 | 2 | 3);
  const [department, setDepartment] = useState('');
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
        const url = `${API_BASE}/api/users/faculty?department=${encodeURIComponent(department)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) {
          const message = (data && (data.message || data.error?.message)) || 'Failed to load faculty list';
          setFacultyError(message);
          return;
        }
        const items: FacultyItem[] = Array.isArray(data?.data) ? data.data : [];
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
              <Select value={department} onValueChange={(v) => { setDepartment(v); setFacultyName(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          />
        </div>
      )}
    </div>
  );
}
