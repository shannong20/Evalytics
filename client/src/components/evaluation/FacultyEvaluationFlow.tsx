import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import EvaluateProfessors from '../student/EvaluateProfessors';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../lib/api';

// Departments are loaded dynamically from the backend
type DepartmentItem = { department_id: string; name: string };
type FacultyItem = { id: string; full_name: string; email?: string | null };
type FormItem = { form_id: number; title: string; school_year: string; semester: string; start_date: string; end_date: string };

export default function FacultyEvaluationFlow() {
  const { token } = useAuth();
  const [step, setStep] = useState(1 as 1 | 2 | 3 | 4);
  const [formId, setFormId] = useState<number | null>(null);
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([] as DepartmentItem[]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptError, setDeptError] = useState(null as string | null);
  const [facultyId, setFacultyId] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyOptions, setFacultyOptions] = useState([] as FacultyItem[]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [facultyError, setFacultyError] = useState(null as string | null);

  // Load active evaluation forms first
  useEffect(() => {
    let ignore = false;
    async function loadForms() {
      setFormsError(null);
      setLoadingForms(true);
      try {
        const res = await fetch(buildApiUrl('/api/v1/forms?active=true'));
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) {
          const msg = (data && ((data as any).message || (data as any).error?.message)) || 'Failed to load forms';
          setFormsError(msg);
          return;
        }
        const list: FormItem[] = Array.isArray((data as any)?.data) ? (data as any).data : [];
        setForms(list);
        setFormId(list.length ? Number(list[0].form_id) : null);
      } catch (_e) {
        if (!ignore) setFormsError('Network error while loading forms');
      } finally {
        if (!ignore) setLoadingForms(false);
      }
    }
    loadForms();
    return () => { ignore = true; };
  }, []);

  // Load departments on mount
  useEffect(() => {
    let ignore = false;
    async function loadDepartments() {
      setDeptError(null);
      setLoadingDepts(true);
      try {
        // Try public endpoint first
        let items: DepartmentItem[] = [];
        let ok = false;
        try {
          const res = await fetch(buildApiUrl('/api/v1/departments/public'));
          const data = await res.json().catch(() => []);
          ok = res.ok;
          if (res.ok) {
            items = Array.isArray(data)
              ? data as DepartmentItem[]
              : Array.isArray((data as any)?.data)
                ? (data as any).data as DepartmentItem[]
                : [];
          }
        } catch {}

        // Fallback to root endpoint if public is unavailable
        if (!ok || items.length === 0) {
          const res2 = await fetch(buildApiUrl('/api/v1/departments'));
          const data2 = await res2.json().catch(() => []);
          if (!ignore && res2.ok) {
            items = Array.isArray(data2)
              ? data2 as DepartmentItem[]
              : Array.isArray((data2 as any)?.data)
                ? (data2 as any).data as DepartmentItem[]
                : [];
            ok = true;
          }
        }

        if (ignore) return;
        if (!ok) {
          setDeptError('Failed to load departments');
          return;
        }
        setDepartments(items);
      } catch (_e) {
        if (!ignore) setDeptError('Network error while loading departments');
      } finally {
        if (!ignore) setLoadingDepts(false);
      }
    }
    loadDepartments();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadFaculty() {
      setFacultyError(null);
      setFacultyOptions([]);
      setFacultyName('');
      if (!departmentId) return;
      setLoadingFaculty(true);
      try {
        const url = buildApiUrl(`/api/v1/users/faculty?departmentId=${encodeURIComponent(departmentId)}`);
        const res = await fetch(url, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) {
          const errMsg = (data && ((data as any).message || (data as any).error?.message)) || '';
          const message = `Failed to load faculty list${res.status ? ` (${res.status})` : ''}${errMsg ? ` - ${errMsg}` : ''}`;
          console.error('Faculty fetch failed', { status: res.status, statusText: res.statusText, data });
          setFacultyError(message);
          return;
        }
        const items: FacultyItem[] = Array.isArray((data as any)?.data?.faculty)
          ? (data as any).data.faculty
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : [];
        setFacultyOptions(items);
      } catch (e) {
        console.error('Faculty fetch network error', e);
        if (!ignore) setFacultyError('Network error while loading faculty');
      } finally {
        if (!ignore) setLoadingFaculty(false);
      }
    }
    loadFaculty();
    return () => { ignore = true; };
  }, [departmentId, token]);

  const canNextFromForm = formId != null;
  const canNextFromDept = !!departmentId;
  const canNextFromFaculty = !!facultyId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty Evaluation</h1>
        <p className="text-gray-600 mt-1">Follow the steps to select a department and faculty, then complete the evaluation form.</p>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className={step >= 1 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 1: Evaluation Form</CardTitle>
            <CardDescription>Select an active form</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step >= 2 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 2: Department</CardTitle>
            <CardDescription>Select a department</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step >= 3 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 3: Faculty</CardTitle>
            <CardDescription>Choose a faculty member</CardDescription>
          </CardHeader>
        </Card>
        <Card className={step >= 4 ? 'border-blue-200' : ''}>
          <CardHeader>
            <CardTitle className="text-base">Step 4: Evaluate</CardTitle>
            <CardDescription>Complete the existing form</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Select Evaluation Form</CardTitle>
            <CardDescription>Choose from active forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Select
                value={formId != null ? String(formId) : ''}
                onValueChange={(id) => setFormId(Number(id))}
                disabled={loadingForms || !!formsError}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingForms ? 'Loading forms...' : (formsError ? 'Failed to load forms' : (forms.length ? 'Select a form' : 'No active forms'))} />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((f) => (
                    <SelectItem key={String(f.form_id)} value={String(f.form_id)}>
                      {f.title} ({f.school_year} {f.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formsError && (
                <p className="text-sm text-red-600 mt-2">{formsError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canNextFromForm} className="min-w-32">Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Department */}
      {step === 2 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Choose Department</CardTitle>
            <CardDescription>Select one of the available departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Select
                value={departmentId}
                onValueChange={(id) => {
                  setDepartmentId(id);
                  const dep = departments.find(d => String(d.department_id) === id);
                  setDepartment(dep?.name || '');
                  setFacultyName('');
                  setFacultyId('');
                }}
                disabled={loadingDepts || !!deptError}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingDepts
                      ? 'Loading departments...'
                      : deptError
                        ? 'Failed to load departments'
                        : 'Select a department'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={String(d.department_id)} value={String(d.department_id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deptError && (
                <p className="text-sm text-red-600 mt-2">{deptError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(3)} disabled={!canNextFromDept} className="min-w-32">Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Faculty */}
      {step === 3 && (
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
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!canNextFromFaculty} className="min-w-32">Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Evaluate */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="mr-2">Form:</span>
              <span className="font-medium">{forms.find(f => f.form_id === formId)?.title || ''}</span>
              <Separator orientation="vertical" className="mx-3 h-4" />
              <span className="mr-2">Department:</span>
              <span className="font-medium">{department}</span>
              <Separator orientation="vertical" className="mx-3 h-4" />
              <span className="mr-2">Faculty:</span>
              <span className="font-medium">{facultyName}</span>
            </div>
            <div className="space-x-2">
              <Button variant="secondary" onClick={() => setStep(3)}>Change Faculty</Button>
              <Button variant="outline" onClick={() => setStep(2)}>Change Department</Button>
              <Button variant="outline" onClick={() => setStep(1)}>Change Form</Button>
            </div>
          </div>

          {/* Existing evaluation form (unchanged). We only pass metadata props. */}
          <EvaluateProfessors
            prefilledProfessorName={facultyName}
            lockProfessorName
            department={department}
            prefilledFacultyId={facultyId}
            lockFacultySelection
            formId={formId ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

