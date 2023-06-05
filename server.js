const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const jwt = require('jsonwebtoken');


// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// Error Handling Middleware
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
}

// Models
const User = require('./models/User');
const Post = require('./models/Post');

// Authenticate Middleware
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Authorization Middleware
async function authorize(req, res, next) {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}

// User Registration Endpoint
app.post(
  '/api/register',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;
      const user = new User({ username, password });
      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

// User Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Create a new blog post
app.post(
  '/api/posts',
  authenticate,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content } = req.body;
      const post = new Post({ title, content, author: req.userId });
      await post.save();
      res.status(201).json({ message: 'Post created successfully', post });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

// Update a blog post
app.put(
  '/api/posts/:postId',
  authenticate,
  authorize,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content } = req.body;
      const post = await Post.findByIdAndUpdate(
        req.params.postId,
        { title, content },
        { new: true }
      );
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json({ message: 'Post updated successfully', post });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

// Delete a blog post
app.delete('/api/posts/:postId', authenticate, authorize, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully', post });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Add a comment to a blog post
app.post(
  '/api/posts/:postId/comments',
  authenticate,
  body('body').notEmpty().withMessage('Comment body is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { body } = req.body;
      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const comment = { body, author: req.userId };
      post.comments.push(comment);
      await post.save();
      res.status(201).json({ message: 'Comment added successfully', comment });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

// Update a comment on a blog post
app.put(
  '/api/posts/:postId/comments/:commentId',
  authenticate,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const { body } = req.body;
      const post = await Post.findOneAndUpdate(
        { _id: req.params.postId, 'comments._id': commentId, 'comments.author': req.userId },
        { $set: { 'comments.$.body': body } },
        { new: true }
      );
      if (!post) {
        return res.status(404).json({ error: 'Post or comment not found' });
      }
      res.json({ message: 'Comment updated successfully', post });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

// Delete a comment from a blog post
app.delete(
  '/api/posts/:postId/comments/:commentId',
  authenticate,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const post = await Post.findByIdAndUpdate(
        req.params.postId,
        { $pull: { comments: { _id: commentId, author: req.userId } } },
        { new: true }
      );
      if (!post) {
        return res.status(404).json({ error: 'Post or comment not found' });
      }
      res.json({ message: 'Comment deleted successfully', post });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

// Fetch a user's profile
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Fetch a user's activity feed
app.get('/api/users/:userId/feed', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Fetch user's posts, comments, liked/bookmarked posts, etc.
    const feed = { /* populate user's feed */ };
    res.json({ feed });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Like a post
app.post('/api/posts/:postId/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // Add like to the post
    post.likes.push(req.userId);
    await post.save();
    res.json({ message: 'Post liked successfully', post });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Unlike a post
app.delete('/api/posts/:postId/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // Remove like from the post
    post.likes.pull(req.userId);
    await post.save();
    res.json({ message: 'Post unliked successfully', post });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Error Handling Middleware
app.use(errorHandler);
