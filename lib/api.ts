/**
 * API Client for Memory Map Backend
 * Handles all API calls to the Express.js backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Generic API call wrapper
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for cookies/sessions
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// ==================== AUTH API ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'PATIENT' | 'CAREGIVER';
  location?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'PATIENT' | 'CAREGIVER';
  location?: string;
  caregiverId?: string;
  caregiverName?: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiCall<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterData) =>
    apiCall<LoginResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== PATIENT API ====================

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface Memory {
  _id: string;
  userId: string;
  imageUrl?: string;
  videoUrl?: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface JournalEntry {
  _id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface MoodEntry {
  _id: string;
  userId: string;
  mood: string;
  note?: string;
  createdAt: string;
}

export interface PatientDashboard {
  patient: User;
  recentMemories: Memory[];
  recentTasks: Task[];
  recentJournalEntries: JournalEntry[];
  todayMood?: MoodEntry;
}

export const patientApi = {
  getDashboard: (patientId: string) =>
    apiCall<PatientDashboard>(`/api/patients/${patientId}/dashboard`),

  // Tasks
  getTasks: (patientId: string) =>
    apiCall<Task[]>(`/api/patients/${patientId}/tasks`),

  createTask: (patientId: string, task: Partial<Task>) =>
    apiCall<Task>(`/api/patients/${patientId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (patientId: string, taskId: string, updates: Partial<Task>) =>
    apiCall<Task>(`/api/patients/${patientId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTask: (patientId: string, taskId: string) =>
    apiCall<{ message: string }>(`/api/patients/${patientId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  // Memories
  getMemories: (patientId: string) =>
    apiCall<Memory[]>(`/api/patients/${patientId}/memories`),

  createMemory: (patientId: string, memory: FormData) =>
    fetch(`${API_URL}/api/patients/${patientId}/memories`, {
      method: 'POST',
      body: memory, // FormData for file upload
      credentials: 'include',
    }).then(res => res.json()),

  deleteMemory: (patientId: string, memoryId: string) =>
    apiCall<{ message: string }>(`/api/patients/${patientId}/memories/${memoryId}`, {
      method: 'DELETE',
    }),

  // Journal Entries
  getJournalEntries: (patientId: string) =>
    apiCall<JournalEntry[]>(`/api/patients/${patientId}/journal-entries`),

  createJournalEntry: (patientId: string, entry: Partial<JournalEntry>) =>
    apiCall<JournalEntry>(`/api/patients/${patientId}/journal-entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  // Mood Entries
  getMoodEntries: (patientId: string) =>
    apiCall<MoodEntry[]>(`/api/patients/${patientId}/mood-entries`),

  createMoodEntry: (patientId: string, mood: Partial<MoodEntry>) =>
    apiCall<MoodEntry>(`/api/patients/${patientId}/mood-entries`, {
      method: 'POST',
      body: JSON.stringify(mood),
    }),
};

// ==================== CAREGIVER API ====================

export interface CaregiverDashboard {
  caregiver: User;
  patients: User[];
  recentActivities: any[];
}

export const caregiverApi = {
  getDashboard: (caregiverId: string) =>
    apiCall<CaregiverDashboard>(`/api/caregivers/${caregiverId}/dashboard`),

  getPatients: (caregiverId: string) =>
    apiCall<User[]>(`/api/caregivers/${caregiverId}/patients`),
};
