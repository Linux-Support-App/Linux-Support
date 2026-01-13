import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertQuestionSchema, 
  insertAnswerSchema, 
  insertCategorySchema, 
  insertFaqSchema,
  insertUserSchema,
  loginSchema,
  updateUserRoleSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  getKarmaLevel,
  KARMA_REWARDS,
  type SafeUser,
  type UserRole 
} from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      sessionId?: string;
    }
  }
}

const SESSION_COOKIE = "session_id";

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (sessionId) {
    const session = await storage.getSession(sessionId);
    if (session) {
      req.user = session.user;
      req.sessionId = sessionId;
    }
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

function canModerate(user: SafeUser | undefined): boolean {
  if (!user) return false;
  return ["owner", "admin", "moderator"].includes(user.role);
}

function canManageUsers(user: SafeUser | undefined): boolean {
  if (!user) return false;
  return ["owner", "admin"].includes(user.role);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(authMiddleware);
  
  registerObjectStorageRoutes(app);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      const user = await storage.createUser(validatedData);
      const session = await storage.createSession(user.id);
      
      res.cookie(SESSION_COOKIE, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      const validPassword = await storage.verifyPassword(user, password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      const session = await storage.createSession(user.id);
      
      res.cookie(SESSION_COOKIE, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (req.sessionId) {
        await storage.deleteSession(req.sessionId);
      }
      res.clearCookie(SESSION_COOKIE);
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const { username } = requestPasswordResetSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.json({ success: true, message: "If the account exists, a reset link will be generated" });
      }
      
      const token = await storage.createPasswordResetToken(user.id);
      
      res.json({ 
        success: true, 
        message: "Password reset token generated",
        token,
        resetUrl: `/reset-password?token=${token}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error requesting password reset:", error);
      res.status(500).json({ error: "Failed to request password reset" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      await storage.usePasswordResetToken(token, newPassword);
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      if (error instanceof Error && error.message === "Invalid or expired token") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUserProfile(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const karmaInfo = getKarmaLevel(user.karma);
      const questions = await storage.getUserQuestions(req.params.id);
      const answers = await storage.getUserAnswers(req.params.id);
      
      res.json({
        ...user,
        level: karmaInfo.level,
        title: karmaInfo.title,
        nextLevelKarma: karmaInfo.nextLevelKarma,
        questionsCount: questions.length,
        answersCount: answers.length,
        questions: questions.slice(0, 10),
        answers: answers.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.patch("/api/users/me/email", requireAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      await storage.updateUserEmail(req.user!.id, email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ error: "Failed to update email" });
    }
  });

  app.get("/api/admin/users", requireRole("owner", "admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireRole("owner", "admin"), async (req, res) => {
    try {
      const { role } = updateUserRoleSchema.parse(req.body);
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (targetUser.role === "owner") {
        return res.status(403).json({ error: "Cannot change owner role" });
      }
      
      if (role === "admin" && req.user?.role !== "owner") {
        return res.status(403).json({ error: "Only owner can promote to admin" });
      }
      
      if (targetUser.role === "admin" && req.user?.role !== "owner") {
        return res.status(403).json({ error: "Only owner can demote admins" });
      }
      
      await storage.updateUserRole(req.params.id, role);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.get("/api/questions", async (req, res) => {
    try {
      const { category, sort, limit } = req.query;
      const questions = await storage.getQuestions({
        categorySlug: category as string | undefined,
        sort: sort as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }
      const questions = await storage.searchQuestions(q);
      res.json(questions);
    } catch (error) {
      console.error("Error searching questions:", error);
      res.status(500).json({ error: "Failed to search questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestionById(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      await storage.incrementQuestionViews(req.params.id);
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", requireAuth, async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion({
        ...validatedData,
        userId: req.user!.id,
        authorName: req.user!.displayName || req.user!.username,
      });
      await storage.addKarma(req.user!.id, KARMA_REWARDS.ASK_QUESTION);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.patch("/api/questions/:id", requireRole("owner", "admin", "moderator"), async (req, res) => {
    try {
      const { title, content, isPinned } = req.body;
      await storage.updateQuestion(req.params.id, { title, content, isPinned });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireRole("owner", "admin", "moderator"), async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  app.post("/api/questions/:id/pin", requireRole("owner", "admin", "moderator"), async (req, res) => {
    try {
      const question = await storage.getQuestionById(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      await storage.updateQuestion(req.params.id, { isPinned: !question.isPinned });
      res.json({ success: true, isPinned: !question.isPinned });
    } catch (error) {
      console.error("Error pinning question:", error);
      res.status(500).json({ error: "Failed to pin question" });
    }
  });

  app.post("/api/questions/:id/vote", async (req, res) => {
    try {
      const { direction } = req.body;
      if (direction !== "up" && direction !== "down") {
        return res.status(400).json({ error: "Invalid vote direction" });
      }
      const question = await storage.getQuestionById(req.params.id);
      await storage.updateQuestionVotes(req.params.id, direction);
      if (question?.userId) {
        const karmaChange = direction === "up" ? KARMA_REWARDS.QUESTION_UPVOTED : KARMA_REWARDS.QUESTION_DOWNVOTED;
        await storage.addKarma(question.userId, karmaChange);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating vote:", error);
      res.status(500).json({ error: "Failed to update vote" });
    }
  });

  app.post("/api/questions/:id/answers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAnswerSchema.parse({
        ...req.body,
        questionId: req.params.id,
      });
      const answer = await storage.createAnswer({
        ...validatedData,
        userId: req.user!.id,
        authorName: req.user!.displayName || req.user!.username,
      });
      await storage.addKarma(req.user!.id, KARMA_REWARDS.POST_ANSWER);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating answer:", error);
      res.status(500).json({ error: "Failed to create answer" });
    }
  });

  app.patch("/api/answers/:id", requireRole("owner", "admin", "moderator"), async (req, res) => {
    try {
      const { content } = req.body;
      await storage.updateAnswer(req.params.id, { content });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating answer:", error);
      res.status(500).json({ error: "Failed to update answer" });
    }
  });

  app.delete("/api/answers/:id", requireRole("owner", "admin", "moderator"), async (req, res) => {
    try {
      await storage.deleteAnswer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting answer:", error);
      res.status(500).json({ error: "Failed to delete answer" });
    }
  });

  app.post("/api/answers/:id/accept", requireAuth, async (req, res) => {
    try {
      const { questionId } = req.body;
      const question = await storage.getQuestionById(questionId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      if (question.userId !== req.user!.id && !canModerate(req.user)) {
        return res.status(403).json({ error: "Only the question author can accept answers" });
      }
      
      const answers = await storage.getAnswersByQuestionId(questionId);
      const answer = answers.find(a => a.id === req.params.id);
      
      await storage.acceptAnswer(req.params.id, questionId);
      
      if (answer?.userId) {
        await storage.addKarma(answer.userId, KARMA_REWARDS.ANSWER_ACCEPTED);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ error: "Failed to accept answer" });
    }
  });

  app.post("/api/answers/:id/vote", async (req, res) => {
    try {
      const { direction } = req.body;
      if (direction !== "up" && direction !== "down") {
        return res.status(400).json({ error: "Invalid vote direction" });
      }
      const answers = await storage.getAnswersByQuestionId(req.body.questionId || "");
      const answer = answers.find(a => a.id === req.params.id);
      
      await storage.updateAnswerVotes(req.params.id, direction);
      
      if (answer?.userId) {
        const karmaChange = direction === "up" ? KARMA_REWARDS.ANSWER_UPVOTED : KARMA_REWARDS.ANSWER_DOWNVOTED;
        await storage.addKarma(answer.userId, karmaChange);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating vote:", error);
      res.status(500).json({ error: "Failed to update vote" });
    }
  });

  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/seed", async (req, res) => {
    try {
      const existingCategories = await storage.getCategories();
      if (existingCategories.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      const categoriesData = [
        { name: "Installation", slug: "installation", description: "Help with installing Linux distributions and packages", icon: "package", color: "#f97316" },
        { name: "Hardware", slug: "hardware", description: "Hardware compatibility and driver issues", icon: "cpu", color: "#ef4444" },
        { name: "Software", slug: "software", description: "Application installation and configuration", icon: "hard-drive", color: "#8b5cf6" },
        { name: "Networking", slug: "networking", description: "Network configuration and troubleshooting", icon: "wifi", color: "#06b6d4" },
        { name: "Command Line", slug: "command-line", description: "Terminal, shell, and command line usage", icon: "terminal", color: "#22c55e" },
        { name: "System Configuration", slug: "system-config", description: "System settings and configuration", icon: "settings", color: "#f59e0b" },
      ];

      const createdCategories: Record<string, string> = {};
      for (const cat of categoriesData) {
        const created = await storage.createCategory(cat);
        createdCategories[cat.slug] = created.id;
      }

      const faqsData = [
        {
          question: "How do I update my system packages?",
          answer: "The command to update packages depends on your distribution. For Debian/Ubuntu based systems, use apt. For Fedora/RHEL, use dnf. For Arch, use pacman.",
          categoryId: createdCategories["installation"],
          order: 1,
          codeSnippet: "# Debian/Ubuntu\nsudo apt update && sudo apt upgrade\n\n# Fedora/RHEL\nsudo dnf upgrade\n\n# Arch Linux\nsudo pacman -Syu",
          codeLanguage: "bash",
        },
        {
          question: "How do I check my Linux distribution version?",
          answer: "There are several commands to check your Linux distribution and version. The most common is using the /etc/os-release file or the lsb_release command.",
          categoryId: createdCategories["system-config"],
          order: 2,
          codeSnippet: "# Method 1: Check os-release file\ncat /etc/os-release\n\n# Method 2: Use lsb_release\nlsb_release -a\n\n# Method 3: Check kernel version\nuname -a",
          codeLanguage: "bash",
        },
        {
          question: "How do I find and kill a process?",
          answer: "You can find processes using ps, top, or htop commands. To kill a process, use the kill command with the process ID (PID). Use kill -9 for a forceful termination.",
          categoryId: createdCategories["command-line"],
          order: 3,
          codeSnippet: "# Find a process by name\nps aux | grep process_name\n\n# Kill by PID\nkill <PID>\n\n# Force kill\nkill -9 <PID>\n\n# Kill by name\npkill process_name",
          codeLanguage: "bash",
        },
        {
          question: "How do I configure a static IP address?",
          answer: "Static IP configuration varies by distribution. Modern systems often use NetworkManager or systemd-networkd. You can configure via command line or by editing configuration files.",
          categoryId: createdCategories["networking"],
          order: 4,
          codeSnippet: "# Using nmcli (NetworkManager)\nnmcli con mod \"Connection Name\" \\\n  ipv4.addresses 192.168.1.100/24 \\\n  ipv4.gateway 192.168.1.1 \\\n  ipv4.dns \"8.8.8.8 8.8.4.4\" \\\n  ipv4.method manual\n\n# Restart connection\nnmcli con down \"Connection Name\" && nmcli con up \"Connection Name\"",
          codeLanguage: "bash",
        },
        {
          question: "How do I check disk space usage?",
          answer: "Use the df command to check filesystem disk space usage, and du to check directory sizes. The -h flag shows human-readable sizes.",
          categoryId: createdCategories["system-config"],
          order: 5,
          codeSnippet: "# Check overall disk usage\ndf -h\n\n# Check current directory size\ndu -sh .\n\n# Check sizes of directories in current folder\ndu -sh */\n\n# Find large files (over 100MB)\nfind / -size +100M -type f 2>/dev/null",
          codeLanguage: "bash",
        },
        {
          question: "How do I install a .deb package?",
          answer: "On Debian/Ubuntu based systems, you can install .deb packages using dpkg or apt. Using apt is preferred as it handles dependencies automatically.",
          categoryId: createdCategories["installation"],
          order: 6,
          codeSnippet: "# Using apt (recommended - handles dependencies)\nsudo apt install ./package.deb\n\n# Using dpkg\nsudo dpkg -i package.deb\n\n# If dependencies are missing after dpkg\nsudo apt install -f",
          codeLanguage: "bash",
        },
        {
          question: "How do I check hardware information?",
          answer: "Linux provides several commands to check hardware information. lshw provides detailed info, while lscpu, lsblk, and lspci focus on specific hardware.",
          categoryId: createdCategories["hardware"],
          order: 7,
          codeSnippet: "# Full hardware info (as root)\nsudo lshw -short\n\n# CPU info\nlscpu\n\n# Memory info\nfree -h\ncat /proc/meminfo\n\n# Block devices (disks)\nlsblk\n\n# PCI devices (graphics, network, etc)\nlspci",
          codeLanguage: "bash",
        },
        {
          question: "How do I change file permissions?",
          answer: "Use chmod to change file permissions and chown to change ownership. Permissions can be set using numeric (octal) or symbolic notation.",
          categoryId: createdCategories["command-line"],
          order: 8,
          codeSnippet: "# Numeric: read(4) + write(2) + execute(1)\nchmod 755 file.sh  # rwxr-xr-x\nchmod 644 file.txt # rw-r--r--\n\n# Symbolic\nchmod +x script.sh    # Add execute\nchmod u+w,g-w file    # User +write, group -write\n\n# Change ownership\nchown user:group file",
          codeLanguage: "bash",
        },
      ];

      for (const faq of faqsData) {
        await storage.createFaq(faq);
      }

      res.json({ message: "Data seeded successfully", categories: Object.keys(createdCategories).length, faqs: faqsData.length });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  return httpServer;
}
