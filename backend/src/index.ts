import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { GeminiService } from './services/gemini.service.js';
import { TrajectoryService } from './services/trajectory.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Trajectory Engine - Prime-Based Weighting System
app.post('/api/trajectory', (req, res) => {
  try {
    const { skills } = req.body;
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills array is required' });
    }
    const weight = TrajectoryService.calculateWeight(skills);
    const trajectoryName = TrajectoryService.getTrajectoryName(weight);
    res.json({ weight, trajectoryName });
  } catch (error) {
    res.status(500).json({ error: 'Trajectory engine failure' });
  }
});

// AI Career Path endpoint - Dynamic Skill Combinations
app.post('/api/career-path', async (req, res) => {
  try {
    const { skills, gaps, trajectoryName: customTrajectory, existingTitles } = req.body;
    console.log('Generating career path for skills:', skills, 'gaps:', gaps);
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    const weight = TrajectoryService.calculateWeight(skills);
    const trajectoryName = customTrajectory || TrajectoryService.getTrajectoryName(weight);

    const paths = await GeminiService.getCombinedCareerPath(skills, gaps || [], trajectoryName, existingTitles || []);
    console.log('Successfully generated paths:', paths.length);
    res.json(paths);
  } catch (error) {
    console.error('Failed to generate career path:', error);
    res.status(500).json({ error: 'Failed to generate career path' });
  }
});

// Journey Log Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, skills } = req.body;
    
    const weight = TrajectoryService.calculateWeight(skills || []);
    const trajectoryName = TrajectoryService.getTrajectoryName(weight);
    
    const response = await GeminiService.getChatResponse(message, history || [], trajectoryName);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to AI Tutor' });
  }
});

// Endpoint to trigger screenshot processing
app.post('/api/process-curriculum', async (req, res) => {
  try {
    const files = fs.readdirSync('../screenshots').map(f => `../screenshots/${f}`);
    const syllabus = await GeminiService.processScreenshots(files);
    res.json(syllabus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process screenshots' });
  }
});

// Serve frontend static files in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback — serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`Serving frontend from ${frontendDist}`);
}

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
