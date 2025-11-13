// ==============================
// Task Management API (Full CRUD)
// Node.js + Express + MongoDB Atlas
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== Mongoose Schema & Model =====
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// ===== Routes =====

// Root
app.get('/', (req, res) => {
  res.send('✅ Task Management API is running!');
});

// Retrieve all tasks
app.get('/api/v1/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Retrieve a single task by ID
app.get('/api/v1/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new task
app.post('/api/v1/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update task details (title, description, dueDate)
app.put('/api/v1/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update task status (PATCH)
app.patch('/api/v1/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status value' });

    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific task by ID
app.delete('/api/v1/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Retrieve tasks filtered by status
app.get('/api/v1/tasks/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    const tasks = await Task.find({ status });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search tasks by keyword (title or description)
app.get('/api/v1/tasks/search/:keyword', async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const tasks = await Task.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete all completed tasks at once
app.delete('/api/v1/tasks', async (req, res) => {
  try {
    const result = await Task.deleteMany({ status: 'Completed' });
    res.json({ message: `Deleted ${result.deletedCount} completed tasks.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== Connect to MongoDB Atlas =====
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

startServer();


