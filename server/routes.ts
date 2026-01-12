import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema, insertAnswerSchema, insertCategorySchema, insertFaqSchema } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerObjectStorageRoutes(app);

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

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.post("/api/questions/:id/vote", async (req, res) => {
    try {
      const { direction } = req.body;
      if (direction !== "up" && direction !== "down") {
        return res.status(400).json({ error: "Invalid vote direction" });
      }
      await storage.updateQuestionVotes(req.params.id, direction);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating vote:", error);
      res.status(500).json({ error: "Failed to update vote" });
    }
  });

  app.post("/api/questions/:id/answers", async (req, res) => {
    try {
      const validatedData = insertAnswerSchema.parse({
        ...req.body,
        questionId: req.params.id,
      });
      const answer = await storage.createAnswer(validatedData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating answer:", error);
      res.status(500).json({ error: "Failed to create answer" });
    }
  });

  app.post("/api/answers/:id/vote", async (req, res) => {
    try {
      const { direction } = req.body;
      if (direction !== "up" && direction !== "down") {
        return res.status(400).json({ error: "Invalid vote direction" });
      }
      await storage.updateAnswerVotes(req.params.id, direction);
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
