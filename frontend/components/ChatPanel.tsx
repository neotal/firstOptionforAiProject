
import React, { useState, useRef, useEffect } from 'react';
import { Message, Step } from '../types';
import { Send, Bot, User, Loader2, Scroll, CheckCircle, Sparkles, RotateCcw } from 'lucide-react';

interface ChatPanelProps {
  step: Step;
  questTitle: string;
  onToggleCompletion: () => void;
  isActiveStep: boolean;
  isQuestCompleted: boolean;
  addMessageToStep: (text: string, role: 'user' | 'model') => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  step, 
  questTitle, 
  onToggleCompletion, 
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
    setIsLoading(true);

    try {
      // The parent component handles calling the API and updating state
      await addMessageToStep(userText, 'user');
    } catch (error) {
      // Error handling is mostly done in parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-fantasy-primary/50">
      {/* Header */}
      <div className="p-6 border-b border-fantasy-gold/10 bg-fantasy-primary/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2 justify-center">
            <Scroll size={14} className="text-fantasy-gold" />
            <h2 className="text-[10px] font-royal text-fantasy-gold uppercase tracking-[0.2em] font-bold">
              AI Assistant
            </h2>
        </div>
        <h3 className="text-white font-royal text-center text-sm tracking-wide">{step.title}</h3>
      </div>

      {/* Description & Tools - The "Scroll" part */}
      <div className="p-8 border-b border-fantasy-gold/10 overflow-y-auto max-h-[35%] bg-fantasy-primary/30 scrollbar-thin">
        <p className="text-blue-100 font-body text-sm leading-7 mb-6 text-center italic opacity-90">
          "{step.description}"
        </p>
        
        {step.tools && step.tools.length > 0 && (
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-3 opacity-60">
                <div className="h-[1px] w-6 bg-fantasy-gold"></div>
                <span className="text-[10px] font-royal text-fantasy-gold uppercase tracking-widest">Tools Needed</span>
                <div className="h-[1px] w-6 bg-fantasy-gold"></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {step.tools.map((tool, i) => (
                <span key={i} className="px-3 py-1 border border-fantasy-gold/20 text-xs text-fantasy-gold font-body rounded-full bg-fantasy-gold/5 shadow-sm">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {isActiveStep && !isQuestCompleted && !step.isCompleted && (
           <button 
             onClick={onToggleCompletion}
             className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-fantasy-gold/10 to-fantasy-gold/20 hover:from-fantasy-gold/20 hover:to-fantasy-gold/30 border border-fantasy-gold/40 text-fantasy-gold font-royal text-xs py-4 tracking-widest uppercase transition-all duration-300 hover:shadow-gold-glow group rounded-sm"
           >
             <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
             Complete Step
           </button>
        )}
         {step.isCompleted && (
           <div className="flex flex-col gap-3">
             <div className="w-full flex items-center justify-center gap-2 text-green-400 font-royal text-[10px] py-4 border border-green-500/30 bg-green-900/10 uppercase tracking-widest rounded-sm">
               <CheckCircle className="w-4 h-4" />
               Step Completed
             </div>
             <button 
               onClick={onToggleCompletion}
               className="w-full flex items-center justify-center gap-2 text-fantasy-text-muted hover:text-white font-royal text-[10px] uppercase tracking-widest hover:underline decoration-fantasy-gold/50 underline-offset-4 transition-all opacity-70 hover:opacity-100"
             >
               <RotateCcw className="w-3 h-3" /> Reopen Step
             </button>
           </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-fantasy-dark/20" ref={scrollRef}>
        {step.chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-fantasy-text-muted opacity-40">
            <Sparkles className="mb-3 w-6 h-6 text-fantasy-gold" />
            <p className="font-royal text-xs text-center uppercase tracking-widest">
              Ask questions about this step...
            </p>
          </div>
        ) : (
          step.chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`
                 max-w-[85%] p-4 text-sm font-body leading-relaxed relative rounded-lg shadow-sm
                 ${msg.role === 'model' 
                   ? 'bg-fantasy-primary border border-fantasy-gold/10 text-blue-100 rounded-tl-none' 
                   : 'bg-fantasy-gold/10 border border-fantasy-gold/20 text-fantasy-gold-light rounded-tr-none'
                 }
               `}>
                  {msg.text}
               </div>
               <span className="text-[9px] font-royal text-fantasy-text-muted mt-2 uppercase tracking-widest opacity-50 px-1">
                  {msg.role === 'model' ? 'AI' : 'You'}
               </span>
            </div>
          ))
        )}
        {isLoading && (
           <div className="flex flex-col items-center justify-center py-4 opacity-70">
              <Loader2 className="w-5 h-5 animate-spin text-fantasy-gold mb-2" />
              <span className="text-[9px] font-royal text-fantasy-gold uppercase tracking-widest">Thinking...</span>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-fantasy-gold/10 bg-fantasy-primary/90">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            disabled={isLoading || step.isCompleted}
            className="flex-1 bg-fantasy-dark/50 border border-fantasy-gold/10 px-4 py-3 text-sm text-white font-body focus:outline-none focus:border-fantasy-gold/40 focus:bg-fantasy-dark/70 placeholder-fantasy-text-muted/50 disabled:opacity-50 transition-colors rounded-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || step.isCompleted}
            className="px-4 bg-fantasy-gold/10 border border-fantasy-gold/30 text-fantasy-gold hover:bg-fantasy-gold hover:text-fantasy-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
