import React, { useState, useRef, useEffect } from 'react';
import { Message, Step } from '../types';
import { Send, Bot, User, Loader2, Scroll, CheckCircle, Sparkles } from 'lucide-react';
import { getStepChatResponse } from '../services/geminiService';

interface ChatPanelProps {
  step: Step;
  questTitle: string;
  onCompleteStep: () => void;
  isActiveStep: boolean;
  isQuestCompleted: boolean;
  addMessageToStep: (text: string, role: 'user' | 'model') => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  step, 
  questTitle, 
  onCompleteStep, 
  isActiveStep,
  isQuestCompleted,
  addMessageToStep
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [step.chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    addMessageToStep(userText, 'user');
    setIsLoading(true);

    try {
      const response = await getStepChatResponse(step, questTitle, userText, step.chatHistory);
      addMessageToStep(response, 'model');
    } catch (error) {
      addMessageToStep("The mystical connection has been severed. Please try again.", 'model');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-fantasy-blue/20">
      {/* Header */}
      <div className="p-6 border-b border-fantasy-gold/20 bg-fantasy-dark/50">
        <div className="flex items-center gap-2 mb-2 justify-center">
            <Scroll size={14} className="text-fantasy-gold" />
            <h2 className="text-[10px] font-royal text-fantasy-gold uppercase tracking-[0.2em]">
              The Oracle's Guidance
            </h2>
        </div>
        <h3 className="text-fantasy-text-muted font-royal text-center text-sm">{step.title}</h3>
      </div>

      {/* Description & Tools - The "Scroll" part */}
      <div className="p-8 border-b border-fantasy-gold/10 overflow-y-auto max-h-[35%] bg-fantasy-dark/30">
        <p className="text-fantasy-text font-body text-sm leading-7 mb-6 text-center italic">
          "{step.description}"
        </p>
        
        {step.tools && step.tools.length > 0 && (
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 opacity-70">
                <div className="h-[1px] w-8 bg-fantasy-gold"></div>
                <span className="text-[10px] font-royal text-fantasy-gold uppercase tracking-widest">Artifacts Needed</span>
                <div className="h-[1px] w-8 bg-fantasy-gold"></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {step.tools.map((tool, i) => (
                <span key={i} className="px-3 py-1 border border-fantasy-gold/20 text-xs text-fantasy-gold/80 font-body rounded-full bg-fantasy-gold/5">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {isActiveStep && !isQuestCompleted && !step.isCompleted && (
           <button 
             onClick={onCompleteStep}
             className="w-full flex items-center justify-center gap-3 bg-fantasy-gold/10 hover:bg-fantasy-gold/20 border border-fantasy-gold/50 text-fantasy-gold font-royal text-xs py-4 tracking-widest uppercase transition-all duration-300 hover:shadow-gold-glow group"
           >
             <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
             Mark as Completed
           </button>
        )}
         {step.isCompleted && (
             <div className="w-full flex items-center justify-center gap-2 text-green-500/70 font-royal text-[10px] py-4 border border-green-900/30 uppercase tracking-widest">
             <CheckCircle className="w-4 h-4" />
             Step Conquered
           </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {step.chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-fantasy-text-muted opacity-30">
            <Sparkles className="mb-2 w-6 h-6" />
            <p className="font-royal text-xs text-center uppercase tracking-widest">
              Commune with the Oracle
            </p>
          </div>
        ) : (
          step.chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`
                 max-w-[85%] p-4 text-sm font-body leading-relaxed relative
                 ${msg.role === 'model' 
                   ? 'bg-fantasy-dark/80 border border-fantasy-gold/20 text-fantasy-text' 
                   : 'bg-fantasy-gold/10 border border-fantasy-gold/30 text-fantasy-gold-light'
                 }
               `}>
                  {/* Decorative corner for model messages */}
                  {msg.role === 'model' && (
                     <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-fantasy-gold/50"></div>
                  )}
                  {msg.text}
               </div>
               <span className="text-[9px] font-royal text-fantasy-text-muted mt-2 uppercase tracking-widest opacity-50">
                  {msg.role === 'model' ? 'The Oracle' : 'Hero'}
               </span>
            </div>
          ))
        )}
        {isLoading && (
           <div className="flex flex-col items-center justify-center py-4 opacity-50">
              <Loader2 className="w-5 h-5 animate-spin text-fantasy-gold mb-2" />
              <span className="text-[9px] font-royal text-fantasy-gold uppercase tracking-widest">Divining...</span>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-fantasy-gold/10 bg-fantasy-dark/80">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for wisdom..."
            disabled={isLoading || step.isCompleted}
            className="flex-1 bg-fantasy-blue/30 border border-fantasy-gold/20 px-4 py-3 text-sm text-fantasy-text font-body focus:outline-none focus:border-fantasy-gold/60 placeholder-fantasy-text-muted/40 disabled:opacity-50 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || step.isCompleted}
            className="px-4 bg-fantasy-gold/10 border border-fantasy-gold/30 text-fantasy-gold hover:bg-fantasy-gold hover:text-fantasy-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};