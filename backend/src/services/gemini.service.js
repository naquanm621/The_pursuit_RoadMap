import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export class GeminiService {
    /**
     * Helper to execute a model call with fallback to 1.5-flash if 2.0-flash fails with 429
     */
    static async runWithModelFallback(primaryModelName, execute) {
        try {
            const model = genAI.getGenerativeModel({ model: primaryModelName });
            return await execute(model);
        }
        catch (error) {
            if (error.message?.includes('429') && primaryModelName !== 'gemini-1.5-flash') {
                console.warn(`[Fallback] ${primaryModelName} rate limited. Retrying with gemini-1.5-flash...`);
                const fallbackModel = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    tools: [{ googleSearch: {} }]
                });
                return await execute(fallbackModel);
            }
            throw error;
        }
    }
    /**
     * Processes curriculum screenshots to extract a structured syllabus.
     */
    static async processScreenshots(imagePaths) {
        return this.runWithModelFallback('gemini-2.0-flash', async (model) => {
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
    /**
     * Generates a tutoring/logging response for the Journey Log.
     */
    static async getChatResponse(message, history, trajectoryName = "AI Explorer") {
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
    /**
     * Generates a dynamic career path with mesh coordinates.
     */
    static async getCombinedCareerPath(skills, gaps = [], trajectoryName = "AI Explorer", existingTitles = []) {
        try {
            return await this.runWithModelFallback('gemini-2.0-flash', async (model) => {
                // Enable Google Search Grounding for the primary model
                const modelWithSearch = genAI.getGenerativeModel({
                    model: model.model,
                    tools: [{ googleSearch: {} }]
                });
                const prompt = `Given these achieved skills: [${skills.join(', ')}] and these MISSED skills: [${gaps.join(', ')}],
        and the user's current trajectory: "${trajectoryName}".
        
        EXISTING CAREERS (DO NOT REPEAT THESE): [${existingTitles.join(', ')}]
        
        Use GOOGLE SEARCH to find:
        1. Real, trending AI-native job titles for May 2026.
        2. Top-rated online courses or certifications (Coursera, Udemy, etc.) relevant to these roles.
        
        Generate 3 UNIQUE career paths that are DIFFERENT from the existing ones.
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
            "x": 92,
            "y": 10
          }
        ]
        Ensure 'y' is a number between 10 and 90, spread them out.`;
                const result = await modelWithSearch.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (!jsonMatch)
                    throw new Error("Failed to extract JSON from AI response");
                return JSON.parse(jsonMatch[0]);
            });
        }
        catch (error) {
            console.error('Gemini API Error, using enhanced fallbacks:', error.message);
            // Clean trajectory name for fallback to prevent "Specialist Specialist"
            const cleanTrajectory = trajectoryName.replace(/Specialist/g, '').trim();
            return [
                {
                    careerTitle: `${cleanTrajectory} Specialist`,
                    description: `Strategic advancement for your current path as a ${cleanTrajectory}.`,
                    bridgeSuggestion: "Core Skill Mastery",
                    leapSuggestion: "Advanced System Integration",
                    indeedQuery: `${cleanTrajectory} AI`,
                    x: 92, y: 15
                },
                {
                    careerTitle: "AI Solution Architect",
                    description: "Designing end-to-end AI systems based on your foundations.",
                    bridgeSuggestion: "Revisit AI Fundamentals",
                    leapSuggestion: "Enterprise System Design",
                    indeedQuery: "AI Solution Architect",
                    x: 92, y: 45
                },
                {
                    careerTitle: "Technical Product Manager",
                    description: "Leading AI product strategy and development cycles.",
                    bridgeSuggestion: "Master Problem Identification",
                    leapSuggestion: "Agile AI Leadership",
                    indeedQuery: "Technical Product Manager AI",
                    x: 92, y: 75
                }
            ];
        }
    }
}
//# sourceMappingURL=gemini.service.js.map