
export interface User {
  id: string;
  username: string;
  name: string;
  birthYear?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  tools?: string[];
  chatHistory: Message[];
}

export enum AvatarType {
  CRYSTAL_BALL = 'CRYSTAL_BALL',
  WIZARD_BEARD = 'WIZARD_BEARD',
  MAGIC_WAND = 'MAGIC_WAND',
  THE_WIZARD = 'THE_WIZARD',
  SWORDS = 'SWORDS'
}

export interface Quest {
  id: string;
  ownerId: string; // Links quest to specific user
  title: string;
  originalTask: string;
  createdAt: number;
  steps: Step[];
  currentStepIndex: number; // 0 to steps.length - 1
  isCompleted: boolean;
  avatar: AvatarType;
  difficulty: '5' | '10';
}

export type ViewState = 'login' | 'register' | 'landing' | 'dashboard' | 'new-quest' | 'active-quest';
