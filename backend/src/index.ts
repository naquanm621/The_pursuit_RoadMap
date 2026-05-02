import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { GeminiService } from './services/gemini.service.js';
import { TrajectoryService } from './services/trajectory.service.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
    
    // Calculate trajectory on the fly for chat personalization
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
    // In a real app, we'd list files in the /screenshots folder
    const files = fs.readdirSync('../screenshots').map(f => `../screenshots/${f}`);
    const syllabus = await GeminiService.processScreenshots(files);
    res.json(syllabus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process screenshots' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
