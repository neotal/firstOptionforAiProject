
import React, { useState, useRef, useEffect } from 'react';
import { Quest, ViewState, Step, AvatarType, User } from './src/types';
import { createQuest, fetchQuests, toggleStepCompletion, sendChatMessage } from './services/geminiService';
import { loginUser, registerUser } from './services/authService';
import { QuestMap } from './src/components/QuestMap';
import { ChatPanel } from './src/components/ChatPanel';
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
  Image as ImageIcon,
  LogOut,
  User as UserIcon,
  Lock,
  Calendar
} from 'lucide-react';

// --- Fantasy Components ---

const WizardHatIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Brim */}
    <path d="M2 21h20c-2-3-3.5-4-8-4s-6 1-8 4z" /> 
    {/* Cone/Hat Body - crumpled look */}
    <path d="M6.5 17c0-5 2-8 3-10l-1-3c2-2 5-2 6 0l2 4c0 4 2 6 2 9" />
    {/* Band/Buckle area */}
    <path d="M7 16c3-1 8-1 11 0" />
    {/* Tip bend */}
    <path d="M8.5 4c1.5-2 4-2 6 0" />
  </svg>
);

const Divider = () => (
  <div className="flex items-center justify-center w-full py-8 opacity-60">
    <div className="h-[1px] bg-gradient-to-r from-transparent via-fantasy-gold to-transparent w-full max-w-xs"></div>
    <div className="mx-4 text-fantasy-gold transform rotate-45 border border-fantasy-gold w-3 h-3 bg-fantasy-dark shadow-gold-glow"></div>
    <div className="h-[1px] bg-gradient-to-r from-transparent via-fantasy-gold to-transparent w-full max-w-xs"></div>
  </div>
);

