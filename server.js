// ==============================
// Task Management API (Full CRUD) + Swagger
// Node.js + Express + MongoDB Atlas + Swagger UI
// ==============================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== Swagger Configuration =====
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management API",
      version: "1.0.0",
      description: "API documentation for the Task Management System",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
      {
        url: "https://taskmanagement-deployment.vercel.app/",
      }
    ],
  },
  apis: ["./server.js"], // points to this file
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ==============================
// Swagger Components / Schemas
// ==============================

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Finish homework"
 *         description:
 *           type: string
 *           example: "Complete math and science assignments"
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: "2025-01-10T10:00:00Z"
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed]
 *           example: "Pending"
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */


// ==============================
// Mongoose Schema & Model
// ==============================

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);


// ==============================
// Routes + Swagger Docs
// ==============================

// Root
app.get("/", (req, res) => {
  res.send("✅ Task Management API is running!");
});


/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Retrieve all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Task"
 */
app.get("/api/v1/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Retrieve a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Task"
 *       404:
 *         description: Task not found
 */
app.get("/api/v1/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Task"
 *     responses:
 *       201:
 *         description: Task created
 */
app.post("/api/v1/tasks", async (req, res) => {
  try {
    let result;

    if (Array.isArray(req.body)) {
      result = await Task.insertMany(req.body);
      res.status(201).json(result);
    } else {
      const task = new Task(req.body);
      result = await task.save();
      res.status(201).json(result);
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Task"
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
app.put("/api/v1/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/v1/tasks/{id}/status:
 *   patch:
 *     summary: Update only the status of a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 */
app.patch("/api/v1/tasks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Completed", "In Progress"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Task deleted
 */
app.delete("/api/v1/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * /api/v1/tasks/search/{keyword}:
 *   get:
 *     summary: Search tasks by keyword
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *     responses:
 *       200:
 *         description: Search results
 */
app.get("/api/v1/tasks/search/:keyword", async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const tasks = await Task.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ==============================
// Connect to MongoDB and Start Server
// ==============================

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

startServer();
