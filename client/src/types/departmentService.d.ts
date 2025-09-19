declare module '@/services/departmentService' {
  export type Department = { department_id: string; name: string };
  export function listDepartments(): Promise<Department[]>;
}
