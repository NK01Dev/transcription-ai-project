export enum AppState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP',
  INTERVIEW = 'INTERVIEW',
  GRADING = 'GRADING',
  RESULTS = 'RESULTS'
}

export enum Language {
  ENGLISH = 'English',
  FRENCH = 'French'
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GradingResult {
  cefrLevel: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

export interface AudioConfig {
  sampleRate: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ExamResult {
  _id: string;
  score: number;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}