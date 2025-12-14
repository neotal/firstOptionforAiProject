import React from 'react';
import { Quest, Step, AvatarType } from '../types';
import { Check, Lock, MapPin, Trophy } from 'lucide-react';

interface QuestMapProps {
  quest: Quest;
  onSelectStep: (index: number) => void;
  selectedStepIndex: number;
}

const AvatarIcon = ({ type }: { type: AvatarType }) => {
  return (
    <div className="relative">
      <div className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-bounce z-10 relative">
        {type === AvatarType.WARRIOR ? '⚔️' : '🔮'}
      </div>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/50 blur-sm rounded-full"></div>
    </div>
  );
};

export const QuestMap: React.FC<QuestMapProps> = ({ quest, onSelectStep, selectedStepIndex }) => {
  return (
    <div className="relative flex flex-col items-center w-full py-16 space-y-12">
      {/* Background Dashed Path */}
      <div className="absolute left-8 md:left-1/2 -translate-x-1/2 top-20 bottom-20 w-1 border-l-2 border-dashed border-fantasy-gold/30 z-0 ml-6 md:ml-0" />
      
      {quest.steps.map((step, index) => {
        const isActive = index === quest.currentStepIndex;
        const isPast = index < quest.currentStepIndex;
        const isSelected = index === selectedStepIndex;

        return (
          <div 
            key={step.id} 
            className={`relative z-10 w-full max-w-4xl flex items-center group transition-all duration-300 ${
              index % 2 === 0 ? 'flex-row' : 'flex-row md:flex-row-reverse'
            }`}
          >
            {/* Timeline Node / Waypoint */}
            <div className={`
              absolute left-8 md:left-1/2 -translate-x-1/2 ml-6 md:ml-0
              flex flex-col items-center justify-center w-14 h-14 rounded-full
              border-2 transition-all duration-500 bg-fantasy-dark
              ${isActive 
                ? 'border-fantasy-gold shadow-gold-glow scale-110 z-20' 
                : isPast 
                  ? 'border-fantasy-gold/50 bg-fantasy-gold/10' 
                  : 'border-fantasy-text-muted/20 bg-fantasy-dark'
              }
            `}>
               {isPast ? <div className="w-3 h-3 bg-fantasy-gold rounded-full" /> : 
                isActive ? <div className="w-4 h-4 bg-fantasy-gold rotate-45" /> : 
                <div className="w-2 h-2 bg-fantasy-text-muted/30 rounded-full" />
               }
            </div>

            {/* Avatar positioning */}
            {isActive && !quest.isCompleted && (
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 -top-10 z-30 ml-6 md:ml-0 transition-all duration-500">
                <AvatarIcon type={quest.avatar} />
              </div>
            )}

            {/* Content Card */}
            <div 
              onClick={() => onSelectStep(index)}
              className={`ml-36 md:ml-0 w-[calc(100%-120px)] md:w-[42%] cursor-pointer transition-all duration-300 transform ${
                isSelected ? 'scale-105 z-20' : 'scale-100 z-10 hover:scale-102'
              }`}
            >
               <div className={`
                 relative p-6 border transition-all duration-300
                 ${isSelected 
                    ? 'bg-fantasy-blue/80 border-fantasy-gold shadow-gold-glow backdrop-blur-sm' 
                    : isPast
                      ? 'bg-fantasy-blue/30 border-fantasy-gold/20 opacity-70 hover:opacity-100'
                      : 'bg-fantasy-dark/60 border-fantasy-text-muted/10'
                 }
               `}>
                  {/* Ornate corner bits if selected */}
                  {isSelected && (
                    <>
                      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-fantasy-gold"></div>
                      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-fantasy-gold"></div>
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-fantasy-gold"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-fantasy-gold"></div>
                    </>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-royal text-xs tracking-widest uppercase ${isActive || isSelected ? 'text-fantasy-gold' : 'text-fantasy-text-muted'}`}>
                      Stage {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][index] || index + 1}
                    </h3>
                  </div>
                  <p className={`font-body text-sm md:text-base leading-relaxed ${isPast ? 'text-fantasy-text-muted' : 'text-fantasy-text'}`}>
                    {step.title}
                  </p>
               </div>
               
               {/* Connector Line for desktop alternate layout */}
               <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-16 h-[1px] bg-fantasy-gold/30 ${
                  index % 2 === 0 ? '-left-16' : '-right-16'
               }`}></div>
            </div>
          </div>
        );
      })}

      {/* Final Trophy */}
      <div className="relative z-10 pt-8 flex flex-col items-center">
        <div className={`w-20 h-20 rotate-45 border-2 flex items-center justify-center bg-fantasy-dark transition-all duration-500 ${
          quest.isCompleted ? 'border-fantasy-gold shadow-gold-glow' : 'border-fantasy-text-muted/20'
        }`}>
          <div className="-rotate-45">
             <Trophy className={`w-8 h-8 ${quest.isCompleted ? 'text-fantasy-gold' : 'text-fantasy-text-muted/30'}`} />
          </div>
        </div>
        {quest.isCompleted && (
          <div className="absolute -top-10 animate-bounce text-5xl z-20">
            <AvatarIcon type={quest.avatar} />
          </div>
        )}
        <div className="mt-8 px-4 py-2 text-fantasy-gold/50 font-royal text-[10px] tracking-[0.3em] uppercase">
           Journey's End
        </div>
      </div>
    </div>
  );
};