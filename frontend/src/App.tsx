import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Brain, Code, Database, Cpu, Globe, Rocket, Terminal, Layers, Star, ExternalLink, Briefcase, Search, GraduationCap, Plus, X, ArrowRight, Eye, EyeOff, Lock, User, Send, MessageSquare, History, LogOut, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';

interface Week {
  id: number;
  title: string;
  skill: string;
  review: string[];
  icon: any;
  position: { x: number; y: number };
}

interface CareerPath {
  id: string;
  name: string;
  requiredWeeks: number[];
  additionalSkills: string[];
  color: string;
  endpoint: { x: number; y: number };
  isAI?: boolean;
  description?: string;
  searchQuery?: string;
  parentId?: string | number; // To track mesh connections
  courses?: { title: string; url: string; platform: string }[]; // For training suggestions
  requiredSkills?: string[]; // Skills needed to unlock this path
  connectedWeekIds?: number[]; // Which weeks connect to this path for unlimited branching
  goldenSkills?: string[]; // Skills NOT in curriculum - the golden path unique skills
  goldenTraining?: { skill: string; course: string; platform: string; url: string }[]; // Training for golden skills
}

interface GoldenSkillNode {
  id: string;
  name: string;
  parentPathId: string;
  position: { x: number; y: number };
  training?: { course: string; platform: string; url: string };
  isCompleted?: boolean;
}

const weeks: Week[] = [
  { 
    id: 1, title: 'Week 1', skill: 'AI Fundamentals', icon: Brain, position: { x: 8, y: 50 },
    review: ['Program Onboarding', 'How AI Learns', 'AI Prompting Techniques', 'Prompt Blueprinting', 'AI Ethics & Advocacy']
  },
  { 
    id: 2, title: 'Week 2', skill: 'Foundations & Automation', icon: Globe, position: { x: 18, y: 35 },
    review: ['AI Architecture', 'Web Building Blocks', 'IDEs & AI Assistance', 'GitHub & Version Control', 'Deployment Basics']
  },
  { 
    id: 3, title: 'Week 3', skill: 'Problem ID & Ideation', icon: Code, position: { x: 28, y: 55 },
    review: ['Root Cause Analysis', 'Ideation & Scoping', 'Value Propositions', 'Frontend vs Backend', 'Feedback Loops']
  },
  { 
    id: 4, title: 'Week 4', skill: 'Workflow Automation', icon: Zap, position: { x: 38, y: 40 },
    review: ['AI-assisted Workflows', 'Workflow Mapping', 'Package Managers', 'MVP Practices', 'Building in Public']
  },
  { 
    id: 5, title: 'Week 5', skill: 'Data Management', icon: Database, position: { x: 48, y: 60 },
    review: ['Intro to Databases', 'Storing & Using Data', 'Data Schemas', 'API Integration', 'Competitive Positioning']
  },
  { 
    id: 6, title: 'Week 6', skill: 'UX/UI Principles', icon: Layers, position: { x: 58, y: 45 },
    review: ['UX/UI Deep Dive', 'Interface Design', 'UI Kits Exploration', 'User Journeys', 'Personal Pop Pitch']
  },
  { 
    id: 7, title: 'Week 7', skill: 'Testing & Debugging', icon: Cpu, position: { x: 68, y: 35 },
    review: ['QA & Maintenance', 'AI-Informed Debugging', 'Automated Testing', 'Regression Testing', 'Hackathon Logic']
  },
  { 
    id: 8, title: 'Week 8', skill: 'Synthesis & Showcase', icon: Rocket, position: { x: 78, y: 50 },
    review: ['Codifying Learnings', 'Product Demo Best Practices', 'Presentation Practice', 'Final Build Synthesis', 'Demo Day & Celebration']
  },
];

const staticPaths: CareerPath[] = [
  {
    id: 'product-engineer',
    name: 'Product Engineer',
    requiredWeeks: [1, 2, 3, 6, 8],
    additionalSkills: ['Figma', 'React'],
    color: '#00ffff',
    endpoint: { x: 92, y: 30 },
    searchQuery: 'Product Engineer React'
  },
  {
    id: 'automation-expert',
    name: 'Automation Expert',
    requiredWeeks: [1, 2, 4, 5, 7],
    additionalSkills: ['Python', 'Docker'],
    color: '#ff00ff',
    endpoint: { x: 92, y: 60 },
    searchQuery: 'Automation Engineer Python'
  },
  {
    id: 'fullstack-specialist',
    name: 'Full Stack AI',
    requiredWeeks: [1, 2, 3, 4, 5, 6, 7, 8],
    additionalSkills: ['System Design'],
    color: '#ffff00',
    endpoint: { x: 92, y: 90 },
    searchQuery: 'Full Stack AI Developer'
  },
];

const predictionData = [
  { weeks: 2, readiness: '5%', status: 'Novice' },
  { weeks: 4, readiness: '20%', status: 'Apprentice' },
  { weeks: 6, readiness: '55%', status: 'Job Ready' },
  { weeks: 8, readiness: '85%', status: 'Professional' },
];

