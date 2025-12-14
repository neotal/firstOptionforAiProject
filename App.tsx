import React, { useState } from 'react';
import { Quest, ViewState, Step, AvatarType } from './types';
import { generateQuestBreakdown } from './services/geminiService';
import { QuestMap } from './components/QuestMap';
import { ChatPanel } from './components/ChatPanel';
import { 
  Sword, 
  Map as MapIcon, 
  Plus, 
  History, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  LayoutDashboard,
  Scroll,
  Gem,
  Crown
} from 'lucide-react';

const MOCK_USER = {
  name: "Traveler",
  level: 5,
  xp: 2400
};

// --- Fantasy Components ---

const Divider = () => (
  <div className="flex items-center justify-center w-full py-6 opacity-80">
    <div className="h-[1px] bg-gradient-to-r from-transparent via-fantasy-gold to-transparent w-full max-w-xs"></div>
    <div className="mx-4 text-fantasy-gold transform rotate-45 border border-fantasy-gold w-3 h-3 bg-fantasy-dark"></div>
    <div className="h-[1px] bg-gradient-to-r from-transparent via-fantasy-gold to-transparent w-full max-w-xs"></div>
  </div>
);

const GoldButton = ({ onClick, children, disabled, className = "" }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`
      relative group px-8 py-3 overflow-hidden border border-fantasy-gold/50 
      text-fantasy-gold font-royal tracking-widest uppercase text-sm
      hover:border-fantasy-gold hover:text-white hover:shadow-gold-glow hover:bg-fantasy-gold/10
      transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    <div className="absolute inset-0 w-0 bg-fantasy-gold/10 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
    <span className="relative flex items-center justify-center gap-2">{children}</span>
  </button>
);

const Logo = () => (
  <div className="flex flex-col items-center select-none group cursor-pointer">
    <div className="flex items-center gap-2 text-fantasy-gold mb-1">
      <Crown size={24} className="group-hover:drop-shadow-[0_0_8px_rgba(197,160,89,0.8)] transition-all" />
      <span className="font-royal font-bold text-2xl tracking-[0.2em] text-fantasy-gold-light gold-text-shadow">QUESTLOG</span>
    </div>
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-fantasy-gold/50 to-transparent"></div>
    <span className="text-[10px] uppercase tracking-[0.5em] text-fantasy-text-muted mt-1 font-body">Journey Within</span>
  </div>
);

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  
  // New Quest Form State
  const [taskInput, setTaskInput] = useState('');
  const [stepCount, setStepCount] = useState<5 | 10>(5);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(AvatarType.WARRIOR);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Quest UI State
  const [selectedMapStepIndex, setSelectedMapStepIndex] = useState<number>(0);

  const activeQuest = quests.find(q => q.id === activeQuestId);

  const handleCreateQuest = async () => {
    if (!taskInput.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const breakdown = await generateQuestBreakdown(taskInput, stepCount);
      
      const newQuest: Quest = {
        id: crypto.randomUUID(),
        title: breakdown.title,
        originalTask: taskInput,
        createdAt: Date.now(),
        difficulty: stepCount === 5 ? '5' : '10',
        avatar: selectedAvatar,
        currentStepIndex: 0,
        isCompleted: false,
        steps: breakdown.steps.map((s, i) => ({
          ...s,
          id: crypto.randomUUID(),
          isCompleted: false,
          chatHistory: []
        }))
      };

      setQuests([newQuest, ...quests]);
      setActiveQuestId(newQuest.id);
      setSelectedMapStepIndex(0);
      setView('active-quest');
      setTaskInput('');
    } catch (e) {
      console.error(e);
      setError("The ancient scrolls are unreadable. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteStep = (questId: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id !== questId) return q;
      
      const nextIndex = q.currentStepIndex + 1;
      const isFinished = nextIndex >= q.steps.length;
      
      const updatedSteps = [...q.steps];
      updatedSteps[q.currentStepIndex] = {
        ...updatedSteps[q.currentStepIndex],
        isCompleted: true
      };

      return {
        ...q,
        steps: updatedSteps,
        currentStepIndex: isFinished ? q.currentStepIndex : nextIndex,
        isCompleted: isFinished
      };
    }));
    
    // Auto advance selection if not finished
    const currentQ = quests.find(q => q.id === questId);
    if (currentQ && currentQ.currentStepIndex < currentQ.steps.length - 1) {
        setSelectedMapStepIndex(currentQ.currentStepIndex + 1);
    }
  };

  const addMessageToStep = (questId: string, stepIndex: number, text: string, role: 'user' | 'model') => {
    setQuests(prev => prev.map(q => {
      if (q.id !== questId) return q;
      const updatedSteps = [...q.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        chatHistory: [...updatedSteps[stepIndex].chatHistory, {
          role,
          text,
          timestamp: Date.now()
        }]
      };
      return { ...q, steps: updatedSteps };
    }));
  };

  // --- Views ---

  const renderLanding = () => (
    <div className="flex flex-col min-h-screen relative bg-fantasy-dark">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center bg-no-repeat bg-fixed opacity-60 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-fantasy-dark via-transparent to-fantasy-dark/80 z-0 pointer-events-none"></div>

      <nav className="p-8 flex justify-between items-center z-10 relative">
        <Logo />
        <GoldButton onClick={() => setView('dashboard')}>Enter Realm</GoldButton>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="max-w-4xl space-y-8 animate-[fadeIn_1s_ease-out]">
           <h1 className="text-5xl md:text-7xl font-royal font-bold text-fantasy-gold-light mb-4 drop-shadow-2xl">
             Forge Your Legend
           </h1>
           <Divider />
           <p className="text-xl md:text-2xl text-fantasy-text font-body max-w-2xl mx-auto leading-relaxed drop-shadow-md">
             Turn the mundane into the mythical. <br/>
             Your tasks are not mere chores, but a journey awaiting a hero.
           </p>

           <div className="pt-12">
             <GoldButton onClick={() => setView('dashboard')} className="px-12 py-4 text-lg border-2">
               Begin Your Quest
             </GoldButton>
           </div>
        </div>
      </div>
      
      {/* Bottom border graphic */}
      <div className="h-2 w-full bg-gradient-to-r from-fantasy-dark via-fantasy-gold to-fantasy-dark relative z-20"></div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen flex flex-col bg-fantasy-dark bg-parchment relative">
       {/* Background Noise/Scratch effect */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>

       <nav className="h-24 border-b border-fantasy-gold/20 bg-fantasy-dark/90 backdrop-blur-md flex items-center px-8 justify-between shrink-0 sticky top-0 z-40 shadow-lg">
          <div onClick={() => setView('landing')}><Logo /></div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-fantasy-gold text-xs font-royal tracking-widest">Traveler Level</span>
                <span className="text-fantasy-text font-body">{MOCK_USER.level}</span>
             </div>
             <div className="w-10 h-10 rounded-full border border-fantasy-gold/50 bg-fantasy-blue flex items-center justify-center text-fantasy-gold shadow-gold-glow">
                <Crown size={18} />
             </div>
          </div>
       </nav>

       <div className="max-w-6xl mx-auto w-full py-12 px-6 flex-1 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-fantasy-gold/20 pb-6">
            <div>
              <h2 className="text-3xl font-royal text-fantasy-gold-light mb-2">Quest Board</h2>
              <p className="text-fantasy-text-muted font-body italic">Current undertakings and available missions.</p>
            </div>
            <GoldButton onClick={() => setView('new-quest')}>
              <Plus size={16} /> New Contract
            </GoldButton>
          </div>

          {quests.length === 0 ? (
            <div className="border border-fantasy-gold/30 bg-fantasy-blue/30 p-20 text-center rounded-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-fantasy-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <Scroll className="mx-auto w-16 h-16 text-fantasy-gold/50 mb-6" strokeWidth={1} />
              <h3 className="text-xl font-royal text-fantasy-gold mb-3">No Active Contracts</h3>
              <p className="text-fantasy-text-muted mb-8 font-body">The realm is at peace... perhaps too peaceful.</p>
              <button onClick={() => setView('new-quest')} className="text-fantasy-gold underline hover:text-white transition-colors font-royal tracking-widest text-sm">Create New Quest</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quests.map(quest => (
                <div 
                  key={quest.id} 
                  onClick={() => {
                    setActiveQuestId(quest.id);
                    setSelectedMapStepIndex(quest.currentStepIndex);
                    setView('active-quest');
                  }}
                  className="relative bg-fantasy-blue/40 border border-fantasy-gold/30 p-8 cursor-pointer transition-all hover:bg-fantasy-blue/60 hover:border-fantasy-gold group"
                >
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-fantasy-gold"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-fantasy-gold"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-fantasy-gold"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-fantasy-gold"></div>

                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1 font-royal text-[10px] tracking-widest border uppercase ${quest.isCompleted ? 'border-green-800 text-green-500 bg-green-900/20' : 'border-fantasy-gold/50 text-fantasy-gold bg-fantasy-gold/10'}`}>
                      {quest.isCompleted ? 'Completed' : 'Active'}
                    </div>
                    <Gem className="text-fantasy-gold opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                  
                  <h3 className="text-xl font-royal mb-4 text-fantasy-text-muted group-hover:text-fantasy-gold-light transition-colors truncate">{quest.title}</h3>
                  
                  <div className="w-full bg-black/50 border border-fantasy-gold/20 h-1 mb-4">
                    <div 
                      className={`h-full transition-all duration-1000 ${quest.isCompleted ? 'bg-green-600' : 'bg-fantasy-gold'}`}
                      style={{ width: `${(quest.steps.filter(s => s.isCompleted).length / quest.steps.length) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-fantasy-text-muted font-body">
                    <span>{quest.steps.length} Stages</span>
                    <span>{new Date(quest.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
       </div>
    </div>
  );

  const renderNewQuest = () => (
    <div className="min-h-screen flex flex-col bg-fantasy-dark relative">
       {/* Background Noise */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

      <nav className="p-6 border-b border-fantasy-gold/10 bg-fantasy-dark/95 z-10 flex justify-center">
         <Logo />
      </nav>
      
      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="max-w-3xl w-full">
          <button onClick={() => setView('dashboard')} className="text-fantasy-gold/70 hover:text-fantasy-gold mb-8 flex items-center gap-2 font-royal text-xs uppercase tracking-widest transition-colors">
            <ChevronRight className="rotate-180" size={14} /> Return to Map
          </button>
          
          <div className="bg-fantasy-blue/20 border border-fantasy-gold/30 p-10 md:p-12 relative backdrop-blur-sm">
            {/* Ornate border top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fantasy-dark px-4 border border-fantasy-gold/30 text-fantasy-gold font-royal text-xs tracking-widest uppercase">
               New Quest Scroll
            </div>
            
            <div className="space-y-10">
              <div>
                <label className="block text-fantasy-gold text-xs font-royal tracking-widest mb-4 uppercase text-center">Describe Your Mission</label>
                <textarea 
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="E.g., Master the art of Python, Organize the Grand Archive (Garage), Plan the journey to the Western Lands..."
                  className="w-full h-32 bg-fantasy-dark/50 border border-fantasy-gold/20 p-6 text-fantasy-text font-body text-lg focus:border-fantasy-gold focus:outline-none transition-colors resize-none placeholder-fantasy-text-muted/30 text-center"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div>
                    <label className="block text-fantasy-gold text-xs font-royal tracking-widest mb-4 uppercase text-center">Journey Length</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setStepCount(5)}
                        className={`flex-1 py-4 border font-royal text-xs uppercase tracking-widest transition-all ${stepCount === 5 ? 'border-fantasy-gold text-fantasy-gold bg-fantasy-gold/10' : 'border-fantasy-gold/20 text-fantasy-text-muted hover:border-fantasy-gold/50'}`}
                      >
                        Short Quest (5)
                      </button>
                      <button 
                        onClick={() => setStepCount(10)}
                        className={`flex-1 py-4 border font-royal text-xs uppercase tracking-widest transition-all ${stepCount === 10 ? 'border-fantasy-gold text-fantasy-gold bg-fantasy-gold/10' : 'border-fantasy-gold/20 text-fantasy-text-muted hover:border-fantasy-gold/50'}`}
                      >
                        Epic Saga (10)
                      </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-fantasy-gold text-xs font-royal tracking-widest mb-4 uppercase text-center">Choose Your Hero</label>
                    <div className="relative">
                      <select 
                        value={selectedAvatar}
                        onChange={(e) => setSelectedAvatar(e.target.value as AvatarType)}
                        className="w-full py-4 px-6 bg-fantasy-dark/50 border border-fantasy-gold/20 text-fantasy-text focus:outline-none focus:border-fantasy-gold font-royal text-xs uppercase tracking-widest appearance-none cursor-pointer hover:bg-fantasy-gold/5 transition-colors text-center"
                      >
                        {Object.values(AvatarType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-fantasy-gold pointer-events-none">▼</div>
                    </div>
                 </div>
              </div>

              {error && (
                <div className="bg-red-900/10 border border-red-500/20 p-4 flex items-center justify-center gap-3 text-red-400 font-body text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <GoldButton 
                  onClick={handleCreateQuest}
                  disabled={isGenerating || !taskInput}
                  className="w-full md:w-auto px-16"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sword size={18} />}
                  {isGenerating ? 'Consulting the Oracle...' : 'Embark'}
                </GoldButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveQuest = () => {
    if (!activeQuest) return null;
    const selectedStep = activeQuest.steps[selectedMapStepIndex];

    return (
      <div className="flex flex-col h-screen overflow-hidden bg-fantasy-dark">
        {/* Top Bar */}
        <header className="h-20 border-b border-fantasy-gold/20 bg-fantasy-dark flex items-center px-4 md:px-8 justify-between shrink-0 z-30 relative shadow-md">
           <div className="flex items-center gap-6">
             <button onClick={() => setView('dashboard')} className="p-2 hover:bg-fantasy-blue/50 text-fantasy-gold/70 hover:text-fantasy-gold transition-all rounded-full border border-transparent hover:border-fantasy-gold/30">
               <LayoutDashboard size={20} />
             </button>
             <div className="flex flex-col">
                <span className="text-[10px] text-fantasy-gold font-royal uppercase tracking-widest">Current Quest</span>
                <h1 className="font-royal text-lg text-fantasy-text truncate max-w-[200px] md:max-w-md">{activeQuest.title}</h1>
             </div>
           </div>
           
           <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-fantasy-gold text-[10px] font-royal tracking-widest uppercase mb-1">Progress</span>
               <div className="w-32 h-1 bg-fantasy-blue border border-fantasy-gold/30">
                  <div 
                    className="h-full bg-fantasy-gold shadow-gold-glow"
                    style={{ width: `${(activeQuest.steps.filter(s => s.isCompleted).length / activeQuest.steps.length) * 100}%` }}
                  ></div>
               </div>
             </div>
             <div className="w-12 h-12 rounded-full border border-fantasy-gold/50 flex items-center justify-center text-2xl bg-fantasy-blue shadow-gold-glow">
               {activeQuest.avatar === AvatarType.WARRIOR ? '⚔️' : '🔮'}
             </div>
           </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Main Map Area */}
          <main className="flex-1 overflow-y-auto bg-fantasy-dark relative">
             <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center opacity-20 pointer-events-none grayscale"></div>
             <div className="max-w-5xl mx-auto px-4 min-h-full relative z-10">
               <QuestMap 
                 quest={activeQuest} 
                 onSelectStep={setSelectedMapStepIndex}
                 selectedStepIndex={selectedMapStepIndex}
               />
             </div>
          </main>

          {/* Right Chat Panel */}
          <aside className={`fixed inset-y-0 right-0 w-full md:w-[450px] transform transition-transform duration-500 z-40 md:relative md:transform-none border-l border-fantasy-gold/20 bg-fantasy-blue/95 backdrop-blur-xl ${selectedMapStepIndex !== null ? 'translate-x-0' : 'translate-x-full'}`}>
             <button 
               className="md:hidden absolute top-4 left-4 z-50 bg-fantasy-dark border border-fantasy-gold p-2 text-fantasy-gold rounded-full"
               onClick={() => setSelectedMapStepIndex(-1)} 
             >
               <ChevronRight />
             </button>
             {selectedStep && (
               <ChatPanel 
                 step={selectedStep}
                 questTitle={activeQuest.title}
                 isActiveStep={selectedMapStepIndex === activeQuest.currentStepIndex}
                 isQuestCompleted={activeQuest.isCompleted}
                 onCompleteStep={() => handleCompleteStep(activeQuest.id)}
                 addMessageToStep={(text, role) => addMessageToStep(activeQuest.id, selectedMapStepIndex, text, role)}
               />
             )}
          </aside>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-fantasy-dark text-fantasy-text font-body selection:bg-fantasy-gold selection:text-fantasy-dark">
      {view === 'landing' && renderLanding()}
      {view === 'dashboard' && renderDashboard()}
      {view === 'new-quest' && renderNewQuest()}
      {view === 'active-quest' && renderActiveQuest()}
    </div>
  );
}