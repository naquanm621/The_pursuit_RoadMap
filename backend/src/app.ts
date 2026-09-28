import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs';

import { GeminiService } from './services/gemini.service.js';
import { TrajectoryService } from './services/trajectory.service.js';

dotenv.config();

export const app = express();

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

// Job Description Match Endpoint
app.post('/api/match-jd', async (req, res) => {
  try {
    const { jobDescription, skills } = req.body;
    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({ error: 'jobDescription is required' });
    }
    const result = await GeminiService.matchJobDescription(jobDescription, skills || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze job description' });
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