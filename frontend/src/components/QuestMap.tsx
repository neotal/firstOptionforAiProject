import React from 'react';
import { Quest, Step, AvatarType } from '../types';
import { Check, Lock, MapPin, Trophy } from 'lucide-react';

interface QuestMapProps {
  quest: Quest;
  onSelectStep: (index: number) => void;
  selectedStepIndex: number;
}

const AvatarIcon = ({ type }: { type: AvatarType }) => {
  const getEmoji = () => {
    switch (type) {
      case AvatarType.SWORDS: return '⚔️';
      case AvatarType.WIZARD_BEARD: return '🧙‍♂️';
      case AvatarType.MAGIC_WAND: return '🪄';
      case AvatarType.THE_WIZARD: return '🎩';
      case AvatarType.CRYSTAL_BALL: return '🔮';
      default: return '🔮';
    }
  };

  return (
    <div className="relative" data-testid="avatar-container">
      <div className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-bounce z-10 relative">
        {getEmoji()}
      </div>
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/50 blur-sm rounded-full"></div>
    </div>
  );
};

export const QuestMap: React.FC<QuestMapProps> = ({ quest, onSelectStep, selectedStepIndex }) => {
  return (
    <div className="relative flex flex-col items-center w-full py-16 space-y-16">
      {/* Background Dashed Path */}
      <div className="absolute left-8 md:left-1/2 -translate-x-1/2 top-20 bottom-20 w-0.5 border-l-2 border-dashed border-fantasy-gold/20 z-0 ml-6 md:ml-0" />
      
      {quest.steps.map((step, index) => {
        const isActive = index === quest.currentStepIndex;
        const isPast = index < quest.currentStepIndex;
        const isSelected = index === selectedStepIndex;

        return (
          <div 
            key={step.id} 
            data-testid={`step-row-${index}`}
            className={`relative z-10 w-full max-w-4xl flex items-center group transition-all duration-300 ${
              index % 2 === 0 ? 'flex-row' : 'flex-row md:flex-row-reverse'
            }`}
          >
            {/* Timeline Node / Waypoint */}
            <div 
              data-testid={`step-node-${index}`}
              className={`
              absolute left-8 md:left-1/2 -translate-x-1/2 ml-6 md:ml-0
              flex flex-col items-center justify-center w-14 h-14 rounded-full
              border-2 transition-all duration-500 bg-fantasy-dark z-20 shadow-lg
              ${isActive 
                ? 'border-fantasy-gold shadow-gold-glow scale-110' 
                : isPast 
                  ? 'border-fantasy-gold/50 bg-fantasy-gold/10' 
                  : 'border-fantasy-text-muted/20 bg-fantasy-primary'
              }
            `}>
               {isPast ? <div className="w-4 h-4 bg-fantasy-gold rounded-full shadow-gold-glow" /> : 
                isActive ? <div className="w-5 h-5 bg-fantasy-gold rotate-45 animate-pulse" /> : 
                <div className="w-2 h-2 bg-fantasy-text-muted/30 rounded-full" />
               }
            </div>

            {/* Avatar positioning */}
            {isActive && !quest.isCompleted && (
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 -top-12 z-30 ml-6 md:ml-0 transition-all duration-500">
                <AvatarIcon type={quest.avatar} />
              </div>
            )}

            {/* Content Card */}
            <div 
              data-testid={`step-card-${index}`}
              onClick={() => onSelectStep(index)}
              className={`ml-36 md:ml-0 w-[calc(100%-120px)] md:w-[46%] cursor-pointer transition-all duration-300 transform ${
                isSelected ? 'scale-105 z-20' : 'scale-100 z-10 hover:scale-102'
              }`}
            >
               <div className={`
                 relative p-6 border transition-all duration-300 rounded-sm shadow-card backdrop-blur-sm
                 ${isSelected 
                    ? 'bg-fantasy-primary/95 border-fantasy-gold shadow-gold-glow' 
                    : isPast
                      ? 'bg-fantasy-primary/60 border-fantasy-gold/20'
                      : 'bg-fantasy-primary/40 border-white/5 hover:bg-fantasy-primary/60 hover:border-white/10'
                 }
               `}>
                  {/* Ornate corner bits if selected */}
                  {isSelected && (
                    <>
                      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-fantasy-gold"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-fantasy-gold"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-fantasy-gold"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-fantasy-gold"></div>
                    </>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-royal text-xs tracking-[0.2em] uppercase font-bold ${isActive || isSelected ? 'text-fantasy-gold' : 'text-fantasy-text-muted'}`}>
                      Step {index + 1}
                    </h3>
                  </div>
                  <p className={`font-body text-base md:text-lg leading-relaxed ${isPast ? 'text-blue-200/60 line-through' : 'text-white'}`}>
                    {step.title}
                  </p>
               </div>
               
               {/* Connector Line for desktop alternate layout */}
               <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-8 h-[1px] bg-fantasy-gold/20 ${
                  index % 2 === 0 ? '-left-8' : '-right-8'
               }`}></div>
            </div>
          </div>
        );
      })}

      {/* Final Trophy */}
      <div className="relative z-10 pt-8 flex flex-col items-center" data-testid="final-trophy">
        <div className={`w-24 h-24 rotate-45 border-2 flex items-center justify-center bg-fantasy-dark transition-all duration-500 shadow-2xl ${
          quest.isCompleted ? 'border-fantasy-gold shadow-gold-glow scale-110' : 'border-fantasy-text-muted/10'
        }`}>
          <div className="-rotate-45">
             <Trophy className={`w-10 h-10 ${quest.isCompleted ? 'text-fantasy-gold drop-shadow-lg' : 'text-fantasy-text-muted/20'}`} />
          </div>
        </div>
        {quest.isCompleted && (
          <div className="absolute -top-12 animate-bounce text-6xl z-20">
            <AvatarIcon type={quest.avatar} />
          </div>
        )}
        <div className="mt-10 px-6 py-2 text-fantasy-gold/60 font-royal text-[10px] tracking-[0.4em] uppercase border-t border-b border-fantasy-gold/10">
            Finish Line
        </div>
      </div>
    </div>
  );
};