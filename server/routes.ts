import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupGoogleAuth } from "./googleAuth";
import { WeatherService } from "./services/weatherService";
import { AIService } from "./services/aiService";
import { ScoringService } from "./services/scoringService";
import { 
  insertBunkDecisionSchema, 
  insertFriendVoteSchema, 
  insertConfessionSchema,
  insertUserBadgeSchema,
  insertAttendedClassSchema
} from "@shared/schema";
import { z } from "zod";
import authLocal from "./authLocal";

const weatherService = new WeatherService();
const aiService = new AIService();
const scoringService = new ScoringService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupGoogleAuth(app);

  // Mount local auth routes
  app.use("/api/auth", authLocal);

  // TODO: Update the following routes to use Google user info from req.user
  // For now, comment out or remove routes that depend on Replit-specific claims

  // Example: Auth routes (update as needed for Google profile)
  // app.get('/api/auth/user', (req: any, res) => {
  //   if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  //   res.json(req.user);
  // });

  // Auth user endpoint for frontend to check login status
  app.get('/api/auth/user', (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
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
  app.post('/api/bunk-decision', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      console.log('req.user:', req.user);
      // Try to get userId from sub, id, or email
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
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
      
      // Gather additional context for AI prompt
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      // Fetch recent attendance history (last 5 decisions)
      const recentDecisions = await storage.getBunkDecisionsByUser(userId);
      const last5 = recentDecisions.slice(0, 5);
      const attendedCount = last5.filter(d => d.decision !== 'bunk').length;
      const bunkedCount = last5.filter(d => d.decision === 'bunk').length;
      const recentAttendance = `Attended ${attendedCount} and bunked ${bunkedCount} of last 5 classes`;
      // Fetch trending excuses (top 2 reasons from analytics)
      const analytics = await storage.getUserAnalytics(userId);
      const trendingExcuses = analytics.reasonBreakdown
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 2)
        .map(r => r.reason)
        .join(', ') || 'None';
      // Generate AI content
      const [aiExcuse, aiAnalysis] = await Promise.all([
        aiService.generateExcuse(
          mood,
          weatherData.condition,
          professorStrictness,
          attendancePercentage,
          dayOfWeek,
          recentAttendance,
          trendingExcuses
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
  app.get('/api/bunk-history', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
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
  app.post('/api/confessions', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
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
  app.get('/api/user-badges', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // User analytics endpoint
  app.get('/api/analytics', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
      const analytics = await storage.getUserAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Attended class endpoint
  app.post('/api/class-attended', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
      const { attendancePercentage, mood, daysUntilExam, professorStrictness } = req.body;
      const completeData = {
        userId,
        attendancePercentage,
        mood,
        daysUntilExam,
        professorStrictness,
      };
      const validatedData = insertAttendedClassSchema.parse(completeData);
      const attendedClass = await storage.createAttendedClass(validatedData);
      res.json(attendedClass);
    } catch (error) {
      console.error('Error logging attended class:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to log attended class' });
      }
    }
  });

  // Get user's attended history
  app.get('/api/attended-history', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.sub || req.user.id || req.user.email;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in session' });
      }
      const attended = await storage.getAttendedClassesByUser(userId);
      res.json(attended);
    } catch (error) {
      console.error('Error fetching attended history:', error);
      res.status(500).json({ message: 'Failed to fetch attended history' });
    }
  });

  // Attendance planner endpoint
  app.post('/api/attendance-planner', (req, res) => {
    const schema = z.object({
      totalConducted: z.number().int(),
      attended: z.number().int(),
      remaining: z.number().int(),
      threshold: z.number().optional().default(75),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid input", errors: parse.error.errors });
    }
    const { totalConducted, attended, remaining, threshold } = parse.data;
    const currentAttendance = totalConducted > 0 ? (attended / totalConducted) * 100 : 0;

    const table = [];
    for (let x = 0; x <= remaining; x++) {
      const attendedFinal = attended + x;
      const conductedFinal = totalConducted + remaining;
      const percent = conductedFinal > 0 ? (attendedFinal / conductedFinal) * 100 : 0;
      table.push({ attend: x, bunk: remaining - x, predicted: percent });
    }
    const maxPossible = table[remaining]?.predicted ?? 0;
    const minPossible = table[0]?.predicted ?? 0;
    let mustAttend = 0;
    for (let x = 0; x <= remaining; x++) {
      if (table[x].predicted >= threshold) {
        mustAttend = x;
        break;
      }
    }
    let recommendation = "";
    let icon = "";
    if (currentAttendance >= threshold + 5) {
      const safeBunks = table.filter(row => row.predicted >= threshold).length - 1;
      recommendation = `You're at ${currentAttendance.toFixed(1)}%. You can safely bunk ${safeBunks} more classes and still stay above ${threshold}%.`;
      icon = "✅";
    } else if (currentAttendance >= threshold) {
      const safeBunks = table.filter(row => row.predicted >= threshold).length - 1;
      recommendation = `Your attendance is currently ${currentAttendance.toFixed(1)}%. You can bunk only ${safeBunks} more class${safeBunks === 1 ? '' : 'es'} before dropping below ${threshold}%.`;
      icon = "⚠️";
    } else if (maxPossible < threshold) {
      recommendation = `With ${remaining} classes left and ${currentAttendance.toFixed(1)}% attendance, attending all of them will take you to ${maxPossible.toFixed(1)}% — still not enough. Consult your faculty ASAP.`;
      icon = "🔄";
    } else if (mustAttend > remaining) {
      recommendation = `You're already at ${currentAttendance.toFixed(1)}%. You cannot afford to miss any more classes if you want to hit the ${threshold}% mark.`;
      icon = "🛑";
    } else {
      recommendation = `You're at ${currentAttendance.toFixed(1)}%. You must attend at least ${mustAttend} out of the next ${remaining} classes to reach ${threshold}% before exams.`;
      icon = "❌";
    }
    res.json({
      maxPossible,
      minPossible,
      table,
      mustAttend,
      recommendation,
      icon,
    });
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
