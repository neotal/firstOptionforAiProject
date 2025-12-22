import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';

describe('ChatPanel Component', () => {
  const mockStep = {
    id: '1',
    title: 'Test Step',
    description: 'This is a test description',
    isCompleted: false,
    chatHistory: [],
    tools: ['Hammer']
  };

  const mockProps = {
    step: mockStep,
    questTitle: 'Test Quest',
    onToggleCompletion: vi.fn(),
    isActiveStep: true,
    isQuestCompleted: false,
    addMessageToStep: vi.fn()
  };

  it('renders step description and tools', () => {
    render(<ChatPanel {...mockProps} />);
    
    expect(screen.getByText(/"This is a test description"/i)).toBeInTheDocument();
    expect(screen.getByText(/Hammer/i)).toBeInTheDocument();
  });

  it('calls addMessageToStep when sending a message', async () => {
    render(<ChatPanel {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/Ask a question.../i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'How do I start?' } });
    fireEvent.click(sendButton);

    expect(mockProps.addMessageToStep).toHaveBeenCalledWith('How do I start?', 'user');
  });
});