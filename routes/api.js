// I have utilized Perplexity and ChatGPT as resources for guidance and learning throughout this project. My approach reflects the growing trend of modern developers using AI tools to enhance their coding processes. However, all the final code presented here is my own work, based on own independently thought out prompts and without copying prompts or code from others other than snippets. I believe this practice aligns with the principles of academic honesty, as it emphasizes learning and using technology responsibly.

'use strict';

const { Thread, Reply } = require('../models/Thread');
const bcrypt = require('bcrypt');

module.exports = function (app) {
  // Threads API
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { board } = req.params;
        const { text, delete_password } = req.body;
        if (!text || !delete_password) return res.status(400).json({ error: 'Missing fields' });

        const hashedPassword = await bcrypt.hash(delete_password, 10);
        const now = new Date();
        const newThread = new Thread({
          board,
          text,
          delete_password: hashedPassword,
          created_on: now,
          bumped_on: now,
          reported: false,
          replies: []
        });
        await newThread.save();
        res.status(201).json(newThread);
      } catch (err) {
        res.status(500).json({ error: 'Error creating thread' });
      }
    })
    .get(async (req, res) => {
      try {
        const { board } = req.params;
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .populate({ path: 'replies', select: '-delete_password -reported', options: { limit: 3 } });

        res.json(threads.map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies,
          replycount: thread.replies.length
        })));
      } catch (err) {
        res.status(500).json({ error: 'Error fetching threads' });
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('incorrect password');

        const validPassword = await bcrypt.compare(delete_password, thread.delete_password);
        if (!validPassword) return res.send('incorrect password');

        await Thread.findByIdAndDelete(thread_id);
        await Reply.deleteMany({ _id: { $in: thread.replies } });
        res.send('success');
      } catch (err) {
        res.status(500).json({ error: 'Error deleting thread' });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.status(500).json({ error: 'Error reporting thread' });
      }
    });

  // Replies API
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password, thread_id } = req.body;
        if (!text || !delete_password || !thread_id) return res.status(400).json({ error: 'Missing fields' });

        const hashedPassword = await bcrypt.hash(delete_password, 10);
        const now = new Date();
        const reply = new Reply({ text, delete_password: hashedPassword, created_on: now, reported: false });
        await reply.save();

        const thread = await Thread.findByIdAndUpdate(thread_id, { bumped_on: now, $push: { replies: reply._id } }, { new: true }).populate('replies');
        if (!thread) return res.status(404).json({ error: 'Thread not found' });

        res.status(201).json(reply);
      } catch (err) {
        res.status(500).json({ error: 'Error creating reply' });
      }
    })
    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;
        const thread = await Thread.findById(thread_id).populate({ path: 'replies', select: '-delete_password -reported' });
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        res.json({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(reply => ({ _id: reply._id, text: reply.text, created_on: reply.created_on }))
        });
      } catch (err) {
        res.status(500).json({ error: 'Error fetching thread' });
      }
    })
    .delete(async (req, res) => {
      try {
        const { reply_id, delete_password } = req.body;
        const reply = await Reply.findById(reply_id);
        if (!reply) return res.send('incorrect password');

        const validPassword = await bcrypt.compare(delete_password, reply.delete_password);
        if (!validPassword) return res.send('incorrect password');

        await Reply.findByIdAndUpdate(reply_id, { text: '[deleted]' });
        res.send('success');
      } catch (err) {
        res.status(500).json({ error: 'Error deleting reply' });
      }
    })
    .put(async (req, res) => {
      try {
        const { reply_id } = req.body;
        await Reply.findByIdAndUpdate(reply_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.status(500).json({ error: 'Error reporting reply' });
      }
    });
};