type AppView = 'login' | 'onboarding' | 'tutorial' | 'roadmap' | 'log';

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [aiPaths, setAiPaths] = useState<CareerPath[]>([]);
  const [discoveredNodes, setDiscoveredNodes] = useState<CareerPath[]>([]);
  const [goldenSkillNodes, setGoldenSkillNodes] = useState<GoldenSkillNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapScale, setMapScale] = useState(1);
  const [lastCombo, setLastCombo] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({ scrollLeft: 0, scrollTop: 0 });
  
  // Keyboard zoom controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setMapScale(prev => Math.min(prev + 0.1, 2));
        } else if (e.key === '-') {
          e.preventDefault();
          setMapScale(prev => Math.max(prev - 0.1, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          setMapScale(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [hoveredPath, setHoveredPath] = useState<CareerPath | null>(null);
  const [isTrajectoryPanelOpen, setIsTrajectoryPanelOpen] = useState(true);
  const [showGoldStars, setShowGoldStars] = useState(true);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  
  // Trajectory Engine State
  const [weight, setWeight] = useState(1);
  const [trajectoryName, setTrajectoryName] = useState("Aspiring AI Explorer");
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Onboarding State
  const [previousSkills, setPreviousSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Chat/Journey Log State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith('@pursuit.org')) {
      setLoginError("Access Restricted: @pursuit.org email required.");
      return;
    }
    setView('onboarding');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', parts: userMessage }]);
    setIsChatLoading(true);

    // Future Feature - Default response without API call
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        parts: "🚧 Journey Log AI Tutor is a future feature! For now, continue exploring your roadmap and discovering career trajectories. Every skill you complete brings new opportunities into view." 
      }]);
      setIsChatLoading(false);
    }, 800);
  };

  const toggleWeek = (weekId: number) => {
    setCompletedWeeks(prev =>
      prev.includes(weekId)
        ? prev.filter(id => id !== weekId)
        : [...prev, weekId]
    );
  };

  const addPreviousSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !previousSkills.includes(skillInput.trim())) {
      setPreviousSkills([...previousSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  useEffect(() => {
    const fetchTrajectory = async () => {
      const curriculumSkills = weeks.filter(w => completedWeeks.includes(w.id)).map(w => w.skill);
      const allSkills = [...previousSkills, ...curriculumSkills];
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/trajectory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills: allSkills }),
        });
        const data = await response.json();
        setWeight(data.weight);
        setTrajectoryName(data.trajectoryName);
      } catch (error) {
        console.error('Trajectory fetch failed', error);
      }
    };
    if (view === 'roadmap' || view === 'log') {
      fetchTrajectory();
    }
  }, [completedWeeks, previousSkills, view]);

  useEffect(() => {
    const comboKey = [...completedWeeks].sort().join(',');
    if (view === 'roadmap' && (completedWeeks.length >= 2 || previousSkills.length > 0) && comboKey !== lastCombo && !isGenerating) {
      
      const timer = setTimeout(() => {
        setLastCombo(comboKey);
        
        // Preserve scroll position before generating
        if (mapContainerRef.current) {
          scrollPositionRef.current = {
            scrollLeft: mapContainerRef.current.scrollLeft,
            scrollTop: mapContainerRef.current.scrollTop
          };
        }
        
        const generateNewBranches = async () => {
          setIsGenerating(true);
          try {
            const curriculumSkills = weeks.filter(w => completedWeeks.includes(w.id)).map(w => w.skill);
            const discoveredSkills = discoveredNodes.flatMap(d => d.additionalSkills || []);
            const allSkills = [...previousSkills, ...curriculumSkills, ...discoveredSkills];
            const gaps = weeks.filter(w => w.id <= Math.max(...completedWeeks, 0) && !completedWeeks.includes(w.id)).map(w => w.skill);

            // Fix recursive nesting: Only use the last node name if it's not already in the trajectory name
            const lastNode = discoveredNodes[discoveredNodes.length - 1];
            let trajectoryContext = trajectoryName;
            if (lastNode && !trajectoryName.includes(lastNode.name)) {
              trajectoryContext = `${lastNode.name} Specialist`;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/career-path`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                skills: allSkills, 
                gaps,
                trajectoryName: trajectoryContext,
                existingTitles: discoveredNodes.map(d => d.name)
              }),
            });
            const data = await response.json();
            
            if (Array.isArray(data)) {
              const lastNode = discoveredNodes[discoveredNodes.length - 1];
              const lastWeekId = completedWeeks[completedWeeks.length - 1];
              
              const newPaths = data.map((item: any, idx: number) => ({
                id: `ai-${Date.now()}-${idx}`,
                name: item.careerTitle,
                requiredWeeks: [...completedWeeks],
                additionalSkills: [item.bridgeSuggestion, item.leapSuggestion],
                color: '#fbbf24',
                endpoint: { x: Math.min(item.x || 92, 95), y: Math.max(15, Math.min(85, item.y || (15 + idx * 7))) },
                isAI: true,
                description: item.description,
                searchQuery: item.indeedQuery || item.careerTitle,
                parentId: lastNode ? lastNode.id : lastWeekId,
                courses: item.topCourses || [],
                requiredSkills: item.requiredSkills || [],
                connectedWeekIds: item.connectedWeekIds || completedWeeks,
                goldenSkills: item.goldenSkills || [],
                goldenTraining: item.goldenTraining || []
              }));
              setAiPaths(newPaths);
            }
          } catch (error) {
            console.error('Dynamic Branching Failed', error);
          } finally {
            setIsGenerating(false);
            // Restore scroll position after generation
            setTimeout(() => {
              if (mapContainerRef.current) {
                mapContainerRef.current.scrollLeft = scrollPositionRef.current.scrollLeft;
                mapContainerRef.current.scrollTop = scrollPositionRef.current.scrollTop;
              }
            }, 50);
          }
        };
        generateNewBranches();
      }, 1000); // 1-second debounce

      return () => clearTimeout(timer);
    }
  }, [completedWeeks, lastCombo, view, previousSkills]);

  const allPaths = useMemo(() => {
    const paths = staticPaths.filter(path =>
      path.requiredWeeks.every(week => completedWeeks.includes(week))
    );
    return [...paths, ...aiPaths];
  }, [completedWeeks, aiPaths]);

  const openJobSearch = (platform: string, query: string) => {
    let url = '';
    const q = encodeURIComponent(query);
    switch(platform) {
      case 'indeed': url = `https://www.indeed.com/jobs?q=${q}`; break;
      case 'linkedin': url = `https://www.linkedin.com/jobs/search/?keywords=${q}`; break;
    }
    window.open(url, '_blank');
  };

  const getPathProgress = (path: CareerPath) => {
    const completed = path.requiredWeeks.filter(week => completedWeeks.includes(week)).length;
    return (completed / path.requiredWeeks.length) * 100;
  };

  const currentPrediction = useMemo(() => {
    const count = completedWeeks.length;
    return [...predictionData].reverse().find(p => count >= p.weeks) || { readiness: '0%', status: 'Learning' };
  }, [completedWeeks]);

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black"></div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-[450px] p-10 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-[0_0_100px_rgba(59,130,246,0.15)] text-center">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">IN PURSUIT</h1>
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.5em] mb-12">Your AI Native Journey</p>

          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div>
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2 ml-1">Builder ID</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your credentials"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2 ml-1">Access Code</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-blue-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && <p className="text-red-400 text-[10px] font-bold text-center animate-shake">{loginError}</p>}

            <button type="submit" className="w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 p-0.5 rounded-2xl group active:scale-95 transition-transform shadow-lg shadow-blue-500/20">
              <div className="bg-slate-900/10 group-hover:bg-transparent py-4 rounded-[14px] flex items-center justify-center gap-3 transition-colors">
                <span className="text-white font-black uppercase tracking-widest text-sm">Initialize Connection</span>
                <ArrowRight size={18} className="text-white" />
              </div>
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">
              System Status: <span className="text-green-500">Online</span> • Secure Connection Established
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ONBOARDING VIEW
  if (view === 'onboarding') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-slate-900/50 border border-blue-500/30 p-8 rounded-2xl backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="mb-8"><h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">Welcome to Pursuit</h1><p className="text-slate-400 text-sm">Tell us what you already know. Our AI will combine your past experience with the curriculum.</p></div>
          <form onSubmit={addPreviousSkill} className="mb-6"><label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Previous Skills</label><div className="flex gap-2"><div className="relative flex-grow"><Terminal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g. Graphic Design, Python..." className="w-full bg-black/40 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" /></div><button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-colors"><Plus size={20} /></button></div></form>
          <div className="flex flex-wrap gap-2 mb-8 min-h-[100px] content-start bg-black/20 p-4 rounded-xl border border-slate-800/50">{previousSkills.length === 0 && <span className="text-slate-600 text-xs italic">No skills added yet...</span>}
            <AnimatePresence>{previousSkills.map(skill => (
              <motion.div key={skill} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">{skill}
                <button onClick={() => setPreviousSkills(previousSkills.filter(s => s !== skill))} className="hover:text-white"><X size={14} /></button>
              </motion.div>
            ))}</AnimatePresence>
          </div>
          <button onClick={() => setView('tutorial')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">Continue <ArrowRight size={18} /></button>
        </motion.div>
      </div>
    );
  }

  // TUTORIAL VIEW - Map Guide
  if (view === 'tutorial') {
    return (
      <div className={`fixed inset-0 flex items-center justify-center p-3 overflow-auto ${theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-slate-100'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-all z-50 ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-200 shadow-lg'}`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Back Button */}
        <button 
          onClick={() => setView('onboarding')}
          className={`absolute top-4 left-4 flex items-center gap-1 px-3 py-2 rounded-lg transition-all z-50 text-xs font-bold uppercase ${theme === 'dark' ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 shadow-lg'}`}
        >
          <ChevronLeft size={16} /> Back
        </button>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`w-full max-w-xl border p-4 rounded-xl backdrop-blur-xl shadow-2xl relative my-auto ${theme === 'dark' ? 'bg-slate-900/50 border-blue-500/30' : 'bg-white/80 border-blue-300/50'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="mb-3 text-center">
            <h1 className={`text-2xl font-black mb-1 uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Your Journey Map</h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Understanding your path to a tech career</p>
          </div>

          {/* Map Guide */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-300'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-300"></div>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Core Curriculum</span>
              </div>
              <p className={`text-[8px] leading-tight ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>8 weeks of foundational AI & software engineering skills.</p>
            </div>
            
            <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-300'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300"></div>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Career Horizons</span>
              </div>
              <p className={`text-[8px] leading-tight ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Discover career paths based on completed weeks.</p>
            </div>
            
            <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-300'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Star size={10} className="text-yellow-400" />
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Golden Skills</span>
              </div>
              <p className={`text-[8px] leading-tight ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Premium skills unlocked through AI discoveries.</p>
            </div>
            
            <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-300'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 border border-green-300"></div>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Week Badges</span>
              </div>
              <p className={`text-[8px] leading-tight ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Each week has a unique color. Click to complete.</p>
            </div>
          </div>

          {/* Color Key */}
          <div className={`p-2.5 rounded-lg border mb-3 ${theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-slate-200/50 border-slate-300'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Week Colors</p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[7px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">1 AI</span>
              <span className="text-[7px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold">2 Found</span>
              <span className="text-[7px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold">3 Prob</span>
              <span className="text-[7px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">4 Auto</span>
              <span className="text-[7px] bg-cyan-500 text-white px-1.5 py-0.5 rounded font-bold">5 Data</span>
              <span className="text-[7px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">6 UX</span>
              <span className="text-[7px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold">7 Test</span>
              <span className="text-[7px] bg-pink-500 text-white px-1.5 py-0.5 rounded font-bold">8 Show</span>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className={`p-3 rounded-lg border mb-3 ${theme === 'dark' ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-amber-500/20' : 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-amber-300'}`}>
            <p className={`text-xs italic text-center leading-relaxed ${theme === 'dark' ? 'text-amber-200' : 'text-amber-800'}`}>
              "Every skill you master brings you closer to your future. Stay curious, stay persistent. Your Pursuit starts now."
            </p>
            <p className={`text-[9px] text-center mt-1 uppercase tracking-widest ${theme === 'dark' ? 'text-amber-400/60' : 'text-amber-600'}`}>— In Pursuit</p>
          </div>

          <button onClick={() => setView('roadmap')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-sm">
            Generate My Roadmap <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // JOURNEY LOG VIEW
  if (view === 'log') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('roadmap')} className="text-slate-500 hover:text-white transition-colors"><ArrowRight className="rotate-180" size={24} /></button>
            <div><h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Journey Log</h1><p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1">AI Tutor & Logger Active <span className="bg-amber-500/30 px-1.5 py-0.5 rounded text-[6px] text-amber-300">FUTURE FEATURE</span></p></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block"><p className="text-[9px] text-slate-500 font-bold uppercase">{email}</p></div>
            <button onClick={() => setView('login')} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-all border border-red-500/20"><LogOut size={20} /></button>
          </div>
        </div>

        <div className="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden">
          <div className="flex-grow flex flex-col bg-black/20 relative">
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare size={48} className="text-blue-500 mb-4" />
                  <h2 className="text-lg font-bold text-white uppercase italic mb-2">Initialize Your Log</h2>
                  <p className="text-xs text-slate-400 max-w-xs">Tell me about your progress today, ask a technical question, or log a new achievement.</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'}`}>
                    <p className="text-sm leading-relaxed">{msg.parts}</p>
                  </div>
                </motion.div>
              ))}
              {isChatLoading && <div className="flex justify-start"><div className="bg-slate-800 p-4 rounded-2xl rounded-bl-none animate-pulse text-blue-400 text-xs font-bold uppercase tracking-widest italic">AI Processing...</div></div>}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/40 border-t border-white/5 backdrop-blur-xl">
              <div className="flex gap-4 relative">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message to your AI Tutor..." className="flex-grow bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20"><Send size={24} /></button>
              </div>
            </form>
          </div>

          <div className="w-full md:w-80 bg-slate-900/40 border-l border-white/5 p-6 overflow-y-auto backdrop-blur-3xl">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><History size={14} /> Knowledge Graph</h2>
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Learned Skills</p>
                <div className="flex flex-wrap gap-1.5">{weeks.filter(w => completedWeeks.includes(w.id)).map(w => <span key={w.id} className="bg-blue-500/10 text-blue-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase">{w.skill}</span>)}
                  {previousSkills.map(s => <span key={s} className="bg-indigo-500/10 text-indigo-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase">{s}</span>)}
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">AI Discoveries</p>
                <div className="space-y-2">{aiPaths.map(p => <div key={p.id} className="text-[9px] font-bold text-slate-300 border-l-2 border-amber-500 pl-2">{p.name}</div>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ROADMAP VIEW
  return (
    <div className={`fixed inset-0 overflow-hidden flex flex-col p-4 md:p-6 ${theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-slate-100'}`}>
      <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent' : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent'}`}></div>

      {/* Top HUD */}
      <div className={`flex flex-row justify-between items-center mb-4 shrink-0 p-2 rounded-xl ${theme === 'dark' ? '' : 'bg-white/80 shadow-lg border border-slate-200'}`}>
        <div>
          <h1 className={`text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r leading-tight ${theme === 'dark' ? 'from-blue-400 via-indigo-400 to-purple-400' : 'from-blue-600 via-indigo-600 to-purple-600'}`}>
            PURSUIT ROADMAP
          </h1>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-blue-300/50' : 'text-slate-500'}`}>
              {completedWeeks.length}/8 WEEKS COMPLETED
            </span>
            <button onClick={() => setView('tutorial')} className={`flex items-center gap-1 ml-3 px-3 py-1 rounded-full border transition-all uppercase tracking-widest text-[9px] font-black ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border-slate-600/30' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'}`}>
              <ChevronLeft size={12} /> Guide
            </button>
            <button onClick={() => setView('log')} className={`flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full border transition-all uppercase tracking-widest italic text-[9px] font-black ${theme === 'dark' ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300'}`}>
              <MessageSquare size={12} /> Log <span className="bg-amber-500/30 px-1 rounded text-[6px] text-amber-300">FUTURE</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white/80 border-slate-300 text-slate-600 hover:bg-slate-100 shadow-lg'}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          {/* Gold Stars Toggle */}
          <button
            onClick={() => setShowGoldStars(!showGoldStars)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${showGoldStars ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-500' : 'bg-white/80 border-slate-300 text-slate-500 shadow-lg'}`}
            title={showGoldStars ? "Hide Gold Stars" : "Show Gold Stars"}
          >
            <Star size={14} className={showGoldStars ? "fill-amber-400" : ""} />
            <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">{showGoldStars ? 'Hide' : 'Show'}</span>
          </button>
          
          <div className={`border p-2 md:p-3 rounded-lg backdrop-blur-md flex items-center gap-3 ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-100/50 border-indigo-300/50 shadow-lg'}`}>
            <div className="text-right">
              <div className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Role Readiness</div>
              <div className={`text-xl md:text-2xl font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentPrediction.readiness}</div>
            </div>
            <div className={`h-8 w-px ${theme === 'dark' ? 'bg-indigo-500/30' : 'bg-indigo-300/50'}`}></div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter ${theme === 'dark' ? 'text-indigo-300 bg-indigo-500/20' : 'text-indigo-700 bg-indigo-200/50'}`}>
              {currentPrediction.status}
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-grow gap-4 min-h-0 ${theme === 'dark' ? '' : 'bg-slate-100'}`}>
        <div 
          ref={mapContainerRef}
          className={`relative flex-grow border rounded-xl backdrop-blur-sm overflow-auto custom-scrollbar scroll-smooth ${theme === 'dark' ? 'border-blue-500/20 bg-black/40' : 'border-blue-300/50 bg-white/60'}`}
        >
          {/* Zoom Controls */}
          <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
            <button 
              onClick={() => setMapScale(prev => Math.min(prev + 0.1, 2))}
              className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors shadow-lg ${theme === 'dark' ? 'bg-slate-900/90 border-blue-500/30 text-blue-400 hover:bg-blue-600/20' : 'bg-white/90 border-blue-400/50 text-blue-600 hover:bg-blue-100'}`}
            >
              <span className="text-lg font-bold">+</span>
            </button>
            <button 
              onClick={() => setMapScale(prev => Math.max(prev - 0.1, 0.5))}
              className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors shadow-lg ${theme === 'dark' ? 'bg-slate-900/90 border-blue-500/30 text-blue-400 hover:bg-blue-600/20' : 'bg-white/90 border-blue-400/50 text-blue-600 hover:bg-blue-100'}`}
            >
              <span className="text-lg font-bold">-</span>
            </button>
            <button 
              onClick={() => setMapScale(1)}
              className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors shadow-lg text-[9px] font-bold ${theme === 'dark' ? 'bg-slate-900/90 border-blue-500/30 text-blue-400 hover:bg-blue-600/20' : 'bg-white/90 border-blue-400/50 text-blue-600 hover:bg-blue-100'}`}
            >
              100%
            </button>
          </div>
          
          <div 
            className="relative h-full min-h-[600px] transition-transform duration-300 ease-out origin-top-left" 
            style={{ 
              minWidth: `${Math.max(100, (discoveredNodes.length / 2) * 40 + 100)}%`,
              transform: `scale(${mapScale})`,
              width: `${100 / mapScale}%`,
              height: `${100 / mapScale}%`
            }}
          >
            {/* Skill Review Banner - Simple, no lag - positioned to the right */}
            {hoveredWeek !== null && (
              <div 
                className="absolute z-[100] pointer-events-none transition-opacity duration-200"
                style={{ 
                  left: `${(weeks.find(w => w.id === hoveredWeek)?.position.x || 0) + 8}%`,
                  top: `${weeks.find(w => w.id === hoveredWeek)?.position.y}%`,
                  transform: 'translate(0%, -50%)'
                }}
              >
                <div className="w-[180px]">
                  <div className={`border p-2.5 rounded-lg shadow-lg backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/95 border-blue-500/30' : 'bg-white/95 border-blue-400/50'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <GraduationCap className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} size={14} />
                      <div>
                        <h3 className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{weeks.find(w => w.id === hoveredWeek)?.title}</h3>
                        <p className={`text-[8px] uppercase ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Skill Review</p>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {weeks.find(w => w.id === hoveredWeek)?.review.slice(0, 3).map((item, i) => (
                        <div key={i} className={`flex items-start gap-1.5 text-[9px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          <div className={`w-1 h-1 rounded-full mt-1 flex-shrink-0 ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'}`} />
                          <span className="leading-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
              
            {/* Path Banner - Simple, follows element position */}
            {hoveredPath !== null && (
              <div 
                className="absolute z-[100] pointer-events-none transition-opacity duration-200"
                style={{ 
                  left: `${Math.min(hoveredPath.endpoint.x, 85)}%`,
                  top: `${hoveredPath.endpoint.y + 8}%`,
                  transform: 'translate(-50%, 0%)'
                }}
              >
                <div className="w-[240px]">
                  <div className="bg-slate-900/95 border border-amber-500/40 p-3 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="text-amber-400" size={14} />
                      <div>
                        <h3 className="text-[11px] font-bold text-white">{hoveredPath.name}</h3>
                        <p className="text-[8px] text-amber-400 uppercase">Trajectory</p>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-300 mb-2 leading-relaxed line-clamp-2">{hoveredPath.description}</div>
                    
                    {hoveredPath.goldenSkills && hoveredPath.goldenSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hoveredPath.goldenSkills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="text-[7px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">★ {skill}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-2 text-[8px] text-slate-500 italic">
                      Click to discover
                    </div>
                  </div>
                </div>
              </div>
            )}

            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                {/* Glow Filter */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Strong Glow Filter for golden elements */}
                <filter id="strongGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feColorMatrix in="blur" type="matrix" values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 18 -7" result="glow"/>
                  <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Animated gradient for roads */}
                <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6">
                    <animate attributeName="stop-color" values="#3b82f6;#818cf8;#3b82f6" dur="4s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="50%" stopColor="#818cf8">
                    <animate attributeName="stop-color" values="#818cf8;#8b5cf6;#818cf8" dur="4s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="100%" stopColor="#8b5cf6">
                    <animate attributeName="stop-color" values="#8b5cf6;#3b82f6;#8b5cf6" dur="4s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>
                
                {/* Animated gold gradient for golden paths */}
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24">
                    <animate attributeName="stop-color" values="#fbbf24;#f59e0b;#fbbf24" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="50%" stopColor="#f59e0b">
                    <animate attributeName="stop-color" values="#f59e0b;#fbbf24;#f59e0b" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="100%" stopColor="#fbbf24">
                    <animate attributeName="stop-color" values="#fbbf24;#f59e0b;#fbbf24" dur="3s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>
                
                {/* Energy pattern for roads */}
                <pattern id="energyPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="2" fill="white" opacity="0.5">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                </pattern>
              </defs>
              <AnimatePresence>
                {/* GOLDEN MASTER PATH - Only shows when ALL weeks 1-8 are completed */}
                {completedWeeks.length >= 8 && weeks.map((week, idx) => {
                  if (idx === 0) return null;
                  const from = weeks[idx - 1];
                  const to = week;
                  
                  // Calculate curved path for smoother connection
                  const midX = (from.position.x + to.position.x) / 2;
                  const midY = (from.position.y + to.position.y) / 2 - 8; // Curve upward
                  const pathD = `M${from.position.x},${from.position.y} Q${midX},${midY} ${to.position.x},${to.position.y}`;
                  
                  return (
                    <motion.path 
                      key={`golden-path-${from.id}-${to.id}`} 
                      d={pathD}
                      stroke="url(#goldGradient)"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }} 
                      animate={{ pathLength: 1, opacity: 0.7 }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                    />
                  );
                })}

                {/* User's actual completion path (blue) */}
                {completedWeeks.map((weekId, idx) => {
                  if (idx === 0) return null;
                  const from = weeks.find(w => w.id === completedWeeks[idx - 1]);
                  const to = weeks.find(w => w.id === weekId);
                  if (!from || !to) return null;
                  // Calculate curved path for smoother connection
                  const midX = (from.position.x + to.position.x) / 2;
                  const midY = (from.position.y + to.position.y) / 2 - 5; // Gentle curve
                  const pathD = `M${from.position.x},${from.position.y} Q${midX},${midY} ${to.position.x},${to.position.y}`;
                  
                  return (
                    <motion.path 
                      key={`order-road-${from.id}-${to.id}`} 
                      d={pathD}
                      stroke="url(#roadGradient)" 
                      strokeWidth="0.6" 
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }} 
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    />
                  );
                })}
                {/* Lines connecting discovered nodes to each other - curved and subtle */}
                {showGoldStars && discoveredNodes.map((node, idx) => {
                  if (idx === 0) return null;
                  const prevNode = discoveredNodes[idx - 1];
                  const row = Math.floor(idx / 2);
                  const col = idx % 2;
                  const prevRow = Math.floor((idx - 1) / 2);
                  const prevCol = (idx - 1) % 2;
                  const fromX = 96 + prevCol * 4;
                  const fromY = 12 + prevRow * 14;
                  const toX = 96 + col * 4;
                  const toY = 12 + row * 14;
                  // Curved path
                  const midX = (fromX + toX) / 2;
                  const midY = Math.min(fromY, toY) - 3;
                  const pathD = `M${fromX},${fromY} Q${midX},${midY} ${toX},${toY}`;
                  
                  return (
                    <motion.path
                      key={`discovered-link-${node.id}`}
                      d={pathD}
                      stroke="#fbbf2460"
                      strokeWidth="0.4"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray="3,3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.5 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                    />
                  );
                })}
                
                {/* Lines to AI Paths and Discovered Nodes */}
                {showGoldStars && [...discoveredNodes, ...aiPaths].map((path) => {
                  const parent = weeks.find(w => w.id === path.parentId) || discoveredNodes.find(d => d.id === path.parentId);
                  if (!parent) return null;
                  
                  // Get correct X/Y for parent (might be a week or another path)
                  const fromX = (parent as any).position ? (parent as any).position.x : (parent as any).endpoint.x;
                  const fromY = (parent as any).position ? (parent as any).position.y : (parent as any).endpoint.y;
                  
                  // For Discovered nodes, use wrapped positioning to stay on screen
                  const isDiscovered = discoveredNodes.find(d => d.id === path.id);
                  const discoveryIndex = discoveredNodes.findIndex(d => d.id === path.id);
                  const row = Math.floor(discoveryIndex / 3);
                  const col = discoveryIndex % 3;
                  // Position discovered nodes further right (88-98%) to avoid overlap with curriculum weeks
                  const toX = isDiscovered ? (88 + col * 4) : Math.min(path.endpoint.x, 80);
                  const toY = isDiscovered ? (15 + row * 10) : path.endpoint.y;

                  return (
                    <g key={`ai-road-group-${path.id}`}>
                      {/* Main connection line from parent to path - curved */}
                      <motion.path 
                        key={`ai-road-${path.id}`} 
                        d={`M${fromX},${fromY} Q${(fromX + toX) / 2},${Math.min(fromY, toY) - 6} ${toX},${toY}`}
                        stroke={isDiscovered ? "#fbbf24a0" : "#fbbf2460"}
                        strokeWidth={isDiscovered ? "0.5" : "0.3"}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={isDiscovered ? "0" : "3,2"}
                        initial={{ pathLength: 0, opacity: 0 }} 
                        animate={{ pathLength: 1, opacity: isDiscovered ? 0.7 : 0.4 }}
                        transition={{ duration: 0.6 }}
                      />
                      {/* Connection lines from path to its connected weeks - curved and subtle */}
                      {path.connectedWeekIds?.slice(0, 3).map((weekId, idx) => {
                        const week = weeks.find(w => w.id === weekId);
                        if (!week) return null;
                        // Curved path
                        const midX = (toX + week.position.x) / 2;
                        const midY = Math.min(toY, week.position.y) - 4;
                        const pathD = `M${toX},${toY} Q${midX},${midY} ${week.position.x},${week.position.y}`;
                        
                        return (
                          <motion.path
                            key={`path-week-${path.id}-${weekId}`}
                            d={pathD}
                            stroke={isDiscovered ? "#fbbf2460" : "#60a5fa30"}
                            strokeWidth={isDiscovered ? "0.4" : "0.25"}
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={isDiscovered ? "2,2" : "2,3"}
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: isDiscovered ? 0.5 : 0.25, pathLength: 1 }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </AnimatePresence>
            </svg>

            {weeks.map(week => {
              const isCompleted = completedWeeks.includes(week.id);
              const Icon = week.icon;
              const completionOrder = completedWeeks.indexOf(week.id);
              return (
                <motion.button 
                  key={week.id} 
                  onClick={() => toggleWeek(week.id)} 
                  onMouseEnter={() => setHoveredWeek(week.id)} 
                  onMouseLeave={() => setHoveredWeek(null)} 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2" 
                  style={{ left: `${week.position.x}%`, top: `${week.position.y}%` }} 
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div 
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative ${isCompleted ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 shadow-lg shadow-blue-500/40' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600'}`}
                  >
                    <Icon size={16} className={isCompleted ? 'text-white' : 'text-slate-500'} />
                    {/* Week number badge with different colors */}
                    <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border border-black shadow-md ${
                      week.id === 1 ? 'bg-red-500 text-white' :
                      week.id === 2 ? 'bg-orange-500 text-white' :
                      week.id === 3 ? 'bg-yellow-500 text-black' :
                      week.id === 4 ? 'bg-green-500 text-white' :
                      week.id === 5 ? 'bg-cyan-500 text-white' :
                      week.id === 6 ? 'bg-blue-500 text-white' :
                      week.id === 7 ? 'bg-purple-500 text-white' :
                      'bg-pink-500 text-white'
                    }`}>
                      {week.id}
                    </div>
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2 bg-blue-400 text-black text-[7px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
                        {completionOrder + 1}
                      </div>
                    )}
                  </div>
                  <div className={`absolute top-full mt-2 text-[7px] md:text-[9px] font-bold whitespace-nowrap px-2 py-0.5 rounded-full border backdrop-blur-sm ${isCompleted ? 'text-blue-200 bg-blue-950/80 border-blue-500/50' : 'text-slate-400 bg-black/60 border-slate-700'} max-w-[100px] overflow-hidden text-ellipsis`}>
                    {week.skill}
                  </div>
                </motion.button>
              );
            })}

            {/* GOLDEN SKILL NODES - Visual bubbles for golden path skills */}
            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <AnimatePresence>
                {/* Golden paths connecting skill nodes to their parent path */}
                {goldenSkillNodes.map((node, idx) => {
                  const parentPath = discoveredNodes.find(p => p.id === node.parentPathId);
                  if (!parentPath) return null;
                  
                  // Curved path from parent to skill node
                  const midX = (parentPath.endpoint.x + node.position.x) / 2;
                  const midY = (parentPath.endpoint.y + node.position.y) / 2 - 3;
                  const pathD = `M${parentPath.endpoint.x},${parentPath.endpoint.y} Q${midX},${midY} ${node.position.x},${node.position.y}`;
                  
                  return (
                    <motion.path
                      key={`golden-line-${node.id}`}
                      d={pathD}
                      stroke={node.isCompleted ? "#fbbf24c0" : "#fbbf2450"}
                      strokeWidth={node.isCompleted ? "0.5" : "0.3"}
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={node.isCompleted ? "0" : "2,2"}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: node.isCompleted ? 0.8 : 0.4 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    />
                  );
                })}
                
                {/* Golden paths connecting to core curriculum weeks - very subtle */}
                {goldenSkillNodes.slice(0, 4).map((node, idx) => {
                  const parentPath = discoveredNodes.find(p => p.id === node.parentPathId);
                  if (!parentPath || !parentPath.connectedWeekIds) return null;
                  
                  return parentPath.connectedWeekIds.slice(0, 2).map((weekId, connIdx) => {
                    const week = weeks.find(w => w.id === weekId);
                    if (!week) return null;
                    
                    // Curved path
                    const midX = (node.position.x + week.position.x) / 2;
                    const midY = Math.min(node.position.y, week.position.y) - 2;
                    const pathD = `M${node.position.x},${node.position.y} Q${midX},${midY} ${week.position.x},${week.position.y}`;
                    
                    return (
                      <motion.path
                        key={`golden-to-week-${node.id}-${weekId}-${connIdx}`}
                        d={pathD}
                        stroke="#fbbf2430"
                        strokeWidth="0.25"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="1,2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.35 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 + connIdx * 0.05 }}
                      />
                    );
                  });
                })}
                
                {/* Golden paths connecting sequential skill nodes - curved */}
                {goldenSkillNodes.map((node, idx) => {
                  if (idx === 0) return null;
                  const prevNode = goldenSkillNodes[idx - 1];
                  if (prevNode.parentPathId !== node.parentPathId) return null;
                  
                  // Curved path between skill nodes
                  const midX = (prevNode.position.x + node.position.x) / 2;
                  const midY = (prevNode.position.y + node.position.y) / 2 - 2;
                  const pathD = `M${prevNode.position.x},${prevNode.position.y} Q${midX},${midY} ${node.position.x},${node.position.y}`;
                  
                  return (
                    <motion.path
                      key={`golden-skill-line-${node.id}`}
                      d={pathD}
                      stroke="#fbbf2480"
                      strokeWidth="0.4"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray="2,2"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    />
                  );
                })}
              </AnimatePresence>
            </svg>

            {/* Golden Skill Node Bubbles */}
            <AnimatePresence>
              {goldenSkillNodes.map((node, idx) => (
                <motion.button
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-40"
                  style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setGoldenSkillNodes(prev => prev.map(n => 
                      n.id === node.id ? { ...n, isCompleted: !n.isCompleted } : n
                    ));
                  }}
                >
                  <div 
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative ${node.isCompleted ? 'shadow-lg shadow-amber-500/50' : ''}`}
                    style={{
                      borderColor: node.isCompleted ? '#fbbf24' : 'rgba(245,158,11,0.5)',
                      background: node.isCompleted 
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                        : 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(30,41,59,0.8) 100%)',
                      boxShadow: node.isCompleted 
                        ? '0 0 20px rgba(251,191,36,0.7), 0 0 40px rgba(251,191,36,0.4), inset 0 1px 2px rgba(255,255,255,0.3)' 
                        : '0 0 10px rgba(245,158,11,0.3), inset 0 1px 2px rgba(255,255,255,0.1)'
                    }}
                  >
                    <span className="text-[9px] md:text-[11px] drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]">★</span>
                    {/* Pulsing glow for completed */}
                    {node.isCompleted && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-amber-300"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                  </div>
                  <div className={`absolute top-full mt-1.5 text-[6px] md:text-[7px] font-bold whitespace-nowrap px-2 py-0.5 rounded-full max-w-[70px] overflow-hidden text-ellipsis transition-colors border backdrop-blur-sm ${node.isCompleted ? 'text-amber-300 bg-amber-950/80 border-amber-500/50' : 'text-slate-400 bg-black/70 border-slate-700'}`}>
                    {node.name}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {/* AI Paths (undiscovered) - always visible */}
              {aiPaths.map((path) => {
                return (
                  <motion.button 
                    key={path.id} 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-50" 
                    style={{ left: `${Math.min(path.endpoint.x, 85)}%`, top: `${path.endpoint.y}%` }} 
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.3, rotate: 10, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredPath(path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // First discovery - add to discovered nodes
                      setDiscoveredNodes(prev => [...prev, path]);
                      setAiPaths([]);
                      setLastCombo(""); 
                      
                      // Create GOLDEN SKILL NODES on the map - like week bubbles but gold
                      if (path.goldenSkills && path.goldenSkills.length > 0) {
                        const newGoldenNodes: GoldenSkillNode[] = path.goldenSkills.map((skill, idx) => ({
                          id: `golden-${path.id}-${idx}`,
                          name: skill,
                          parentPathId: path.id,
                          position: { 
                            // Position spread out to avoid overcrowding
                            x: path.endpoint.x + 10 + (idx % 3) * 6, 
                            y: path.endpoint.y + (idx * 12) - (path.goldenSkills!.length * 4)
                          },
                          training: path.goldenTraining?.find(t => t.skill === skill) 
                            ? { 
                                course: path.goldenTraining.find(t => t.skill === skill)!.course,
                                platform: path.goldenTraining.find(t => t.skill === skill)!.platform,
                                url: path.goldenTraining.find(t => t.skill === skill)!.url
                              } 
                            : undefined,
                          isCompleted: false
                        }));
                        setGoldenSkillNodes(prev => [...prev, ...newGoldenNodes]);
                      }
                    }}
                  >
                    <div 
                      className="w-5 h-5 md:w-7 md:h-7 rounded-lg flex items-center justify-center border-2 relative"
                      style={{ 
                        borderColor: path.color,
                        background: `linear-gradient(135deg, ${path.color}30 0%, ${path.color}10 100%)`,
                        boxShadow: `0 0 10px ${path.color}50`
                      }}
                    >
                      <Star size={14} color={path.color} fill={path.color} fillOpacity={0.3} />
                    </div>
                    {/* Title label - only on initial AI paths */}
                    <div className="absolute top-full mt-1 text-[7px] font-bold text-amber-400 uppercase whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {path.name.length > 15 ? path.name.substring(0, 15) + '...' : path.name}
                    </div>
                  </motion.button>
                );
              })}
              
              {/* Discovered Nodes (gold stars) - only visible when showGoldStars is true */}
              {showGoldStars && discoveredNodes.map((path) => {
                const discoveryIndex = discoveredNodes.findIndex(d => d.id === path.id);
                // Spread discovered nodes with more spacing - 2 per row
                const row = Math.floor(discoveryIndex / 2);
                const col = discoveryIndex % 2;
                // Position discovered nodes further right (96-102%) with more vertical spacing
                const xPos = 96 + col * 4;
                const yPos = 12 + row * 14;
                
                return (
                  <motion.button 
                    key={path.id} 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-50" 
                    style={{ left: `${xPos}%`, top: `${yPos}%` }} 
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.25, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredPath(path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Generate new branches from this discovered path (unlimited branching!)
                      setCompletedWeeks(prev => {
                        const newWeeks = path.connectedWeekIds?.filter(id => !prev.includes(id)) || [];
                        return [...prev, ...newWeeks];
                      });
                    }}
                  >
                    <div 
                      className="w-5 h-5 md:w-7 md:h-7 rounded-lg flex items-center justify-center border-2 relative"
                      style={{ 
                        borderColor: path.color,
                        background: `linear-gradient(135deg, ${path.color}40 0%, ${path.color}15 100%)`,
                        boxShadow: `0 0 20px ${path.color}80, 0 0 40px ${path.color}40, inset 0 1px 2px rgba(255,255,255,0.3)`
                      }}
                    >
                      <Star size={14} color={path.color} fill={path.color} fillOpacity={0.5} />
                    </div>
                    {/* On Road to Skill - shown when tapped/activated */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-bold text-emerald-400 whitespace-nowrap bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      On Road to Skill
                    </div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[7px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] shadow-lg border border-blue-400/30">
                      Click to branch further
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-600"></div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Discoveries Panel - Collapsible */}
        <motion.div 
          className={`flex flex-col gap-3 overflow-hidden shrink-0 ${isTrajectoryPanelOpen ? 'w-56 md:w-80' : 'w-10'}`}
          animate={{ width: isTrajectoryPanelOpen ? (window.innerWidth >= 768 ? 320 : 224) : 40 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl backdrop-blur-md flex-grow overflow-hidden relative">
            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setIsTrajectoryPanelOpen(!isTrajectoryPanelOpen)}
              className="absolute top-2 right-2 z-10 w-6 h-6 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 rounded flex items-center justify-center transition-all"
              title={isTrajectoryPanelOpen ? "Collapse Panel" : "Expand Panel"}
            >
              {isTrajectoryPanelOpen ? <ChevronRight size={14} className="text-amber-400" /> : <ChevronLeft size={14} className="text-amber-400" />}
            </button>
            
            {isTrajectoryPanelOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="h-full overflow-y-auto custom-scrollbar"
              >
                <h2 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2 pr-8">
                  <Sparkles size={12} /> CAREER HORIZONS 
                  {aiPaths.length > 0 && <span className="bg-amber-500/30 px-2 py-0.5 rounded-full text-[9px]">{aiPaths.length}</span>} 
                  {isGenerating && <span className="animate-pulse">...</span>}
                </h2>
                <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {aiPaths.length === 0 ? (<div className="text-slate-500 text-[9px] italic text-center py-8">Waiting for skills to analyze...</div>) : (
                  aiPaths.map(path => {
                    const isCollapsed = collapsedCards.has(path.id);
                    return (
                    <motion.div key={path.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-black/60 border border-amber-500/20 p-2.5 rounded-lg relative group">
                      {/* Header with Collapse Toggle */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
                          <Star size={10} className="text-amber-400" />
                          {path.name}
                        </div>
                        <button
                          onClick={() => {
                            const newCollapsed = new Set(collapsedCards);
                            if (isCollapsed) {
                              newCollapsed.delete(path.id);
                            } else {
                              newCollapsed.add(path.id);
                            }
                            setCollapsedCards(newCollapsed);
                          }}
                          className="w-5 h-5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/30 rounded flex items-center justify-center transition-all"
                          title={isCollapsed ? "Expand" : "Collapse"}
                        >
                          {isCollapsed ? <ChevronLeft size={12} className="text-amber-400 rotate-180" /> : <ChevronLeft size={12} className="text-amber-400 -rotate-90" />}
                        </button>
                      </div>
                      
                      {/* Collapsible Content */}
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                      <div className="text-[8px] text-slate-400 leading-relaxed mb-3">{path.description}</div>
                      <div className="flex gap-1 mb-3">
                        <button onClick={() => openJobSearch('indeed', path.searchQuery || '')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-[7px] font-black p-1 rounded uppercase transition-colors">Indeed</button>
                        <button onClick={() => openJobSearch('linkedin', path.searchQuery || '')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-[7px] font-black p-1 rounded uppercase transition-colors">LinkedIn</button>
                      </div>

                      {path.requiredSkills && path.requiredSkills.length > 0 && (
                        <div className="mb-2 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                          <div className="text-[7px] font-black text-amber-400 uppercase tracking-widest mb-1">Required Skills ({path.requiredSkills.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {path.requiredSkills.map((skill, i) => (
                              <span key={i} className="text-[6px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded uppercase">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {path.connectedWeekIds && path.connectedWeekIds.length > 0 && (
                        <div className="mb-2 bg-blue-500/10 p-1.5 rounded border border-blue-500/20">
                          <div className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">Connects to Weeks</div>
                          <div className="flex flex-wrap gap-1">
                            {path.connectedWeekIds.map((weekId, i) => (
                              <span key={i} className="text-[6px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-bold">W{weekId}</span>
                            ))}
                          </div>
                          <div className="text-[6px] text-blue-400/70 mt-1 italic">Click path on map to unlock these weeks</div>
                        </div>
                      )}

                      {/* GOLDEN PATH - Skills not in curriculum */}
                      {path.goldenSkills && path.goldenSkills.length > 0 && (
                        <div className="mb-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 p-2.5 rounded-lg border-2 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                              <span className="text-[10px]">★</span>
                            </div>
                            <div className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Golden Path Skills</div>
                            <span className="text-[7px] text-amber-400/70 italic">(Beyond Curriculum)</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {path.goldenSkills.map((skill, i) => (
                              <span key={i} className="text-[7px] bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-200 px-2 py-1 rounded-lg font-bold uppercase border border-amber-400/30 shadow-sm">{skill}</span>
                            ))}
                          </div>
                          
                          {path.goldenTraining && path.goldenTraining.length > 0 && (
                            <div className="mt-2 bg-black/40 p-2 rounded border border-amber-500/20">
                              <div className="text-[7px] font-black text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <span>🎓</span> Golden Training
                              </div>
                              <div className="space-y-1.5">
                                {path.goldenTraining.map((training, i) => (
                                  <a key={i} href={training.url} target="_blank" rel="noopener noreferrer" className="flex flex-col group/link bg-amber-500/10 p-1.5 rounded hover:bg-amber-500/20 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[7px] text-amber-200 font-bold group-hover/link:text-amber-100 transition-colors truncate max-w-[70%]">{training.course}</span>
                                      <span className="text-[6px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded uppercase">{training.platform}</span>
                                    </div>
                                    <span className="text-[6px] text-amber-400/60 italic mt-0.5">for: {training.skill}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {path.courses && path.courses.length > 0 && (
                        <div className="mb-3 bg-white/5 p-2 rounded border border-white/5">
                          <div className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">Recommended Training</div>
                          <div className="space-y-1">
                            {path.courses.map((course, i) => (
                              <a key={i} href={course.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group/link">
                                <span className="text-[7px] text-slate-300 group-hover/link:text-blue-300 transition-colors truncate max-w-[80%]">{course.title}</span>
                                <span className="text-[6px] text-slate-500 uppercase">{course.platform}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 border-t border-slate-800 pt-2">
                        <span className="text-[7px] text-slate-500 uppercase mr-1">Bridge:</span>
                        {path.additionalSkills.map((s, i) => (<span key={i} className="text-[7px] text-amber-500 font-bold uppercase">{s}</span>))}
                      </div>
                        </motion.div>
                      )}
                    </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>

          {isTrajectoryPanelOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-2 shrink-0"
            >
              {staticPaths.map(path => {
                const progress = getPathProgress(path);
                const isUnlocked = progress === 100;
                return (
                  <div key={path.id} className="bg-slate-900/50 border border-slate-800 p-2.5 rounded-lg">
                    <div className="flex justify-between items-center mb-1"><span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{path.name}</span><span className="text-[8px] text-slate-500">{Math.round(progress)}%</span></div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-2"><motion.div className="h-full" style={{ backgroundColor: path.color }} animate={{ width: `${progress}%` }} /></div>
                    {isUnlocked && (<div className="flex gap-1">
                      <button onClick={() => openJobSearch('indeed', path.searchQuery || '')} className="flex-1 bg-indigo-600/40 hover:bg-indigo-600 text-[6px] font-black p-1 rounded uppercase transition-colors">Indeed</button>
                      <button onClick={() => openJobSearch('linkedin', path.searchQuery || '')} className="flex-1 bg-blue-600/40 hover:bg-blue-600 text-[6px] font-black p-1 rounded uppercase transition-colors">LinkedIn</button>
                    </div>)}
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
