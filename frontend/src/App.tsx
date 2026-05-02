import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Brain, Code, Database, Cpu, Globe, Rocket, Terminal, Layers, Star, ExternalLink, Briefcase, Search, GraduationCap, Plus, X, ArrowRight, Eye, EyeOff, Lock, User, Send, MessageSquare, History, LogOut } from 'lucide-react';

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
  { weeks: 2, likelihood: '5%', status: 'Novice' },
  { weeks: 4, likelihood: '20%', status: 'Apprentice' },
  { weeks: 6, likelihood: '55%', status: 'Job Ready' },
  { weeks: 8, likelihood: '85%', status: 'Professional' },
];

type AppView = 'login' | 'onboarding' | 'roadmap' | 'log';

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [aiPaths, setAiPaths] = useState<CareerPath[]>([]);
  const [discoveredNodes, setDiscoveredNodes] = useState<CareerPath[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastCombo, setLastCombo] = useState("");
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  
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

    try {
      const curriculumSkills = weeks.filter(w => completedWeeks.includes(w.id)).map(w => w.skill);
      const allSkills = [...previousSkills, ...curriculumSkills];

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: chatMessages,
          skills: allSkills
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'model', parts: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsChatLoading(false);
    }
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
        const response = await fetch('http://localhost:3000/api/trajectory', {
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

            const response = await fetch('http://localhost:3000/api/career-path', {
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
                endpoint: { x: item.x || 92, y: item.y || (10 + idx * 25) },
                isAI: true,
                description: item.description,
                searchQuery: item.indeedQuery || item.careerTitle,
                parentId: lastNode ? lastNode.id : lastWeekId,
                courses: item.topCourses || []
              }));
              setAiPaths(newPaths);
            }
          } catch (error) {
            console.error('Dynamic Branching Failed', error);
          } finally {
            setIsGenerating(false);
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
      case 'glassdoor': url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}`; break;
    }
    window.open(url, '_blank');
  };

  const getPathProgress = (path: CareerPath) => {
    const completed = path.requiredWeeks.filter(week => completedWeeks.includes(week)).length;
    return (completed / path.requiredWeeks.length) * 100;
  };

  const currentPrediction = useMemo(() => {
    const count = completedWeeks.length;
    return [...predictionData].reverse().find(p => count >= p.weeks) || { likelihood: '0%', status: 'Learning' };
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
          <button onClick={() => setView('roadmap')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">Generate My Roadmap <ArrowRight size={18} /></button>
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
            <div><h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Journey Log</h1><p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">AI Tutor & Logger Active</p></div>
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
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden flex flex-col p-4 md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>

      {/* Top HUD */}
      <div className="flex flex-row justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 leading-tight">
            PURSUIT ROADMAP
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-blue-300/50 uppercase font-bold tracking-widest">
              {completedWeeks.length}/8 WEEKS COMPLETED
            </span>
            <button onClick={() => setView('log')} className="flex items-center gap-1.5 ml-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[9px] font-black px-3 py-1 rounded-full border border-blue-500/20 transition-all uppercase tracking-widest italic">
              <MessageSquare size={12} /> Open Journey Log
            </button>
          </div>
        </div>
        
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-2 md:p-3 rounded-lg backdrop-blur-md flex items-center gap-3">
          <div className="text-right">
            <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">LIKELIHOOD</div>
            <div className="text-xl md:text-2xl font-black text-white leading-none">{currentPrediction.likelihood}</div>
          </div>
          <div className="h-8 w-px bg-indigo-500/30"></div>
          <div className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded uppercase tracking-tighter">
            {currentPrediction.status}
          </div>
        </div>
      </div>

      <div className="flex flex-grow gap-4 min-h-0">
        <div className="relative flex-grow border border-blue-500/20 rounded-xl bg-black/40 backdrop-blur-sm overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div 
            className="relative h-full min-h-[500px] transition-all duration-1000" 
            style={{ minWidth: `${Math.max(100, (discoveredNodes.length / 2) * 40 + 100)}%` }}
          >
            {/* Skill Review Banner Overlay */}
            <AnimatePresence>
              {hoveredWeek !== null && (
                <div className="sticky left-1/2 -translate-x-1/2 z-[60] top-4 pointer-events-none">
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-[300px]">
                    <div className="bg-slate-900/95 border border-blue-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-2"><GraduationCap className="text-blue-400" size={18} /><h3 className="text-xs font-black text-white uppercase tracking-wider">Skill Review: {weeks.find(w => w.id === hoveredWeek)?.title}</h3></div>
                      <div className="space-y-1.5">{weeks.find(w => w.id === hoveredWeek)?.review.map((item, i) => (<div key={i} className="flex items-center gap-2 text-[10px] text-slate-300"><div className="w-1 h-1 rounded-full bg-blue-500" />{item}</div>))}</div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs><filter id="glow"><feGaussianBlur stdDeviation="1" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="roadGradient"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
              <AnimatePresence>
                {completedWeeks.map((weekId, idx) => {
                  if (idx === 0) return null;
                  const from = weeks.find(w => w.id === completedWeeks[idx - 1]);
                  const to = weeks.find(w => w.id === weekId);
                  if (!from || !to) return null;
                  return (<motion.line key={`order-road-${from.id}-${to.id}`} x1={`${from.position.x}%`} y1={`${from.position.y}%`} x2={`${to.position.x}%`} y2={`${to.position.y}%`} stroke="url(#roadGradient)" strokeWidth="0.8" filter="url(#glow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />);
                })}
                {/* Lines to AI Paths and Discovered Nodes */}
                {[...discoveredNodes, ...aiPaths].map((path) => {
                  const parent = weeks.find(w => w.id === path.parentId) || discoveredNodes.find(d => d.id === path.parentId);
                  if (!parent) return null;
                  
                  // Get correct X/Y for parent (might be a week or another path)
                  const fromX = (parent as any).position ? (parent as any).position.x : (parent as any).endpoint.x;
                  const fromY = (parent as any).position ? (parent as any).position.y : (parent as any).endpoint.y;
                  
                  // For Discovered nodes, use their calculated xPos
                  const isDiscovered = discoveredNodes.find(d => d.id === path.id);
                  const discoveryIndex = discoveredNodes.findIndex(d => d.id === path.id);
                  const toX = isDiscovered ? (92 + (discoveryIndex + 1) * 15) : path.endpoint.x;
                  const toY = path.endpoint.y;

                  return (
                    <motion.line 
                      key={`ai-road-${path.id}`} 
                      x1={`${fromX}%`} y1={`${fromY}%`} 
                      x2={`${toX}%`} y2={`${toY}%`} 
                      stroke="#fbbf2466" 
                      strokeWidth="0.5" 
                      strokeDasharray="2,2"
                      initial={{ pathLength: 0 }} 
                      animate={{ pathLength: 1 }} 
                    />
                  );
                })}
              </AnimatePresence>
            </svg>

            {weeks.map(week => {
              const isCompleted = completedWeeks.includes(week.id);
              const Icon = week.icon;
              const completionOrder = completedWeeks.indexOf(week.id);
              return (
                <motion.button key={week.id} onClick={() => toggleWeek(week.id)} onMouseEnter={() => setHoveredWeek(week.id)} onMouseLeave={() => setHoveredWeek(null)} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${week.position.x}%`, top: `${week.position.y}%` }} whileHover={{ scale: 1.15 }}>
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-900 border-slate-700'}`}>
                    <Icon size={16} className={isCompleted ? 'text-white' : 'text-slate-500'} />
                    {isCompleted && (<div className="absolute -top-2 -right-2 bg-blue-400 text-black text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-lg">{completionOrder + 1}</div>)}
                  </div>
                  <div className="absolute top-full mt-1 text-[7px] md:text-[9px] font-bold text-slate-400 whitespace-nowrap bg-black/60 px-1 rounded max-w-[80px] overflow-hidden text-ellipsis">{week.skill}</div>
                </motion.button>
              );
            })}

            <AnimatePresence>
              {[...discoveredNodes, ...aiPaths].map((path) => {
                const isDiscovered = discoveredNodes.find(d => d.id === path.id);
                const discoveryIndex = discoveredNodes.findIndex(d => d.id === path.id);
                const xPos = isDiscovered ? (92 + (discoveryIndex + 1) * 15) : path.endpoint.x;
                
                return (
                  <motion.button 
                    key={path.id} 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-50" 
                    style={{ left: `${xPos}%`, top: `${path.endpoint.y}%` }} 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    onClick={() => {
                      if (!isDiscovered) {
                        setDiscoveredNodes(prev => [...prev, path]);
                        setAiPaths([]);
                        setLastCombo(""); 
                      }
                    }}
                  >
                    <div 
                      className={`w-6 h-6 md:w-9 md:h-9 rounded-lg flex items-center justify-center border-2 ${!isDiscovered ? 'animate-pulse' : 'shadow-[0_0_20px_rgba(251,191,36,0.4)]'}`} 
                      style={{ borderColor: path.color, backgroundColor: `${path.color}20` }}
                    >
                      {path.isAI ? <Star size={16} color={path.color} /> : <Rocket size={16} color={path.color} />}
                    </div>
                    {isDiscovered && (
                      <div className="absolute top-full mt-1 text-[8px] font-black text-amber-400 uppercase tracking-tighter whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-amber-500/30">
                        {path.name}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Discoveries Panel */}
        <div className="w-56 md:w-80 flex flex-col gap-3 overflow-hidden shrink-0">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl backdrop-blur-md flex-grow overflow-y-auto custom-scrollbar">
            <h2 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={12} /> AI TRAJECTORIES {isGenerating && <span className="animate-pulse">...</span>}</h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {aiPaths.length === 0 ? (<div className="text-slate-500 text-[9px] italic text-center py-8">Waiting for skills to analyze...</div>) : (
                  aiPaths.map(path => (
                    <motion.div key={path.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-black/60 border border-amber-500/20 p-2.5 rounded-lg relative group">
                      <div className="text-[10px] font-bold text-white mb-1 uppercase tracking-tight">{path.name}</div>
                      <div className="text-[8px] text-slate-400 leading-relaxed mb-3">{path.description}</div>
                      <div className="flex gap-1 mb-3">
                        <button onClick={() => openJobSearch('indeed', path.searchQuery || '')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-[7px] font-black p-1 rounded uppercase transition-colors">Indeed</button>
                        <button onClick={() => openJobSearch('linkedin', path.searchQuery || '')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-[7px] font-black p-1 rounded uppercase transition-colors">LinkedIn</button>
                        <button onClick={() => openJobSearch('glassdoor', path.searchQuery || '')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-[7px] font-black p-1 rounded uppercase transition-colors">Glassdoor</button>
                      </div>

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

                      <div className="flex flex-wrap gap-1 border-t border-slate-800 pt-2">{path.additionalSkills.map((s, i) => (<span key={i} className="text-[7px] text-amber-500 font-bold uppercase">{s}</span>))}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 shrink-0">
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
          </div>
        </div>
      </div>
    </div>
  );
}