const GoldButton = ({ onClick, children, disabled, className = "", type = "button" }: any) => (
  <button 
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`
      relative group px-8 py-3 overflow-hidden rounded-sm w-full md:w-auto
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

const FantasyInput = ({ label, type, value, onChange, placeholder, required = false, icon: Icon }: any) => (
  <div className="mb-6">
    <label className="block text-fantasy-gold text-xs font-royal tracking-[0.15em] mb-2 uppercase opacity-90">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-fantasy-dark/60 border border-fantasy-gold/30 px-4 py-3 pl-10 text-white font-body focus:outline-none focus:border-fantasy-gold focus:shadow-gold-glow transition-all rounded-sm placeholder-white/20"
      />
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-fantasy-gold/50" size={16} />}
    </div>
  </div>
);

const Logo = () => (
  <div className="flex flex-col items-center select-none group cursor-pointer p-2">
    <div className="flex items-center gap-3 text-fantasy-gold mb-1">
      <div className="relative">
        <WizardHatIcon size={40} className="text-fantasy-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
        <div className="absolute -top-1 -right-1 text-white animate-pulse"><Sparkles size={12} /></div>
      </div>
      <span className="font-royal font-bold text-3xl tracking-[0.15em] text-white gold-text-shadow bg-clip-text text-transparent bg-gradient-to-b from-fantasy-gold-light to-fantasy-gold">
        JOURNEYFY
      </span>
    </div>
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mt-1"></div>
  </div>
);

const getAvatarEmoji = (type: AvatarType) => {
  switch (type) {
    case AvatarType.SWORDS: return '⚔️';
    case AvatarType.WIZARD_BEARD: return '🧙‍♂️';
    case AvatarType.MAGIC_WAND: return '🪄';
    case AvatarType.THE_WIZARD: return '🎩';
    case AvatarType.CRYSTAL_BALL: return '🔮';
    default: return '🔮';
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  
  // Auth Form State
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '', birthYear: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // New Quest Form State
  const [taskInput, setTaskInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stepCount, setStepCount] = useState<5 | 10>(5);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(AvatarType.CRYSTAL_BALL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Quest UI State
  const [selectedMapStepIndex, setSelectedMapStepIndex] = useState<number>(0);
  
  const activeQuest = quests.find(q => q.id === activeQuestId);

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchQuests(currentUser.id)
        .then(data => setQuests(data))
        .catch(err => console.error("Could not load quests:", err));
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await loginUser(authForm.username, authForm.password);
      setCurrentUser(user);
      setView('landing'); // Or dashboard directly
      setAuthForm({ username: '', password: '', name: '', birthYear: '' });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await registerUser(authForm.username, authForm.password, authForm.name, authForm.birthYear);
      setCurrentUser(user);
      setView('landing');
      setAuthForm({ username: '', password: '', name: '', birthYear: '' });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setQuests([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateQuest = async () => {
    if ((!taskInput.trim() && !selectedFile) || !currentUser) return;
    setIsGenerating(true);
    setError(null);

    try {
      const newQuest = await createQuest(taskInput, stepCount, currentUser.id, selectedFile, selectedAvatar);
      
      setQuests(prev => [newQuest, ...prev]);
      setActiveQuestId(newQuest.id);
      setSelectedMapStepIndex(0);
      setView('active-quest');
      setTaskInput('');
      setSelectedFile(null);
    } catch (e) {
      console.error(e);
      setError("We couldn't generate the quest plan. Is the server running?");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStepCompletion = async (questId: string, stepIndex: number) => {
    try {
      const updatedQuest = await toggleStepCompletion(questId, stepIndex);
      
      setQuests(prev => prev.map(q => q.id === questId ? updatedQuest : q));

      if (updatedQuest.steps[stepIndex].isCompleted) {
        const nextIdx = stepIndex + 1;
        if (nextIdx < updatedQuest.steps.length) {
          setSelectedMapStepIndex(nextIdx);
        }
      }
    } catch (e) {
      console.error("Failed to toggle step", e);
    }
  };

  const handleAddMessageToStep = async (questId: string, stepIndex: number, text: string, role: 'user' | 'model') => {
    if (role === 'model') return;

    // Optimistic
    setQuests(prev => prev.map(q => {
      if (q.id !== questId) return q;
      const updatedSteps = [...q.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        chatHistory: [...updatedSteps[stepIndex].chatHistory, { role: 'user', text, timestamp: Date.now() }]
      };
      return { ...q, steps: updatedSteps };
    }));

    try {
      const updatedHistory = await sendChatMessage(questId, stepIndex, text);

      // Update with server response
      setQuests(prev => prev.map(q => {
        if (q.id !== questId) return q;
        const updatedSteps = [...q.steps];
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          chatHistory: updatedHistory
        };
        return { ...q, steps: updatedSteps };
      }));
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  // --- Views ---

  const renderAuthBackground = () => (
    <>
      <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center bg-no-repeat bg-fixed opacity-60 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-fantasy-dark via-fantasy-dark/50 to-transparent z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 z-0 animate-pulse"></div>
    </>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-fantasy-dark p-4">
      {renderAuthBackground()}
      
      <div className="w-full max-w-md bg-fantasy-primary/90 border border-fantasy-gold/30 p-8 rounded-sm backdrop-blur-md shadow-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-8"><Logo /></div>
        
        <h2 className="text-center text-white font-royal text-xl mb-6 tracking-widest uppercase">Enter the Realm</h2>

        <form onSubmit={handleLogin}>
          <FantasyInput 
            label="Username" 
            type="text" 
            placeholder="Enter your hero name"
            value={authForm.username}
            onChange={(e: any) => setAuthForm({...authForm, username: e.target.value})}
            required
            icon={UserIcon}
          />
          <FantasyInput 
            label="Password" 
            type="password" 
            placeholder="Secret runes..."
            value={authForm.password}
            onChange={(e: any) => setAuthForm({...authForm, password: e.target.value})}
            required
            icon={Lock}
          />

          {authError && (
             <div className="mb-4 text-red-300 text-xs font-royal tracking-wide bg-red-900/20 border border-red-500/30 p-3 rounded flex items-center gap-2">
               <AlertCircle size={14} /> {authError}
             </div>
          )}

          <GoldButton 
            type="submit" 
            className="w-full mt-2" 
            disabled={isAuthLoading || !authForm.username || !authForm.password}
          >
             {isAuthLoading ? <Loader2 className="animate-spin" /> : 'Login'}
          </GoldButton>
        </form>

        <div className="mt-8 text-center border-t border-fantasy-gold/10 pt-4">
          <p className="text-fantasy-text-muted text-sm font-body mb-2">New to the guild?</p>
          <button 
            onClick={() => { setView('register'); setAuthError(null); setAuthForm({username:'', password:'', name:'', birthYear:''}); }}
            className="text-fantasy-gold hover:text-white font-royal text-xs uppercase tracking-widest transition-colors hover:underline underline-offset-4"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-fantasy-dark p-4">
      {renderAuthBackground()}
      
      <div className="w-full max-w-md bg-fantasy-primary/90 border border-fantasy-gold/30 p-8 rounded-sm backdrop-blur-md shadow-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-8"><Logo /></div>
        
        <h2 className="text-center text-white font-royal text-xl mb-6 tracking-widest uppercase">Join the Guild</h2>

        <form onSubmit={handleRegister}>
          <FantasyInput 
            label="Hero Name (Username)" 
            type="text" 
            placeholder="Choose your identifier"
            value={authForm.username}
            onChange={(e: any) => setAuthForm({...authForm, username: e.target.value})}
            required
            icon={UserIcon}
          />
          <FantasyInput 
            label="Secret Password" 
            type="password" 
            placeholder="Protect your account"
            value={authForm.password}
            onChange={(e: any) => setAuthForm({...authForm, password: e.target.value})}
            required
            icon={Lock}
          />
          <FantasyInput 
            label="Real Name" 
            type="text" 
            placeholder="How shall we call you?"
            value={authForm.name}
            onChange={(e: any) => setAuthForm({...authForm, name: e.target.value})}
            required
            icon={Scroll}
          />
          <FantasyInput 
            label="Birth Year (Optional)" 
            type="number" 
            placeholder="e.g. 1995"
            value={authForm.birthYear}
            onChange={(e: any) => setAuthForm({...authForm, birthYear: e.target.value})}
            icon={Calendar}
          />

          {authError && (
             <div className="mb-4 text-red-300 text-xs font-royal tracking-wide bg-red-900/20 border border-red-500/30 p-3 rounded flex items-center gap-2">
               <AlertCircle size={14} /> {authError}
             </div>
          )}

          <GoldButton 
            type="submit" 
            className="w-full mt-2" 
            disabled={isAuthLoading || !authForm.username || !authForm.password || !authForm.name}
          >
             {isAuthLoading ? <Loader2 className="animate-spin" /> : 'Register'}
          </GoldButton>
        </form>

        <div className="mt-8 text-center border-t border-fantasy-gold/10 pt-4">
          <p className="text-fantasy-text-muted text-sm font-body mb-2">Already a member?</p>
          <button 
            onClick={() => { setView('login'); setAuthError(null); setAuthForm({username:'', password:'', name:'', birthYear:''}); }}
            className="text-fantasy-gold hover:text-white font-royal text-xs uppercase tracking-widest transition-colors hover:underline underline-offset-4"
          >
            Login Here
          </button>
        </div>
      </div>
    </div>
  );

  const renderLanding = () => (
    <div className="flex flex-col min-h-screen relative bg-fantasy-dark overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-mountain-hero bg-cover bg-center bg-no-repeat bg-fixed opacity-70 z-0"></div>
      <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 z-0 animate-pulse"></div>

      <nav className="p-8 flex justify-between items-center z-10 relative">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-fantasy-gold text-[10px] font-royal uppercase tracking-widest">Logged in as</div>
            <div className="text-white font-body">{currentUser?.name}</div>
          </div>
          <GoldButton onClick={() => setView('dashboard')}>Enter App</GoldButton>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="max-w-4xl space-y-10 animate-[fadeIn_1s_ease-out] bg-fantasy-dark/40 p-12 rounded-2xl backdrop-blur-sm border border-white/5 shadow-2xl">
           <div className="space-y-4">
             <h1 className="text-5xl md:text-7xl font-royal font-bold text-white mb-2 drop-shadow-lg tracking-wide">
               Gamify Your <span className="text-fantasy-gold">Tasks</span>
             </h1>
             <p className="text-lg md:text-xl text-blue-200 font-royal tracking-widest uppercase opacity-80">
               Turn big projects into easy steps with AI
             </p>
           </div>
           
           <Divider />
           
           <p className="text-xl text-fantasy-text font-body max-w-2xl mx-auto leading-relaxed drop-shadow-md">
             Break down overwhelming tasks into an epic journey. <br/>
             Get a personal AI guide, track progress, and reach your goals.
           </p>

           <div className="pt-8">
             <GoldButton onClick={() => setView('dashboard')} className="px-12 py-5 text-lg border-2 bg-fantasy-dark/80 hover:bg-fantasy-gold/20">
               Get Started
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
                <span className="text-fantasy-gold text-xs font-royal tracking-widest uppercase">Hero</span>
                <span className="text-white font-body text-lg font-bold">{currentUser?.name}</span>
             </div>
             
             <div className="w-12 h-12 rounded-full border-2 border-fantasy-gold/30 bg-fantasy-primary flex items-center justify-center text-fantasy-gold shadow-gold-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-fantasy-gold/10 group-hover:bg-fantasy-gold/20 transition-colors"></div>
                <WizardHatIcon size={24} />
             </div>
             
             <button onClick={handleLogout} className="text-fantasy-text-muted hover:text-red-400 transition-colors ml-2" title="Logout">
               <LogOut size={20} />
             </button>
          </div>
       </nav>

       <div className="max-w-7xl mx-auto w-full py-12 px-6 flex-1 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-fantasy-gold/20 pb-6 gap-4">
            <div>
              <h2 className="text-4xl font-royal text-white mb-2 gold-text-shadow">My Quests</h2>
              <p className="text-blue-200 font-body text-lg">Manage your ongoing and completed projects.</p>
            </div>
            <GoldButton onClick={() => setView('new-quest')}>
              <Plus size={16} /> New Quest
            </GoldButton>
          </div>

          {quests.length === 0 ? (
            <div className="border border-fantasy-gold/20 bg-fantasy-primary/60 p-24 text-center rounded-lg relative overflow-hidden group backdrop-blur-sm shadow-card max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="w-20 h-20 bg-fantasy-dark/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-fantasy-gold/30">
                 <Scroll className="w-10 h-10 text-fantasy-gold/70" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-royal text-white mb-3">No Quests Yet</h3>
              <p className="text-blue-200 mb-8 font-body leading-relaxed">
                It looks like you haven't started any quests yet. <br/>
                Create a new one to begin your journey!
              </p>
              <button onClick={() => setView('new-quest')} className="text-fantasy-gold hover:text-white transition-colors font-royal tracking-widest text-sm border-b border-fantasy-gold pb-1 hover:border-white">
                Start a Quest
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
                      {quest.isCompleted ? 'Completed' : 'In Progress'}
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
                    <span>{quest.steps.length} Steps</span>
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
            <ChevronRight className="rotate-180" size={14} /> Back to My Quests
          </button>
          
          <div className="bg-fantasy-primary/90 border border-fantasy-gold/20 p-10 md:p-16 relative backdrop-blur-xl shadow-2xl rounded-sm">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-fantasy-gold/30"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-fantasy-gold/30"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-fantasy-gold/30"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-fantasy-gold/30"></div>

            <div className="text-center mb-10">
               <h2 className="text-3xl font-royal text-fantasy-gold mb-2">Create New Quest</h2>
               <p className="text-blue-200 font-body">Tell us about your task, and we'll break it down for you.</p>
            </div>
            
            <div className="space-y-12">
              <div>
                <label className="block text-white text-xs font-royal tracking-[0.2em] mb-4 uppercase text-center opacity-80">Task Description</label>
                <div className="relative">
                  <textarea 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="What do you need to get done? (e.g. 'Learn React', 'Clean the garage', 'Plan a vacation')"
                    className="w-full h-40 bg-fantasy-dark/50 border border-fantasy-gold/20 p-6 text-white font-body text-lg focus:border-fantasy-gold/60 focus:ring-1 focus:ring-fantasy-gold/30 focus:outline-none transition-all resize-none placeholder-white/20 text-center rounded-md"
                  />
                  
                  {/* File Upload Button inside Textarea */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-4 right-4 p-2 text-fantasy-gold/60 hover:text-fantasy-gold hover:bg-fantasy-gold/10 rounded-full transition-all"
                    title="Attach PDF or Image"
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
                    <label className="block text-white text-xs font-royal tracking-[0.2em] mb-4 uppercase text-center opacity-80">Quest Length</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setStepCount(5)}
                        className={`flex-1 py-5 border rounded-sm font-royal text-xs uppercase tracking-widest transition-all ${stepCount === 5 ? 'border-fantasy-gold text-fantasy-gold bg-fantasy-gold/10 shadow-gold-glow' : 'border-fantasy-gold/10 text-fantasy-text-muted hover:border-fantasy-gold/30 hover:bg-white/5'}`}
                      >
                        Quick (5 Steps)
                      </button>
                      <button 
                        onClick={() => setStepCount(10)}
                        className={`flex-1 py-5 border rounded-sm font-royal text-xs uppercase tracking-widest transition-all ${stepCount === 10 ? 'border-fantasy-gold text-fantasy-gold bg-fantasy-gold/10 shadow-gold-glow' : 'border-fantasy-gold/10 text-fantasy-text-muted hover:border-fantasy-gold/30 hover:bg-white/5'}`}
                      >
                        Detailed (10 Steps)
                      </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-white text-xs font-royal tracking-[0.2em] mb-4 uppercase text-center opacity-80">Choose Hero</label>
                    <div className="relative group">
                      <select 
                        value={selectedAvatar}
                        onChange={(e) => setSelectedAvatar(e.target.value as AvatarType)}
                        className="w-full py-5 px-6 bg-fantasy-dark/50 border border-fantasy-gold/20 text-white focus:outline-none focus:border-fantasy-gold/50 font-royal text-xs uppercase tracking-widest appearance-none cursor-pointer hover:bg-fantasy-dark/70 transition-colors text-center rounded-sm"
                      >
                        <option value={AvatarType.CRYSTAL_BALL}>Crystal Ball</option>
                        <option value={AvatarType.WIZARD_BEARD}>Wizard (Bearded)</option>
                        <option value={AvatarType.MAGIC_WAND}>Magic Wand</option>
                        <option value={AvatarType.THE_WIZARD}>The Wizard</option>
                        <option value={AvatarType.SWORDS}>Dual Swords</option>
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
                  {isGenerating ? 'Generating...' : 'Start Quest'}
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
                <span className="text-[10px] text-fantasy-gold font-royal uppercase tracking-widest opacity-80">Current Quest</span>
                <h1 className="font-royal text-lg text-white tracking-wide truncate max-w-[200px] md:max-w-md">{activeQuest.title}</h1>
             </div>
           </div>
           
           <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-fantasy-gold text-[10px] font-royal tracking-widest uppercase mb-1 opacity-80">Progress</span>
               <div className="w-32 h-1.5 bg-fantasy-primary rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-fantasy-gold-dim to-fantasy-gold shadow-gold-glow"
                    style={{ width: `${(activeQuest.steps.filter(s => s.isCompleted).length / activeQuest.steps.length) * 100}%` }}
                  ></div>
               </div>
             </div>
             <div className="w-10 h-10 rounded-full border border-fantasy-gold/40 flex items-center justify-center text-xl bg-fantasy-primary shadow-blue-glow">
               {getAvatarEmoji(activeQuest.avatar)}
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
                 onToggleCompletion={() => handleToggleStepCompletion(activeQuest.id, selectedMapStepIndex)}
                 addMessageToStep={(text, role) => handleAddMessageToStep(activeQuest.id, selectedMapStepIndex, text, role)}
               />
             )}
          </aside>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-fantasy-dark text-fantasy-text font-body selection:bg-fantasy-gold selection:text-fantasy-dark">
      {view === 'login' && renderLogin()}
      {view === 'register' && renderRegister()}
      {view === 'landing' && renderLanding()}
      {view === 'dashboard' && renderDashboard()}
      {view === 'new-quest' && renderNewQuest()}
      {view === 'active-quest' && renderActiveQuest()}
    </div>
  );
}
