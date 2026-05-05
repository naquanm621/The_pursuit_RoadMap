import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const Paths: React.FC = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [careerPath, setCareerPath] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const availableSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'UI/UX Design', 'SQL', 'Cloud Deployment'];

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const generatePath = async () => {
    if (selectedSkills.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/career-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: selectedSkills }),
      });
      const data = await response.json();
      setCareerPath(data);
    } catch (error) {
      console.error("Failed to generate path", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-purple-400 mb-4 flex items-center gap-2">
        <Sparkles /> Career Path Combinator
      </h1>
      <p className="text-gray-400 mb-8">Select multiple skills to see how they combine into a unique career trajectory.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Skill Selector */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Select Skills</h2>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  selectedSkills.includes(skill) 
                    ? 'bg-purple-600 border-purple-400 text-white' 
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-purple-500'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
          <button
            onClick={generatePath}
            disabled={selectedSkills.length === 0 || loading}
            className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded font-bold flex items-center justify-center gap-2 transition"
          >
            {loading ? 'Analyzing...' : 'Generate Path'}
          </button>
        </div>

        {/* Result Area */}
        <div className="md:col-span-2">
          {careerPath ? (
            <div className="bg-gray-800 p-8 rounded-xl border border-purple-500/50 shadow-2xl animate-fade-in">
              <h2 className="text-3xl font-bold text-white mb-2">{careerPath.careerTitle}</h2>
              <p className="text-purple-300 italic mb-6">{careerPath.description}</p>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-200">Recommended Milestones:</h3>
                {careerPath.milestones.map((milestone: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-900/50 p-4 rounded border border-gray-700">
                    <div className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-gray-300">{milestone}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center p-12 text-gray-500">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <p>Select your skills and click "Generate Path" to see your future.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Paths;
