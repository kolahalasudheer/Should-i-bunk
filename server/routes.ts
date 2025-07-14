import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { WeatherService } from "./services/weatherService";
import { AIService } from "./services/aiService";
import { ScoringService } from "./services/scoringService";
import { 
  insertBunkDecisionSchema, 
  insertFriendVoteSchema, 
  insertConfessionSchema,
  insertUserBadgeSchema 
} from "@shared/schema";
import { z } from "zod";

const weatherService = new WeatherService();
const aiService = new AIService();
const scoringService = new ScoringService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Weather endpoint
  app.get('/api/weather', async (req, res) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      
      const weatherData = await weatherService.getWeatherData(lat, lon);
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // Bunk decision endpoint
  app.post('/api/bunk-decision', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attendancePercentage, mood, daysUntilExam, professorStrictness } = req.body;
      
      // Get weather data
      const weatherData = await weatherService.getWeatherData();
      const weatherScore = weatherService.calculateWeatherScore(weatherData);
      
      // Calculate bunk score
      const bunkScore = scoringService.calculateBunkScore({
        attendancePercentage,
        daysUntilExam,
        mood,
        professorStrictness,
        weatherScore,
      });
      
      // Get decision from score
      const decision = scoringService.getDecisionFromScore(bunkScore);
      
      // Generate AI content
      const [aiExcuse, aiAnalysis] = await Promise.all([
        aiService.generateExcuse(
          mood,
          weatherData.condition,
          professorStrictness,
          attendancePercentage
        ),
        aiService.generateAnalysis(
          attendancePercentage,
          daysUntilExam,
          mood,
          bunkScore,
          decision
        ),
      ]);
      
      // Prepare complete data for validation
      const completeData = {
        userId,
        attendancePercentage,
        mood,
        daysUntilExam,
        professorStrictness,
        weatherCondition: weatherData.condition,
        weatherTemperature: weatherData.temperature,
        bunkScore,
        decision,
        aiExcuse,
        aiAnalysis,
      };
      
      const validatedData = insertBunkDecisionSchema.parse(completeData);

      // Save decision
      const bunkDecision = await storage.createBunkDecision(validatedData);

      // Check and award badges
      await checkAndAwardBadges(userId, bunkDecision);

      res.json({
        ...bunkDecision,
        weather: weatherData,
      });
    } catch (error) {
      console.error("Error creating bunk decision:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create bunk decision" });
      }
    }
  });

  // Get user's bunk history
  app.get('/api/bunk-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const decisions = await storage.getBunkDecisionsByUser(userId);
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching bunk history:", error);
      res.status(500).json({ message: "Failed to fetch bunk history" });
    }
  });

  // Friend voting endpoints
  app.post('/api/friend-vote', async (req, res) => {
    try {
      const validatedData = insertFriendVoteSchema.parse(req.body);
      const friendVote = await storage.createFriendVote(validatedData);
      res.json(friendVote);
    } catch (error) {
      console.error("Error creating friend vote:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create friend vote" });
      }
    }
  });

  app.get('/api/friend-votes/:decisionId', async (req, res) => {
    try {
      const decisionId = parseInt(req.params.decisionId);
      const votes = await storage.getFriendVotesByDecision(decisionId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching friend votes:", error);
      res.status(500).json({ message: "Failed to fetch friend votes" });
    }
  });

  // Confession wall endpoints
  app.post('/api/confessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertConfessionSchema.parse({
        ...req.body,
        userId,
      });
      const confession = await storage.createConfession(validatedData);
      res.json(confession);
    } catch (error) {
      console.error("Error creating confession:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create confession" });
      }
    }
  });

  app.get('/api/confessions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const confessions = await storage.getConfessions(limit, offset);
      res.json(confessions);
    } catch (error) {
      console.error("Error fetching confessions:", error);
      res.status(500).json({ message: "Failed to fetch confessions" });
    }
  });

  app.post('/api/confessions/:id/like', async (req, res) => {
    try {
      const confessionId = parseInt(req.params.id);
      await storage.likeConfession(confessionId);
      res.json({ message: "Confession liked successfully" });
    } catch (error) {
      console.error("Error liking confession:", error);
      res.status(500).json({ message: "Failed to like confession" });
    }
  });

  // User badges endpoint
  app.get('/api/user-badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // User analytics endpoint
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getUserAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Helper function to check and award badges
  async function checkAndAwardBadges(userId: string, decision: any) {
    try {
      const userDecisions = await storage.getBunkDecisionsByUser(userId);
      const userBadges = await storage.getUserBadges(userId);
      const existingBadgeTypes = userBadges.map(b => b.badgeType);

      // Serial Bunker badge: 5 consecutive bunks
      if (!existingBadgeTypes.includes('serial_bunker')) {
        const recentDecisions = userDecisions.slice(0, 5);
        if (recentDecisions.length === 5 && recentDecisions.every(d => d.decision === 'bunk')) {
          await storage.createUserBadge({
            userId,
            badgeType: 'serial_bunker',
          });
        }
      }

      // Weather Warrior badge: 10 bunks due to weather
      if (!existingBadgeTypes.includes('weather_warrior')) {
        const weatherBunks = userDecisions.filter(d => 
          d.decision === 'bunk' && d.weatherCondition && 
          (d.weatherCondition.includes('rain') || d.weatherCondition.includes('storm'))
        );
        if (weatherBunks.length >= 10) {
          await storage.createUserBadge({
            userId,
            badgeType: 'weather_warrior',
          });
        }
      }

      // Data Nerd badge: Use app for 30 days
      if (!existingBadgeTypes.includes('data_nerd')) {
        const oldestDecision = userDecisions[userDecisions.length - 1];
        if (oldestDecision && oldestDecision.createdAt) {
          const daysSinceFirst = Math.floor(
            (Date.now() - new Date(oldestDecision.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceFirst >= 30) {
            await storage.createUserBadge({
              userId,
              badgeType: 'data_nerd',
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
