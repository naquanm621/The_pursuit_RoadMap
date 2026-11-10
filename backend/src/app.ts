import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { GeminiService } from './services/gemini.service.js';
import { TrajectoryService } from './services/trajectory.service.js';

dotenv.config();

export const app = express();

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim().length > 0);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'pursuit-roadmap-api',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
});

// Trajectory Engine - Prime-Based Weighting System
app.post('/api/trajectory', (req, res) => {
  try {
    const { skills } = req.body ?? {};
    if (!isStringArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of non-empty strings' });
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
    const { skills, gaps, trajectoryName: customTrajectory, existingTitles } = req.body ?? {};
    console.log('Generating career path for skills:', skills, 'gaps:', gaps);
    if (!isStringArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of non-empty strings' });
    }
    if (gaps !== undefined && !isStringArray(gaps)) {
      return res.status(400).json({ error: 'Gaps must be an array of non-empty strings' });
    }
    if (existingTitles !== undefined && !isStringArray(existingTitles)) {
      return res.status(400).json({ error: 'Existing titles must be an array of non-empty strings' });
    }
    if (customTrajectory !== undefined && (typeof customTrajectory !== 'string' || !customTrajectory.trim())) {
      return res.status(400).json({ error: 'Trajectory name must be a non-empty string' });
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
    const { jobDescription, skills } = req.body ?? {};
    if (typeof jobDescription !== 'string' || !jobDescription.trim()) {
      return res.status(400).json({ error: 'Job description must be a non-empty string' });
    }
    if (skills !== undefined && !isStringArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of non-empty strings' });
    }
    const result = await GeminiService.matchJobDescription(jobDescription.trim(), skills || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze job description' });
  }
});

// Journey Log Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, skills } = req.body ?? {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message must be a non-empty string' });
    }
    if (history !== undefined && !Array.isArray(history)) {
      return res.status(400).json({ error: 'History must be an array' });
    }
    if (skills !== undefined && !isStringArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of non-empty strings' });
    }

    const weight = TrajectoryService.calculateWeight(skills || []);
    const trajectoryName = TrajectoryService.getTrajectoryName(weight);

    const response = await GeminiService.getChatResponse(message.trim(), history || [], trajectoryName);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to AI Tutor' });
  }
});

// Endpoint to trigger screenshot processing
app.post('/api/process-curriculum', async (req, res) => {
  try {
    const rootScreenshotsDirectory = path.resolve(process.cwd(), 'screenshots');
    const screenshotsDirectory = fs.existsSync(rootScreenshotsDirectory)
      ? rootScreenshotsDirectory
      : path.resolve(process.cwd(), '../screenshots');
    const files = fs.readdirSync(screenshotsDirectory).map(file => path.join(screenshotsDirectory, file));
    const syllabus = await GeminiService.processScreenshots(files);
    res.json(syllabus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process screenshots' });
  }
});
