import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import dotenv from 'dotenv';
import * as duckDuckScrape from 'duck-duck-scrape';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class GeminiService {
  /**
   * Helper to execute a model call with fallback to 1.5-flash if 2.0-flash fails with 429
   */
  private static async runWithModelFallback(
    primaryModelName: string,
    execute: (model: any) => Promise<any>
  ) {
    try {
      const model = genAI.getGenerativeModel({ model: primaryModelName });
      return await execute(model);
    } catch (error: any) {
      if (error.message?.includes('429') && primaryModelName !== 'gemini-1.5-flash') {
        console.warn(`[Fallback] ${primaryModelName} rate limited. Retrying with gemini-1.5-flash...`);
        const fallbackModel = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          tools: [{ googleSearch: {} }] as any
        });
        return await execute(fallbackModel);
      }
      throw error;
    }
  }

  /**
   * Processes curriculum screenshots to extract a structured syllabus.
   */
  static async processScreenshots(imagePaths: string[]) {
    return this.runWithModelFallback('gemini-2.0-flash', async (model) => {
      const imageParts = imagePaths
        .filter(path => fs.existsSync(path) && !path.endsWith('.DS_Store'))
        .map(path => ({
          inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType: "image/png",
          },
        }));

      if (imageParts.length === 0) return { weeks: [] };

      const prompt = `Analyze these curriculum screenshots and extract a structured JSON syllabus. 
      Include: Week Number, Topic Name, and specific Skills learned. 
      Return ONLY valid JSON in this format: { "weeks": [{ "number": 1, "topic": "...", "skills": ["...", "..."] }] }`;

      const result = await model.generateContent([prompt, ...imageParts]);
      return JSON.parse(result.response.text().replace(/```json|```/g, ''));
    });
  }

  /**
   * Generates a tutoring/logging response for the Journey Log.
   */
  static async getChatResponse(message: string, history: any[], trajectoryName: string = "AI Explorer") {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
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
    } catch (error: any) {
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

  /**
   * Search using DuckDuckGo (free, no API key needed)
   */
  private static async searchDuckDuckGo(query: string): Promise<string> {
    try {
      const searchResults = await duckDuckScrape.search(query, {
        safeSearch: duckDuckScrape.SafeSearchType.STRICT
      });
      // Handle both array and object with results property
      const results = Array.isArray(searchResults) ? searchResults : (searchResults as any).results || [];
      return results.slice(0, 5).map((r: any) => `${r.title}: ${r.description}`).join('\n');
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return '';
    }
  }

  /**
   * Generates a dynamic career path with mesh coordinates.
   */
  static async getCombinedCareerPath(skills: string[], gaps: string[] = [], trajectoryName: string = "AI Explorer", existingTitles: string[] = []) {
    try {
      // Use DuckDuckGo for free web search (no API key needed)
      const searchQuery = `${trajectoryName} AI job careers 2025 Coursera Udemy courses`;
      const searchResults = await this.searchDuckDuckGo(searchQuery);
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
            "topCourses": [
              { "title": "Course Name", "url": "Direct Link", "platform": "Coursera/Udemy/etc" }
            ],
            "requiredSkills": ["skill1", "skill2", "skill3", "skill4"],
            "goldenSkills": ["NewSkill1", "NewSkill2", "NewSkill3"],
            "goldenTraining": [
              { "skill": "NewSkill1", "course": "Course Name", "platform": "Coursera/Udemy", "url": "https://..." }
            ],
            "connectedWeekIds": [1, 3, 5],
            "x": 92,
            "y": 10
          }
        ]
        REQUIRED FIELDS:
        - requiredSkills: Array of 4-6 specific technical skills needed (e.g., "React", "Python", "System Design", "Kubernetes", "GraphQL", "AWS")
        - goldenSkills: Array of 3-5 skills NOT covered in the week curriculum above - these are the GOLDEN skills that make this path unique
        - goldenTraining: Array of specific training recommendations for each golden skill with course name, platform, and URL
          - URLs MUST be real, working links from Coursera (www.coursera.org) or Udemy (www.udemy.com/course/...) only
          - Example valid URLs: "https://www.coursera.org/learn/machine-learning", "https://www.udemy.com/course/react-the-complete-guide/"
        - connectedWeekIds: Array of 2-4 week numbers (1-8) that naturally connect to this path based on skills
        
        Create diverse career paths across: Frontend, Backend, Full Stack, AI/ML, DevOps, Product Management, Data Engineering, Cloud Architecture, Security, Mobile, etc.
        goldenSkills must be NEW skills not in the week curriculum - these form the "golden path" unique to this trajectory.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Failed to extract JSON from AI response");
        return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error('Gemini API Error, using enhanced fallbacks:', error.message);
      // Clean trajectory name for fallback to prevent "Specialist Specialist"
      const cleanTrajectory = trajectoryName.replace(/Specialist/g, '').trim();
      
      return [
        {
          careerTitle: `${cleanTrajectory} Lead`,
          description: `Advanced technical leadership in ${cleanTrajectory}.`,
          bridgeSuggestion: "Master Core Domain",
          leapSuggestion: "Lead Complex Projects",
          indeedQuery: `${cleanTrajectory} Lead`,
          requiredSkills: ["AI Fundamentals", "System Design", "Team Leadership", "Architecture Patterns", "Mentoring"],
          goldenSkills: ["Engineering Management", "Technical Strategy", "Cross-functional Collaboration"],
          goldenTraining: [
            { "skill": "Engineering Management", "course": "Software Engineering Management", "platform": "Coursera", "url": "https://www.coursera.org/learn/software-engineering-management" },
            { "skill": "Technical Strategy", "course": "Digital Transformation", "platform": "Coursera", "url": "https://www.coursera.org/learn/digital-transformation" }
          ],
          connectedWeekIds: [1, 2, 7],
          x: 92, y: 15
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
            { "skill": "Enterprise Patterns", "course": "Cloud Architecture with Google Cloud", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/cloud-architecture" },
            { "skill": "Multi-cloud Strategy", "course": "AWS Cloud Solutions Architect", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/aws-cloud-solutions-architect" }
          ],
          connectedWeekIds: [1, 2, 5, 7],
          x: 92, y: 22
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
            { "skill": "Product Metrics", "course": "Product Management", "platform": "Coursera", "url": "https://www.coursera.org/learn/product-management" },
            { "skill": "Market Analysis", "course": "Business Strategy", "platform": "Coursera", "url": "https://www.coursera.org/learn/strategic-planning" }
          ],
          connectedWeekIds: [3, 6, 8],
          x: 92, y: 29
        },
        {
          careerTitle: "Full Stack AI Engineer",
          description: "End-to-end AI application development.",
          bridgeSuggestion: "Full Stack Mastery",
          leapSuggestion: "AI Integration Expert",
          indeedQuery: "Full Stack AI Engineer",
          requiredSkills: ["React", "Node.js", "Database Management", "AI APIs", "Deployment", "TypeScript", "GraphQL"],
          goldenSkills: ["Vector Databases", "LangChain/LangFlow", "AI SDKs"],
          goldenTraining: [
            { "skill": "Vector Databases", "course": "LangChain & Vector Databases", "platform": "Udemy", "url": "https://www.udemy.com/course/langchain-vector-databases-in-production/" },
            { "skill": "LangChain/LangFlow", "course": "LangChain Masterclass", "platform": "Udemy", "url": "https://www.udemy.com/course/langchain-masterclass-from-beginner-to-advanced/" }
          ],
          connectedWeekIds: [2, 3, 5, 6],
          x: 92, y: 36
        },
        {
          careerTitle: "AI Automation Expert",
          description: "Building intelligent automation systems.",
          bridgeSuggestion: "Workflow Mastery",
          leapSuggestion: "AI Agent Architecture",
          indeedQuery: "AI Automation Engineer",
          requiredSkills: ["Workflow Automation", "Python", "API Integration", "Process Design", "RPA", "LLM Orchestration"],
          goldenSkills: ["AutoGPT/Agent Frameworks", "n8n/Zapier Advanced", "Intelligent Document Processing"],
          goldenTraining: [
            { "skill": "AutoGPT/Agent Frameworks", "course": "AI Agents in LangChain", "platform": "Udemy", "url": "https://www.udemy.com/course/ai-agents-langchain/" },
            { "skill": "n8n/Zapier Advanced", "course": "Zapier Automation", "platform": "Udemy", "url": "https://www.udemy.com/course/zapier-automation/" }
          ],
          connectedWeekIds: [2, 4, 5],
          x: 92, y: 43
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
            { "skill": "Generative UI", "course": "UI/UX Design Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/ui-ux-design" },
            { "skill": "Conversational Interfaces", "course": "React - The Complete Guide", "platform": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/" }
          ],
          connectedWeekIds: [2, 3, 6],
          x: 92, y: 50
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
            { "skill": "Model Serving", "course": "Machine Learning Engineering", "platform": "Coursera", "url": "https://www.coursera.org/learn/machine-learning-engineering-for-production" },
            { "skill": "Inference Optimization", "course": "TensorFlow Developer", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice" }
          ],
          connectedWeekIds: [2, 5, 7],
          x: 92, y: 57
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
            { "skill": "Feature Stores", "course": "MLOps Specialization", "platform": "Coursera", "url": "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops" },
            { "skill": "A/B Testing for ML", "course": "A/B Testing", "platform": "Udacity", "url": "https://www.udacity.com/course/ab-testing--ud257" }
          ],
          connectedWeekIds: [2, 5, 6],
          x: 92, y: 64
        },
        {
          careerTitle: "Data Engineer",
          description: "AI data pipelines and infrastructure.",
          bridgeSuggestion: "Data Fundamentals",
          leapSuggestion: "Big Data & AI",
          indeedQuery: "Data Engineer AI",
          requiredSkills: ["SQL", "Python", "ETL Pipelines", "Spark", "Airflow", "Data Warehousing", "Real-time Streaming"],
          goldenSkills: ["Data Lakes", "Delta Lake", "Data Contracts"],
          goldenTraining: [
            { "skill": "Data Lakes", "course": "Data Engineering with AWS", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/aws-data-engineering" },
            { "skill": "Delta Lake", "course": "Spark and Hadoop", "platform": "Coursera", "url": "https://www.coursera.org/learn/spark-hadoop-big-data" }
          ],
          connectedWeekIds: [4, 5, 7],
          x: 92, y: 71
        },
        {
          careerTitle: "AI Security Engineer",
          description: "Securing AI systems and applications.",
          bridgeSuggestion: "Security Basics",
          leapSuggestion: "AI Security Expert",
          indeedQuery: "AI Security Engineer",
          requiredSkills: ["Security Fundamentals", "AI/ML Security", "Penetration Testing", "Compliance", "Threat Modeling", "Cryptography"],
          goldenSkills: ["Adversarial ML", "Model Explainability", "AI Ethics & Bias"],
          goldenTraining: [
            { "skill": "Adversarial ML", "course": "AI For Everyone", "platform": "Coursera", "url": "https://www.coursera.org/learn/ai-for-everyone" },
            { "skill": "AI Ethics & Bias", "course": "AI Ethics", "platform": "Coursera", "url": "https://www.coursera.org/learn/ai-ethics" }
          ],
          connectedWeekIds: [1, 7, 8],
          x: 92, y: 78
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
            { "skill": "Core ML", "course": "iOS Development", "platform": "Coursera", "url": "https://www.coursera.org/specializations/app-development" },
            { "skill": "ML Kit", "course": "Firebase & ML Kit", "platform": "Udemy", "url": "https://www.udemy.com/course/firebase-ml-kit-for-android-developers/" }
          ],
          connectedWeekIds: [3, 6],
          x: 92, y: 85
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
            { "skill": "Transformer Architecture", "course": "Natural Language Processing", "platform": "Coursera", "url": "https://www.coursera.org/specializations/natural-language-processing" },
            { "skill": "Reinforcement Learning", "course": "Reinforcement Learning", "platform": "Coursera", "url": "https://www.coursera.org/specializations/reinforcement-learning" }
          ],
          connectedWeekIds: [1, 7, 8],
          x: 92, y: 85
        }
      ];
    }
  }
}
