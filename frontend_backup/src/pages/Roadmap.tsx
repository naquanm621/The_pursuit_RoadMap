import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Globe, Lightbulb, Layers, Database, ShieldCheck,
  Zap, Target, Car, Sparkles, HelpCircle, GraduationCap
} from 'lucide-react';

interface Node {
  id: string;
  label: string;
  icon: React.ReactNode;
  x: number;
  y: number;
  type: 'week' | 'variable';
  achieved: boolean;
  skills: string[];
  parentId?: string;
}

const Roadmap: React.FC = () => {
  const [nodes, setNodes] = useState<Record<string, Node>>({
    'start': { id: 'start', label: 'Onboarding', icon: <GraduationCap />, x: 10, y: 50, type: 'week', achieved: true, skills: ['Onboarding'] },
    'w1': { id: 'w1', label: 'Week 1: AI Prompting', icon: <Cpu />, x: 25, y: 40, type: 'week', achieved: false, skills: ['Prompting'], parentId: 'start' },
    'w2': { id: 'w2', label: 'Week 2: Web Arch', icon: <Globe />, x: 40, y: 60, type: 'week', achieved: false, skills: ['Web'], parentId: 'w1' },
    'w3': { id: 'w3', label: 'Week 3: Automation', icon: <Zap />, x: 55, y: 35, type: 'week', achieved: false, skills: ['Automation'], parentId: 'w2' },
    'w4': { id: 'w4', label: 'Week 4: MVP Build', icon: <Layers />, x: 70, y: 55, type: 'week', achieved: false, skills: ['MVP'], parentId: 'w3' },
  });

  const [aiBranches, setAiBranches] = useState<Node[]>([]);
  const [lastProcessedCombo, setLastProcessedCombo] = useState<string>("");

  // 1. Logic: Auto-Discovery of next week
  const visibleNodes = useMemo(() => {
    const all = { ...nodes };
    aiBranches.forEach(n => { all[n.id] = n; });
    return Object.values(all).filter(node => {
      if (node.achieved) return true;
      if (!node.parentId) return true;
      return all[node.parentId]?.achieved;
    });
  }, [nodes, aiBranches]);

  // 2. Autonomous Backend Logic: Triggers when skills change
  useEffect(() => {
    const achievedNodes = Object.values(nodes).filter(n => n.achieved);
    const achievedSkills = achievedNodes.flatMap(n => n.skills);
    const comboKey = achievedSkills.sort().join(',');

    // Only trigger if we have 2+ skills and we haven't processed this exact combo yet
    if (achievedSkills.length >= 2 && comboKey !== lastProcessedCombo) {
      setLastProcessedCombo(comboKey);
      
      const triggerAutonomousDiscovery = async () => {
        try {
          const response = await fetch('http://localhost:3000/api/career-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: achievedSkills }),
          });
          const data = await response.json();

          const lastNode = achievedNodes[achievedNodes.length - 1];
          const newNode: Node = {
            id: `auto-var-${Date.now()}`,
            label: data.careerTitle,
            icon: <Sparkles className="text-yellow-400" />,
            x: lastNode.x + 12,
            y: lastNode.y + (Math.random() * 30 - 15),
            type: 'variable',
            achieved: true,
            skills: [],
            parentId: lastNode.id
          };

          setAiBranches(prev => [...prev, newNode]);
        } catch (e) {
          console.error("Autonomous Discovery Failed", e);
        }
      };

      triggerAutonomousDiscovery();
    }
  }, [nodes, lastProcessedCombo]);

  const toggleNode = (id: string) => {
    if (nodes[id]) {
      setNodes(prev => ({
        ...prev,
        [id]: { ...prev[id], achieved: !prev[id].achieved }
      }));
    }
  };

  const currentCarPos = useMemo(() => {
    const achieved = Object.values(nodes).filter(n => n.achieved);
    return achieved[achieved.length - 1] || nodes['start'];
  }, [nodes]);

  return (
    <div className="relative w-full h-screen bg-[#060714] text-white font-sans overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />

      {/* Header HUD */}
      <div className="absolute top-8 left-8 z-50">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
          <Zap className="text-cyan-400 animate-pulse" /> Autonomous Skill Mesh
        </h1>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.5em]">Backend Agent Active: Monitoring Skills...</p>
      </div>

      {/* Roadmap Canvas */}
      <div className="relative w-full h-full">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <filter id="pave-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          
          {visibleNodes.map(node => {
            if (!node.parentId) return null;
            const parent = nodes[node.parentId] || aiBranches.find(n => n.id === node.parentId);
            if (!parent) return null;

            const isPaved = parent.achieved && node.achieved;
            const cx = (parent.x + node.x) / 2;
            const d = `M ${parent.x}% ${parent.y}% C ${cx}% ${parent.y}%, ${cx}% ${node.y}%, ${node.x}% ${node.y}%`;

            return (
              <g key={`road-${node.id}`}>
                <path d={d} stroke="#1a1b2e" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d={d} stroke={isPaved ? "#8b5cf6" : "#2d304a"} strokeWidth={isPaved ? "4" : "1.5"} fill="none" 
                      strokeDasharray={isPaved ? "0" : "8,4"} filter={isPaved ? "url(#pave-glow)" : ""} className="transition-all duration-1000" />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Nodes */}
        <AnimatePresence>
          {visibleNodes.map((node) => (
            <motion.div 
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <button 
                onClick={() => node.type === 'week' && toggleNode(node.id)}
                className={`
                  relative flex items-center justify-center rounded-full transition-all duration-700
                  ${node.type === 'week' ? 'w-20 h-20 border-4' : 'w-14 h-16 border-2 border-yellow-500/50'}
                  ${node.achieved 
                    ? 'bg-[#161837] border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.5)]' 
                    : 'bg-[#060714] border-[#2d304a] text-gray-700 hover:border-cyan-500/40'}
                `}
              >
                {node.achieved ? node.icon : <Target size={18} />}
                <div className="absolute -bottom-12 whitespace-nowrap text-center">
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${node.achieved ? 'text-white' : 'text-gray-700'}`}>
                    {node.label}
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* The Explorer Car */}
        <motion.div
          className="absolute z-20 pointer-events-none"
          animate={{ left: `${currentCarPos.x}%`, top: `${currentCarPos.y}%` }}
          transition={{ type: 'spring', stiffness: 40, damping: 15 }}
        >
          <div className="relative -translate-y-14">
            <Car className="text-cyan-400 drop-shadow-[0_0_15px_#22d3ee]" size={30} />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[7px] font-black px-2 py-0.5 rounded shadow-lg uppercase">ACTIVE 🏎️</div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Legend HUD */}
      <div className="absolute bottom-8 right-8 bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-xl flex gap-6 text-[9px] font-bold uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-2 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#8b5cf6]" /> Paved Week</div>
          <div className="flex items-center gap-2 text-yellow-400"><div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#fbbf24]" /> AI Trajectory</div>
          <div className="flex items-center gap-2"><div className="w-2 h-0.5 bg-gray-700" /> Locked</div>
      </div>
    </div>
  );
};

export default Roadmap;
