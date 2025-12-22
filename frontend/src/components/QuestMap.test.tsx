import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestMap } from './QuestMap';
import { AvatarType } from '../types';

describe('QuestMap Component', () => {
  const mockQuest = {
    id: 'q1',
    title: 'Epic Adventure',
    isCompleted: false,
    currentStepIndex: 1,
    steps: [
      { id: 's1', title: 'Start', description: 'Begin', isCompleted: true, chatHistory: [], tools: [] },
      { id: 's2', title: 'Middle', description: 'Keep going', isCompleted: false, chatHistory: [], tools: [] },
    ],
    avatar: AvatarType.WIZARD_BEARD,
    userId: 'u1',
    createdAt: new Date().toISOString()
  };

  const mockProps = {
    quest: mockQuest as any,
    onSelectStep: vi.fn(),
    selectedStepIndex: 1
  };

  it('renders all steps and handles interaction', () => {
    render(<QuestMap {...mockProps} />);
    
    // בדיקה שהשלבים קיימים
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Middle')).toBeInTheDocument();

    // בדיקת לחיצה באמצעות ה-Test ID החדש
    const firstStepCard = screen.getByTestId('step-card-0');
    fireEvent.click(firstStepCard);

    // וידוא שהפונקציה נקראה
    expect(mockProps.onSelectStep).toHaveBeenCalledWith(0);
  });

  it('renders the avatar icon on the active step', () => {
    render(<QuestMap {...mockProps} />);
    
    // בדיקה שהאימוג'י הנכון מופיע
    expect(screen.getByText('🧙‍♂️')).toBeInTheDocument();
    
    // בדיקה שהקונטיינר של ה-Avatar קיים
    expect(screen.getByTestId('avatar-container')).toBeInTheDocument();
  });
});