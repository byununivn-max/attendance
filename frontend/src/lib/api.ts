// Client-side API utilities

export interface DashboardData {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  missedCount: number;
  weeklyTrend: { day: string; normal: number; late: number; absent: number }[];
  pendingCorrections: PendingCorrection[];
}

export interface PendingCorrection {
  id: number;
  initials: string;
  name: string;
  dept: string;
  date: string;
  punchType: string;
  status: string;
}

export interface AttendanceRecord {
  empCode: string;
  name: string;
  dept: string;
  checkIn: string;
  checkOut: string;
  workHours: number;
  overtime: number;
  lateMins: number;
  earlyMins: number;
  status: string;
}

export interface EmployeeDetail {
  empCode: string;
  name: string;
  dept: string;
  normalDays: number;
  lateDays: number;
  absentDays: number;
  records: AttendanceRecord[];
}

export interface ReportRow {
  emp_code: string;
  name: string;
  dept: string;
  work_days: number;
  normal_days: number;
  late_days: number;
  absent_days: number;
  leave_days: number;
  overtime_hours: number;
}

export interface Correction {
  id: number;
  name: string;
  dept: string;
  date: string;
  punchType: string;
  punchTime: string;
  reason: string;
  status: string;
  requestedAt: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  countryCode: string;
}

export interface Device {
  id: number;
  name: string;
  serial_number: string;
  ip_address: string;
  port: number;
  location: string;
  status: string;
  last_sync_at: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

export const api = {
  dashboard: {
    get: () => apiFetch<DashboardData>('/api/dashboard'),
  },
  attendance: {
    list: (date?: string, dept?: string) => {
      const p = new URLSearchParams();
      if (date) p.set('date', date);
      if (dept) p.set('dept', dept);
      return apiFetch<AttendanceRecord[]>('/api/attendance?' + p.toString());
    },
    detail: (empId: string, year?: string, month?: string) => {
      const p = new URLSearchParams();
      if (year) p.set('year', year);
      if (month) p.set('month', month);
      return apiFetch<EmployeeDetail>('/api/attendance/' + empId + '?' + p.toString());
    },
  },
  report: {
    get: (year: string, month: string) =>
      apiFetch<ReportRow[]>('/api/report?year=' + year + '&month=' + month),
  },
  corrections: {
    list: (status?: string) => {
      const p = status ? '?status=' + status : '';
      return apiFetch<Correction[]>('/api/corrections' + p);
    },
    create: (data: Partial<Correction>) =>
      apiFetch<Correction>('/api/corrections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    approve: (id: number) =>
      apiFetch('/api/corrections/' + id + '/approve', { method: 'POST' }),
    reject: (id: number, reason: string) =>
      apiFetch('/api/corrections/' + id + '/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }),
  },
  holidays: {
    list: (year?: string) => {
      const p = year ? '?year=' + year : '';
      return apiFetch<Holiday[]>('/api/holidays' + p);
    },
    create: (data: Partial<Holiday>) =>
      apiFetch<Holiday>('/api/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch('/api/holidays/' + id, { method: 'DELETE' }),
  },
  devices: {
    list: () => apiFetch<Device[]>('/api/devices'),
    sync: (id: number) => apiFetch('/api/devices/' + id + '/sync', { method: 'POST' }),
  },
};
