import React, { useState, useRef } from 'react';
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
  Sparkles,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

const MOCK_USER = {
  name: "Traveler",
  level: 5,
  xp: 2400
};

// --- Fantasy Components ---

const WizardHatIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 22h20" />
    <path d="M12 2L4.5 22" />
    <path d="M12 2l7.5 20" />
    <path d="M12 2l3 9h-6l3-9" />
    <path d="M6 16h12" /> 
  </svg>
);

const Divider = () => (
  <div className="flex items-center justify-center w-full py-8 opacity-60">
    <div className="h-[1px] bg-gradient-to-r from-transparent via-fantasy-gold to-transparent w-full max-w-xs"></div>
    <div className="mx-4 text-fantasy-gold transform rotate-45 border border-fantasy-gold w-3 h-3 bg-fantasy-dark shadow-gold-glow"></div>
    <div className="h-[1px] bg-gradient-to-r from-transparent via-fantasy-gold to-transparent w-full max-w-xs"></div>
  </div>
);

const GoldButton = ({ onClick, children, disabled, className = "" }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`
      relative group px-8 py-3 overflow-hidden rounded-sm
      border border-fantasy-gold/40 bg-fantasy-primary/50 backdrop-blur-sm
      text-fantasy-gold font-royal tracking-[0.15em] uppercase text-sm font-bold
      hover:border-fantasy-gold hover:text-white hover:shadow-gold-glow hover:bg-fantasy-gold/20
      transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    <div className="absolute inset-0 w-0 bg-fantasy-gold/10 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
    <span className="relative flex items-center justify-center gap-2">{children}</span>
  </button>
);

const Logo = () => (
  <div className="flex flex-col items-center select-none group cursor-pointer p-2">
    <div className="flex items-center gap-3 text-fantasy-gold mb-1">
      <div className="relative">
        <WizardHatIcon size={32} className="text-fantasy-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
        <div className="absolute -top-1 -right-1 text-white animate-pulse"><Sparkles size={12} /></div>
      </div>
      <span className="font-royal font-bold text-3xl tracking-[0.15em] text-white gold-text-shadow bg-clip-text text-transparent bg-gradient-to-b from-fantasy-gold-light to-fantasy-gold">
        JOURNEYFY
      </span>
    </div>
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mt-1"></div>
  </div>
);

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  
  // New Quest Form State
  const [taskInput, setTaskInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stepCount, setStepCount] = useState<5 | 10>(5);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(AvatarType.WARRIOR);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Quest UI State
  const [selectedMapStepIndex, setSelectedMapStepIndex] = useState<number>(0);

  const activeQuest = quests.find(q => q.id === activeQuestId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateQuest = async () => {
    if (!taskInput.trim() && !selectedFile) return;
    setIsGenerating(true);
    setError(null);

    try {
      const breakdown = await generateQuestBreakdown(taskInput, stepCount, selectedFile);
      
      const newQuest: Quest = {
        id: crypto.randomUUID(),
        title: breakdown.title,
        originalTask: taskInput || (selectedFile ? `Analyze ${selectedFile.name}` : 'New Quest'),
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
      setSelectedFile(null);
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
    <div className="flex flex-col min-h-screen relative bg-fantasy-dark overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center bg-no-repeat bg-fixed opacity-70 z-0"></div>
      <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 z-0 animate-pulse"></div>

      <nav className="p-8 flex justify-between items-center z-10 relative">
        <Logo />
        <GoldButton onClick={() => setView('dashboard')}>Open Grimoire</GoldButton>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="max-w-4xl space-y-10 animate-[fadeIn_1s_ease-out] bg-fantasy-dark/40 p-12 rounded-2xl backdrop-blur-sm border border-white/5 shadow-2xl">
           <div className="space-y-4">
             <h1 className="text-5xl md:text-7xl font-royal font-bold text-white mb-2 drop-shadow-lg tracking-wide">
               Master Your <span className="text-fantasy-gold">Journey</span>
             </h1>
             <p className="text-lg md:text-xl text-blue-200 font-royal tracking-widest uppercase opacity-80">
               Gamified Productivity for the Modern Mage
             </p>
           </div>
           
           <Divider />
           
           <p className="text-xl text-fantasy-text font-body max-w-2xl mx-auto leading-relaxed drop-shadow-md">
             Transform mundane tasks into epic quests. <br/>
             Consult the Oracle, gain XP, and conquer your to-do list.
           </p>

           <div className="pt-8">
             <GoldButton onClick={() => setView('dashboard')} className="px-12 py-5 text-lg border-2 bg-fantasy-dark/80 hover:bg-fantasy-gold/20">
               Summon Your Quests
             </GoldButton>
           </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen flex flex-col bg-fantasy-dark relative">
       {/* Background */}
       <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center opacity-30 fixed"></div>
       <div className="absolute inset-0 bg-gradient-to-b from-fantasy-dark via-blue-900/20 to-fantasy-dark fixed"></div>
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 fixed pointer-events-none"></div>

       <nav className="h-24 border-b border-fantasy-gold/10 bg-fantasy-dark/95 backdrop-blur-md flex items-center px-8 justify-between shrink-0 sticky top-0 z-40 shadow-lg">
          <div onClick={() => setView('landing')}><Logo /></div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-fantasy-gold text-xs font-royal tracking-widest uppercase">Mage Level</span>
                <span className="text-white font-body text-lg font-bold">{MOCK_USER.level}</span>
             </div>
             <div className="w-12 h-12 rounded-full border-2 border-fantasy-gold/30 bg-fantasy-primary flex items-center justify-center text-fantasy-gold shadow-gold-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-fantasy-gold/10 group-hover:bg-fantasy-gold/20 transition-colors"></div>
                <WizardHatIcon size={20} />
             </div>
          </div>
       </nav>

       <div className="max-w-7xl mx-auto w-full py-12 px-6 flex-1 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-fantasy-gold/20 pb-6 gap-4">
            <div>
              <h2 className="text-4xl font-royal text-white mb-2 gold-text-shadow">Quest Board</h2>
              <p className="text-blue-200 font-body text-lg">Your active scrolls and completed chronicles.</p>
            </div>
            <GoldButton onClick={() => setView('new-quest')}>
              <Plus size={16} /> Inscribe New Quest
            </GoldButton>
          </div>

          {quests.length === 0 ? (
            <div className="border border-fantasy-gold/20 bg-fantasy-primary/60 p-24 text-center rounded-lg relative overflow-hidden group backdrop-blur-sm shadow-card max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="w-20 h-20 bg-fantasy-dark/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-fantasy-gold/30">
                 <Scroll className="w-10 h-10 text-fantasy-gold/70" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-royal text-white mb-3">Your Chronicle is Empty</h3>
              <p className="text-blue-200 mb-8 font-body leading-relaxed">
                The pages are blank. A hero must act to create history. <br/>
                What challenge awaits you today?
              </p>
              <button onClick={() => setView('new-quest')} className="text-fantasy-gold hover:text-white transition-colors font-royal tracking-widest text-sm border-b border-fantasy-gold pb-1 hover:border-white">
                Start a Journey
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {quests.map(quest => (
                <div 
                  key={quest.id} 
                  onClick={() => {
                    setActiveQuestId(quest.id);
                    setSelectedMapStepIndex(quest.currentStepIndex);
                    setView('active-quest');
                  }}
                  className="relative bg-fantasy-primary/80 border border-fantasy-gold/10 p-8 cursor-pointer transition-all hover:-translate-y-1 hover:border-fantasy-gold/50 hover:shadow-gold-glow group rounded-md overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fantasy-gold/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1 font-royal text-[10px] tracking-widest border rounded-full uppercase font-bold ${quest.isCompleted ? 'border-green-500/30 text-green-400 bg-green-900/20' : 'border-blue-400/30 text-blue-300 bg-blue-900/20'}`}>
                      {quest.isCompleted ? 'Fulfilled' : 'In Progress'}
                    </div>
                    <Gem className="text-fantasy-gold opacity-60 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                  </div>
                  
                  <h3 className="text-xl font-royal mb-4 text-white group-hover:text-fantasy-gold transition-colors truncate leading-tight">{quest.title}</h3>
                  
                  <div className="w-full bg-fantasy-dark border border-white/5 h-2 rounded-full mb-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${quest.isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-fantasy-gold-dim to-fantasy-gold'}`}
                      style={{ width: `${(quest.steps.filter(s => s.isCompleted).length / quest.steps.length) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-blue-300 font-body opacity-80">
                    <span>{quest.steps.length} Phases</span>
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
       {/* Background */}
       <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center opacity-20 fixed"></div>
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 fixed pointer-events-none"></div>

      <nav className="p-6 border-b border-fantasy-gold/10 bg-fantasy-dark/95 z-10 flex justify-center backdrop-blur-md sticky top-0">
         <Logo />
      </nav>
      
      <div className="flex-1 flex items-center justify-center p-4 z-10 py-12">
        <div className="max-w-4xl w-full">
          <button onClick={() => setView('dashboard')} className="text-fantasy-gold/70 hover:text-fantasy-gold mb-8 flex items-center gap-2 font-royal text-xs uppercase tracking-widest transition-colors pl-2">
            <ChevronRight className="rotate-180" size={14} /> Back to Board
          </button>
          
          <div className="bg-fantasy-primary/90 border border-fantasy-gold/20 p-10 md:p-16 relative backdrop-blur-xl shadow-2xl rounded-sm">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-fantasy-gold/30"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fantasy-gold/30"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-fantasy-gold/30"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-fantasy-gold/30"></div>

            <div className="text-center mb-10">
               <h2 className="text-3xl font-royal text-fantasy-gold mb-2">Inscription Ritual</h2>
               <p className="text-blue-200 font-body">Define the parameters of your next undertaking.</p>
            </div>
            
            <div className="space-y-12">
              <div>
                <label className="block text-white text-xs font-royal tracking-[0.2em] mb-4 uppercase text-center opacity-80">Describe Your Mission</label>
                <div className="relative">
                  <textarea 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="What feat must be accomplished? (e.g. 'Learn React Hooks', 'Clean the garage', 'Plan a vacation')"
                    className="w-full h-40 bg-fantasy-dark/50 border border-fantasy-gold/20 p-6 text-white font-body text-lg focus:border-fantasy-gold/60 focus:ring-1 focus:ring-fantasy-gold/30 focus:outline-none transition-all resize-none placeholder-white/20 text-center rounded-md"
                  />
                  
                  {/* File Upload Button inside Textarea */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-4 right-4 p-2 text-fantasy-gold/60 hover:text-fantasy-gold hover:bg-fantasy-gold/10 rounded-full transition-all"
                    title="Attach Tome (PDF) or Vision (Image)"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*,application/pdf"
                  />

                  {/* Selected File Display */}
                  {selectedFile && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-fantasy-dark/90 px-3 py-1.5 rounded-full border border-fantasy-gold/30 shadow-lg animate-[fadeIn_0.3s_ease-out]">
                      {selectedFile.type.includes('pdf') ? <FileText size={14} className="text-fantasy-gold"/> : <ImageIcon size={14} className="text-fantasy-gold"/>}
                      <span className="text-xs text-white/90 truncate max-w-[150px] font-body">{selectedFile.name}</span>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="ml-1 text-fantasy-text-muted hover:text-red-400 transition-colors"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <label className="block text-white text-xs font-royal tracking-[0.2em] mb-4 uppercase text-center opacity-80">Quest Duration</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setStepCount(5)}
                        className={`flex-1 py-5 border rounded-sm font-royal text-xs uppercase tracking-widest transition-all ${stepCount === 5 ? 'border-fantasy-gold text-fantasy-gold bg-fantasy-gold/10 shadow-gold-glow' : 'border-fantasy-gold/10 text-fantasy-text-muted hover:border-fantasy-gold/30 hover:bg-white/5'}`}
                      >
                        Short (5 Steps)
                      </button>
                      <button 
                        onClick={() => setStepCount(10)}
                        className={`flex-1 py-5 border rounded-sm font-royal text-xs uppercase tracking-widest transition-all ${stepCount === 10 ? 'border-fantasy-gold text-fantasy-gold bg-fantasy-gold/10 shadow-gold-glow' : 'border-fantasy-gold/10 text-fantasy-text-muted hover:border-fantasy-gold/30 hover:bg-white/5'}`}
                      >
                        Epic (10 Steps)
                      </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-white text-xs font-royal tracking-[0.2em] mb-4 uppercase text-center opacity-80">Select Avatar</label>
                    <div className="relative group">
                      <select 
                        value={selectedAvatar}
                        onChange={(e) => setSelectedAvatar(e.target.value as AvatarType)}
                        className="w-full py-5 px-6 bg-fantasy-dark/50 border border-fantasy-gold/20 text-white focus:outline-none focus:border-fantasy-gold/50 font-royal text-xs uppercase tracking-widest appearance-none cursor-pointer hover:bg-fantasy-dark/70 transition-colors text-center rounded-sm"
                      >
                        {Object.values(AvatarType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-fantasy-gold/50 pointer-events-none group-hover:text-fantasy-gold transition-colors">▼</div>
                    </div>
                 </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-center justify-center gap-3 text-red-300 font-body text-sm rounded-md">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-center pt-6">
                <GoldButton 
                  onClick={handleCreateQuest}
                  disabled={isGenerating || (!taskInput && !selectedFile)}
                  className="w-full md:w-auto px-20 py-5 text-base"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {isGenerating ? 'Divining Path...' : 'Begin Journey'}
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
        <header className="h-20 border-b border-fantasy-gold/10 bg-fantasy-dark/95 backdrop-blur flex items-center px-4 md:px-8 justify-between shrink-0 z-30 relative shadow-lg">
           <div className="flex items-center gap-6">
             <button onClick={() => setView('dashboard')} className="p-2 hover:bg-fantasy-primary text-fantasy-gold/70 hover:text-fantasy-gold transition-all rounded-full border border-transparent hover:border-fantasy-gold/30">
               <LayoutDashboard size={20} />
             </button>
             <div className="flex flex-col">
                <span className="text-[10px] text-fantasy-gold font-royal uppercase tracking-widest opacity-80">Current Journey</span>
                <h1 className="font-royal text-lg text-white tracking-wide truncate max-w-[200px] md:max-w-md">{activeQuest.title}</h1>
             </div>
           </div>
           
           <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-fantasy-gold text-[10px] font-royal tracking-widest uppercase mb-1 opacity-80">Completion</span>
               <div className="w-32 h-1.5 bg-fantasy-primary rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-fantasy-gold-dim to-fantasy-gold shadow-gold-glow"
                    style={{ width: `${(activeQuest.steps.filter(s => s.isCompleted).length / activeQuest.steps.length) * 100}%` }}
                  ></div>
               </div>
             </div>
             <div className="w-10 h-10 rounded-full border border-fantasy-gold/40 flex items-center justify-center text-xl bg-fantasy-primary shadow-blue-glow">
               {activeQuest.avatar === AvatarType.WARRIOR ? '⚔️' : '🔮'}
             </div>
           </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Main Map Area */}
          <main className="flex-1 overflow-y-auto bg-fantasy-dark relative">
             <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center opacity-40 fixed grayscale-[30%]"></div>
             <div className="absolute inset-0 bg-blue-mist fixed"></div>
             
             <div className="max-w-5xl mx-auto px-4 min-h-full relative z-10 py-8">
               <QuestMap 
                 quest={activeQuest} 
                 onSelectStep={setSelectedMapStepIndex}
                 selectedStepIndex={selectedMapStepIndex}
               />
             </div>
          </main>

          {/* Right Chat Panel */}
          <aside className={`fixed inset-y-0 right-0 w-full md:w-[450px] transform transition-transform duration-500 z-40 md:relative md:transform-none border-l border-fantasy-gold/10 bg-fantasy-primary/95 backdrop-blur-xl shadow-2xl ${selectedMapStepIndex !== null ? 'translate-x-0' : 'translate-x-full'}`}>
             <button 
               className="md:hidden absolute top-4 left-4 z-50 bg-fantasy-dark border border-fantasy-gold p-2 text-fantasy-gold rounded-full shadow-lg"
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