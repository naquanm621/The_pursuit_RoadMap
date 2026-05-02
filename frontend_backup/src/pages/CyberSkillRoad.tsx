import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Target, 
  Cpu, 
  Globe, 
  Lightbulb, 
  Database, 
  ShieldCheck, 
  Boxes 
} from 'lucide-react';

// --- Types ---
interface SkillNode {
  id: string;
  label: string;
  week: number; // X-axis (0-7)
  row: number;  // Y-axis (vertical offset)
  icon: React.ReactNode;
  achieved: boolean;
  isCombo?: boolean;
}

interface Connection {
  from: string;
  to: string;
}

// --- Component ---
const CyberSkillRoad: React.FC = () => {
  // 1. Initial Graph State (Adjacency List Definition)
  const [nodes, setNodes] = useState<Record<string, SkillNode>>({
    'home': { id: 'home', label: 'Onboarding', week: 0, row: 0, icon: <Boxes />, achieved: true },
    'ai': { id: 'ai', label: 'AI Prompting', week: 1, row: -1, icon: <Cpu />, achieved: false },
    'web': { id: 'web', label: 'Web Arch', week: 1, row: 1, icon: <Globe />, achieved: false },
    'ideation': { id: 'ideation', label: 'Creative Ideation', week: 3, row: 0, icon: <Lightbulb />, achieved: false, isCombo: true },
    'data': { id: 'data', label: 'Data/APIs', week: 5, row: -1, icon: <Database />, achieved: false },
    'qa': { id: 'qa', label: 'Quality Assurance', week: 7, row: 0, icon: <ShieldCheck />, achieved: false },
  });

  // Potential connections (The "Ideal" Road)
  const adjacencyList: Connection[] = [
    { from: 'home', to: 'ai' },
    { from: 'home', to: 'web' },
    { from: 'ai', to: 'ideation' },
    { from: 'web', to: 'ideation' },
    { from: 'ideation', to: 'data' },
    { from: 'data', to: 'qa' },
  ];

  const toggleNode = (id: string) => {
    setNodes(prev => ({
      ...prev,
      [id]: { ...prev[id], achieved: !prev[id].achieved }
    }));
  };

  // 2. Logic: Calculate Visible Roads
  const activeRoads = useMemo(() => {
    const roads: { x1: number, y1: number, x2: number, y2: number, type: 'paved' | 'bridge' | 'potential' }[] = [];
    
    adjacencyList.forEach(({ from, to }) => {
      const start = nodes[from];
      const end = nodes[to];

      // Logic: If 'to' is achieved, draw a paved road from its achieved ancestors
      // If 'from' is achieved but 'to' isn't, draw a potential road
      if (start.achieved && end.achieved) {
        roads.push({ x1: start.week, y1: start.row, x2: end.week, y2: end.row, type: 'paved' });
      } else if (start.achieved && !end.achieved) {
        roads.push({ x1: start.week, y1: start.row, x2: end.week, y2: end.row, type: 'potential' });
      }

      // Variable "Bridge" Logic: 
      // If 'home' and 'ideation' are achieved but 'ai'/'web' are missed, 
      // draw a direct Bridge road.
      if (nodes['home'].achieved && nodes['ideation'].achieved && !nodes['ai'].achieved && !nodes['web'].achieved) {
        roads.push({ x1: 0, y1: 0, x2: 3, y2: 0, type: 'bridge' });
      }
    });

    return roads;
  }, [nodes]);

  // Scaling helpers
  const getX = (week: number) => 15 + week * 12; // % across screen
  const getY = (row: number) => 50 + row * 20;   // % down screen

  return (
    <div className="relative w-full h-screen bg-[#0a0b1e] text-white font-sans overflow-hidden">
      {/* 3. Cyber Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      {/* 4. The Road Layer (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <AnimatePresence>
          {activeRoads.map((road, i) => (
            <motion.line
              key={`road-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              x1={`${getX(road.x1)}%`} y1={`${getY(road.y1)}%`}
              x2={`${getX(road.x2)}%`} y2={`${getY(road.y2)}%`}
              stroke={road.type === 'paved' ? '#8b5cf6' : road.type === 'bridge' ? '#22d3ee' : '#1e293b'}
              strokeWidth={road.type === 'potential' ? "1.5" : "3"}
              strokeDasharray={road.type === 'potential' ? "8,4" : "0"}
              filter={road.type !== 'potential' ? "url(#neon-glow)" : ""}
              className="transition-all duration-1000"
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* 5. The Node Layer */}
      {Object.values(nodes).map((node) => (
        <motion.div
          key={node.id}
          layout
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ left: `${getX(node.week)}%`, top: `${getY(node.row)}%` }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div className="relative group">
            <button
              onClick={() => toggleNode(node.id)}
              className={`
                flex items-center justify-center w-20 h-20 rounded-full transition-all duration-500
                ${node.achieved 
                  ? 'bg-[#161837] border-2 border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] scale-110' 
                  : 'bg-[#0a0b1e] border border-gray-800 text-gray-600 hover:border-cyan-400/50 hover:text-cyan-400'}
              `}
            >
              {node.icon}

              {/* Weekly Indicator */}
              <div className="absolute -top-12 whitespace-nowrap">
                <span className={`text-[9px] font-black uppercase tracking-widest ${node.achieved ? 'text-purple-400' : 'text-gray-700'}`}>
                  Week {node.week}
                </span>
              </div>

              {/* Label */}
              <div className="absolute -bottom-10 whitespace-nowrap">
                <span className={`text-[11px] font-bold ${node.achieved ? 'text-white' : 'text-gray-600'}`}>
                  {node.label}
                </span>
              </div>
            </button>

            {/* Branching/Mesh Pulse Effect */}
            {node.achieved && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-purple-500 pointer-events-none"
              />
            )}
          </div>
        </motion.div>
      ))}

      {/* 6. Dashboard HUD Overlay */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-2">
          <Zap className="text-cyan-400 fill-cyan-400" /> SKILL MESH PRO
        </h1>
        <div className="mt-4 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-2 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500" /> Active Path</div>
          <div className="flex items-center gap-2 text-cyan-400"><div className="w-2 h-2 rounded-full bg-cyan-400" /> Bridge Path</div>
          <div className="flex items-center gap-2 text-gray-700"><div className="w-2 h-2 rounded-full border border-gray-700" /> Future Potential</div>
        </div>
      </div>
    </div>
  );
};

export default CyberSkillRoad;
