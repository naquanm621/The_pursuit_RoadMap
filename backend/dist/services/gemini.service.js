import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import dotenv from 'dotenv';
import * as duckDuckScrape from 'duck-duck-scrape';
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
function makeSearchUrl(platform, skill) {
    const q = encodeURIComponent(skill);
    if (platform.toLowerCase().includes('udemy')) {
        return `https://www.udemy.com/courses/search/?q=${q}`;
    }
    return `https://www.coursera.org/search?query=${q}`;
}
function fixTrainingUrls(paths) {
    return paths.map(path => ({
        ...path,
        goldenTraining: (path.goldenTraining || []).map((t) => ({
            ...t,
            url: makeSearchUrl(t.platform || 'Coursera', t.skill || t.course || '')
        })),
        topCourses: (path.topCourses || []).map((c) => ({
            ...c,
            url: makeSearchUrl(c.platform || 'Coursera', c.title || '')
        }))
    }));
}
export class GeminiService {
    static async runWithModelFallback(primaryModelName, execute) {
        try {
            const model = genAI.getGenerativeModel({ model: primaryModelName });
            return await execute(model);
        }
        catch (error) {
            if (error.message?.includes('429') && primaryModelName !== 'gemini-flash-lite-latest') {
                console.warn(`[Fallback] ${primaryModelName} rate limited. Retrying with gemini-flash-lite-latest...`);
                const fallbackModel = genAI.getGenerativeModel({
                    model: 'gemini-flash-lite-latest',
                    tools: [{ googleSearch: {} }]
                });
                return await execute(fallbackModel);
            }
            throw error;
        }
    }
    static async processScreenshots(imagePaths) {
        return this.runWithModelFallback('gemini-flash-lite-latest', async (model) => {
            const imageParts = imagePaths
                .filter(path => fs.existsSync(path) && !path.endsWith('.DS_Store'))
                .map(path => ({
                inlineData: {
                    data: Buffer.from(fs.readFileSync(path)).toString("base64"),
                    mimeType: "image/png",
                },
            }));
            if (imageParts.length === 0)
                return { weeks: [] };
            const prompt = `Analyze these curriculum screenshots and extract a structured JSON syllabus. 
      Include: Week Number, Topic Name, and specific Skills learned. 
      Return ONLY valid JSON in this format: { "weeks": [{ "number": 1, "topic": "...", "skills": ["...", "..."] }] }`;
            const result = await model.generateContent([prompt, ...imageParts]);
            return JSON.parse(result.response.text().replace(/```json|```/g, ''));
        });
    }
    static async getChatResponse(message, history, trajectoryName = "AI Explorer") {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-lite-latest",
                systemInstruction: `You are the Pursuit Build Instructor and MVP Specialist. 
        Your primary goal is to help students brainstorm "Build Ideas" and scope their "MVPs" (Minimum Viable Products).
        Current User Trajectory: "${trajectoryName}".
        Analyze their 'Learned Skills', suggest 2-3 project ideas that ALIGN with their trajectory, and define the 'Core MVP'.`
            });
            const formattedHistory = history.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.parts }]
            }));
            const chat = model.startChat({
                history: formattedHistory,
                generationConfig: { maxOutputTokens: 500 }
            });
            const result = await chat.sendMessage(message);
            return result.response.text();
        }
        catch (error) {
            console.error('Chat API Error:', error.message);
            const fallbacks = [
                "Pursuit Build Instructor: I've logged your request for build assistance. Tell me: what problem do you want to solve?",
                "I'm here to help you scope your MVP. Should we focus on a Frontend or Full-Stack idea?",
                "Build mode active. Let's brainstorm: what app would make your portfolio stand out?",
                "MVP Scoping: What is the one thing your app MUST do? Let's strip it down to the core.",
                "Instructor Note: You've got the foundations. Ask me for a project idea based on your skills!"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
    static async searchDuckDuckGo(query) {
        try {
            const searchResults = await duckDuckScrape.search(query, {
                safeSearch: duckDuckScrape.SafeSearchType.STRICT
            });
            const results = Array.isArray(searchResults) ? searchResults : searchResults.results || [];
            return results.slice(0, 5).map((r) => `${r.title}: ${r.description}`).join('\n');
        }
        catch (error) {
            console.error('DuckDuckGo search error:', error);
            return '';
        }
    }
    static async matchJobDescription(jobDescription, skills) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            const prompt = `You are a career coach analyzing a student's skills against a job description.

Student's current skills: [${skills.join(', ')}]

Job Description:
"""
${jobDescription.slice(0, 3000)}
"""

Analyze the match and return ONLY a JSON object with this exact structure:
{
  "matchScore": <number 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "suggestedPath": "<one career title that best fits this JD>",
  "recommendation": "<2-3 sentences: how close they are, what to focus on next, encouragement>"
}

Rules:
- matchedSkills: skills the student HAS that are relevant to the JD (pull from their skills list)
- missingSkills: important skills the JD requires that the student doesn't yet have (max 6)
- matchScore: realistic percentage based on overlap
- recommendation: practical, specific, motivating`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON in response');
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            console.error('JD match error:', error.message);
            return {
                matchScore: 0,
                matchedSkills: [],
                missingSkills: [],
                suggestedPath: 'Unable to analyze',
                recommendation: 'Could not analyze the job description. Please try again.'
            };
        }
    }
    static async getCombinedCareerPath(skills, gaps = [], trajectoryName = "AI Explorer", existingTitles = []) {
        try {
            const searchQuery = `${trajectoryName} AI job careers 2025 Coursera Udemy courses`;
            const searchResults = await this.searchDuckDuckGo(searchQuery);
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            const prompt = `Given these achieved skills: [${skills.join(', ')}] and these MISSED skills: [${gaps.join(', ')}],
        and the user's current trajectory: "${trajectoryName}".
        
        EXISTING CAREERS (DO NOT REPEAT THESE): [${existingTitles.join(', ')}]
        
        Use this web search data to inform your response:
        ${searchResults}
        
        CURRICULUM WEEK SKILLS (don't repeat these in goldenSkills): 
        Week 1: AI Fundamentals, Week 2: Foundations & Automation, Week 3: Problem ID & Ideation, Week 4: Workflow Automation,
        Week 5: Data & Integration, Week 6: UX & polish, Week 7: Scale & Optimize, Week 8: Launch & Strategy
        
        Generate 8-12 UNIQUE career paths that are DIFFERENT from the existing ones. Each path should have distinct skill requirements and connect to different weeks.
        Return ONLY a JSON array of objects with this structure:
        [
          {
            "careerTitle": "...",
            "description": "...",
            "bridgeSuggestion": "...",
            "leapSuggestion": "...",
            "indeedQuery": "...",
            "requiredSkills": ["skill1", "skill2", "skill3", "skill4"],
            "goldenSkills": ["NewSkill1", "NewSkill2", "NewSkill3"],
            "goldenTraining": [
              { "skill": "NewSkill1", "course": "Course Name", "platform": "Coursera or Udemy" }
            ],
            "connectedWeekIds": [1, 3, 5],
            "x": 92,
            "y": 10
          }
        ]
        REQUIRED FIELDS:
        - requiredSkills: Array of 4-6 specific technical skills needed
        - goldenSkills: Array of 3-5 skills NOT covered in the week curriculum above
        - goldenTraining: Array of training recommendations for each golden skill with course name and platform (Coursera or Udemy only). Do NOT include urls — they will be generated automatically.
        - connectedWeekIds: Array of 2-4 week numbers (1-8) that naturally connect to this path based on skills
        
        Create diverse career paths across: Frontend, Backend, Full Stack, AI/ML, DevOps, Product Management, Data Engineering, Cloud Architecture, Security, Mobile, etc.
        goldenSkills must be NEW skills not in the week curriculum - these form the "golden path" unique to this trajectory.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                throw new Error("Failed to extract JSON from AI response");
            const parsed = JSON.parse(jsonMatch[0]);
            return fixTrainingUrls(parsed);
        }
        catch (error) {
            console.error('Gemini API Error, using enhanced fallbacks:', error.message);
            const cleanTrajectory = trajectoryName.replace(/Specialist/g, '').trim();
            return fixTrainingUrls([
                {
                    careerTitle: `${cleanTrajectory} Lead`,
                    description: `Advanced technical leadership in ${cleanTrajectory}.`,
                    bridgeSuggestion: "Master Core Domain",
                    leapSuggestion: "Lead Complex Projects",
                    indeedQuery: `${cleanTrajectory} Lead`,
                    requiredSkills: ["AI Fundamentals", "System Design", "Team Leadership", "Architecture Patterns", "Mentoring"],
                    goldenSkills: ["Engineering Management", "Technical Strategy", "Cross-functional Collaboration"],
                    goldenTraining: [
                        { skill: "Engineering Management", course: "Software Engineering Management", platform: "Coursera" },
                        { skill: "Technical Strategy", course: "Digital Transformation", platform: "Coursera" }
                    ],
                    connectedWeekIds: [1, 2, 7], x: 92, y: 15
                },
                {
                    careerTitle: "AI Solution Architect",
                    description: "Designing scalable AI systems and infrastructure.",
                    bridgeSuggestion: "Deep Architecture Knowledge",
                    leapSuggestion: "Enterprise AI Design",
                    indeedQuery: "AI Solution Architect",
                    requiredSkills: ["AI Architecture", "System Design", "Cloud Infrastructure", "API Design", "Kubernetes", "Microservices"],
                    goldenSkills: ["Enterprise Patterns", "Multi-cloud Strategy", "AI Governance"],
                    goldenTraining: [
                        { skill: "Enterprise Patterns", course: "Cloud Architecture with Google Cloud", platform: "Coursera" },
                        { skill: "Multi-cloud Strategy", course: "AWS Cloud Solutions Architect", platform: "Coursera" }
                    ],
                    connectedWeekIds: [1, 2, 5, 7], x: 92, y: 22
                },
                {
                    careerTitle: "Technical Product Manager",
                    description: "Leading AI product development and strategy.",
                    bridgeSuggestion: "Business Acumen",
                    leapSuggestion: "AI Product Strategy",
                    indeedQuery: "Technical Product Manager AI",
                    requiredSkills: ["Problem ID", "UX/UI Principles", "Agile Methodologies", "Stakeholder Management", "Roadmapping", "Analytics"],
                    goldenSkills: ["Product Metrics", "Market Analysis", "Pricing Strategy"],
                    goldenTraining: [
                        { skill: "Product Metrics", course: "Product Management", platform: "Coursera" },
                        { skill: "Market Analysis", course: "Business Strategy", platform: "Coursera" }
                    ],
                    connectedWeekIds: [3, 6, 8], x: 92, y: 29
                },
                {
                    careerTitle: "Full Stack AI Engineer",
                    description: "End-to-end AI application development.",
                    bridgeSuggestion: "Full Stack Mastery",
                    leapSuggestion: "AI Integration Expert",
                    indeedQuery: "Full Stack AI Engineer",
                    requiredSkills: ["React", "Node.js", "Database Management", "AI APIs", "Deployment", "TypeScript", "GraphQL"],
                    goldenSkills: ["Vector Databases", "LangChain", "AI SDKs"],
                    goldenTraining: [
                        { skill: "Vector Databases", course: "LangChain and Vector Databases", platform: "Udemy" },
                        { skill: "LangChain", course: "LangChain Masterclass", platform: "Udemy" }
                    ],
                    connectedWeekIds: [2, 3, 5, 6], x: 92, y: 36
                },
                {
                    careerTitle: "AI Automation Expert",
                    description: "Building intelligent automation systems.",
                    bridgeSuggestion: "Workflow Mastery",
                    leapSuggestion: "AI Agent Architecture",
                    indeedQuery: "AI Automation Engineer",
                    requiredSkills: ["Workflow Automation", "Python", "API Integration", "Process Design", "RPA", "LLM Orchestration"],
                    goldenSkills: ["AutoGPT Agent Frameworks", "n8n Advanced", "Intelligent Document Processing"],
                    goldenTraining: [
                        { skill: "AutoGPT Agent Frameworks", course: "AI Agents in LangChain", platform: "Udemy" },
                        { skill: "n8n Advanced", course: "Zapier Automation", platform: "Udemy" }
                    ],
                    connectedWeekIds: [2, 4, 5], x: 92, y: 43
                },
                {
                    careerTitle: "Frontend AI Specialist",
                    description: "AI-powered user interfaces and experiences.",
                    bridgeSuggestion: "UI/UX Excellence",
                    leapSuggestion: "AI-Driven Interfaces",
                    indeedQuery: "Frontend AI Developer",
                    requiredSkills: ["React", "TypeScript", "AI Integration", "Animation", "Accessibility", "Performance Optimization"],
                    goldenSkills: ["Generative UI", "AI-Powered Design Tools", "Conversational Interfaces"],
                    goldenTraining: [
                        { skill: "Generative UI", course: "UI UX Design Specialization", platform: "Coursera" },
                        { skill: "Conversational Interfaces", course: "React The Complete Guide", platform: "Udemy" }
                    ],
                    connectedWeekIds: [2, 3, 6], x: 92, y: 50
                },
                {
                    careerTitle: "Backend AI Engineer",
                    description: "Scalable AI backend systems and APIs.",
                    bridgeSuggestion: "Backend Fundamentals",
                    leapSuggestion: "AI Service Architecture",
                    indeedQuery: "Backend AI Engineer",
                    requiredSkills: ["Node.js", "Python", "Database Design", "Redis", "Message Queues", "REST/GraphQL", "Docker"],
                    goldenSkills: ["Model Serving", "Inference Optimization", "Streaming Architectures"],
                    goldenTraining: [
                        { skill: "Model Serving", course: "Machine Learning Engineering for Production", platform: "Coursera" },
                        { skill: "Inference Optimization", course: "TensorFlow Developer", platform: "Coursera" }
                    ],
                    connectedWeekIds: [2, 5, 7], x: 92, y: 57
                },
                {
                    careerTitle: "DevOps AI Engineer",
                    description: "MLOps and AI infrastructure automation.",
                    bridgeSuggestion: "DevOps Foundations",
                    leapSuggestion: "MLOps Mastery",
                    indeedQuery: "MLOps Engineer",
                    requiredSkills: ["CI/CD", "Kubernetes", "Terraform", "AWS/GCP", "Monitoring", "GitOps", "Model Deployment"],
                    goldenSkills: ["Feature Stores", "Model Registry", "A/B Testing for ML"],
                    goldenTraining: [
                        { skill: "Feature Stores", course: "MLOps Specialization", platform: "Coursera" },
                        { skill: "A/B Testing for ML", course: "A/B Testing", platform: "Coursera" }
                    ],
                    connectedWeekIds: [2, 5, 6], x: 92, y: 64
                },
                {
                    careerTitle: "Data Engineer",
                    description: "AI data pipelines and infrastructure.",
                    bridgeSuggestion: "Data Fundamentals",
                    leapSuggestion: "Big Data and AI",
                    indeedQuery: "Data Engineer AI",
                    requiredSkills: ["SQL", "Python", "ETL Pipelines", "Spark", "Airflow", "Data Warehousing", "Real-time Streaming"],
                    goldenSkills: ["Data Lakes", "Delta Lake", "Data Contracts"],
                    goldenTraining: [
                        { skill: "Data Lakes", course: "Data Engineering with AWS", platform: "Coursera" },
                        { skill: "Delta Lake", course: "Spark and Hadoop", platform: "Coursera" }
                    ],
                    connectedWeekIds: [4, 5, 7], x: 92, y: 71
                },
                {
                    careerTitle: "AI Security Engineer",
                    description: "Securing AI systems and applications.",
                    bridgeSuggestion: "Security Basics",
                    leapSuggestion: "AI Security Expert",
                    indeedQuery: "AI Security Engineer",
                    requiredSkills: ["Security Fundamentals", "AI/ML Security", "Penetration Testing", "Compliance", "Threat Modeling", "Cryptography"],
                    goldenSkills: ["Adversarial ML", "Model Explainability", "AI Ethics and Bias"],
                    goldenTraining: [
                        { skill: "Adversarial ML", course: "AI For Everyone", platform: "Coursera" },
                        { skill: "AI Ethics and Bias", course: "AI Ethics", platform: "Coursera" }
                    ],
                    connectedWeekIds: [1, 7, 8], x: 92, y: 78
                },
                {
                    careerTitle: "Mobile AI Developer",
                    description: "AI-powered mobile applications.",
                    bridgeSuggestion: "Mobile Development",
                    leapSuggestion: "On-Device AI",
                    indeedQuery: "Mobile AI Developer",
                    requiredSkills: ["React Native", "Swift/Kotlin", "TensorFlow Lite", "Edge AI", "Mobile Optimization", "App Store Deployment"],
                    goldenSkills: ["Core ML", "ML Kit", "Neural Engine Optimization"],
                    goldenTraining: [
                        { skill: "Core ML", course: "iOS App Development", platform: "Coursera" },
                        { skill: "ML Kit", course: "Firebase and ML Kit", platform: "Udemy" }
                    ],
                    connectedWeekIds: [3, 6], x: 92, y: 85
                },
                {
                    careerTitle: "AI Research Scientist",
                    description: "Advanced AI research and development.",
                    bridgeSuggestion: "Research Methods",
                    leapSuggestion: "Novel AI Research",
                    indeedQuery: "AI Research Scientist",
                    requiredSkills: ["Deep Learning", "Mathematics", "PyTorch", "Research Methods", "Paper Writing", "Experimentation"],
                    goldenSkills: ["Transformer Architecture", "Reinforcement Learning", "Neural Architecture Search"],
                    goldenTraining: [
                        { skill: "Transformer Architecture", course: "Natural Language Processing", platform: "Coursera" },
                        { skill: "Reinforcement Learning", course: "Reinforcement Learning Specialization", platform: "Coursera" }
                    ],
                    connectedWeekIds: [1, 7, 8], x: 92, y: 92
                }
            ]);
        }
    }
}
//# sourceMappingURL=gemini.service.js.map