// I have utilized Perplexity and ChatGPT as resources for guidance and learning throughout this project. My approach reflects the growing trend of modern developers using AI tools to enhance their coding processes. However, all the final code presented here is my own work, based on own independently thought out prompts and without copying prompts or code from others other than snippets. I believe this practice aligns with the principles of academic honesty, as it emphasizes learning and using technology responsibly.

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let threadId;
  let replyId;
  const testPassword = 'testpassword';
  
  // 1. Create new thread
  test('Create a new thread', function(done) {
    chai.request(server)
      .post('/api/threads/testboard')
      .send({ text: 'Test thread', delete_password: testPassword })
      .end((err, res) => {
        assert.equal(res.status, 201);
        assert.property(res.body, '_id');
        threadId = res.body._id;
        done();
      });
  });

  // 6. Create new reply
  test('Create a new reply', function(done) {
    chai.request(server)
      .post('/api/replies/testboard')
      .send({ text: 'Test reply', delete_password: testPassword, thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 201);
        assert.property(res.body, '_id');
        replyId = res.body._id;
        done();
      });
  });

  // 2. View recent threads
  test('Viewing the 10 most recent threads', function(done) {
    chai.request(server)
      .get('/api/threads/testboard')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        const thread = res.body.find(t => t._id === threadId);
        assert.exists(thread);
        assert.equal(thread.text, 'Test thread');
        assert.notProperty(thread, 'delete_password');
        assert.notProperty(thread, 'reported');
        done();
      });
  });

  // 7. View single thread
  test('Viewing a single thread', function(done) {
    chai.request(server)
      .get('/api/replies/testboard')
      .query({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, threadId);
        assert.equal(res.body.text, 'Test thread');
        assert.isArray(res.body.replies);
        const reply = res.body.replies.find(r => r._id === replyId);
        assert.exists(reply);
        assert.equal(reply.text, 'Test reply');
        assert.notProperty(reply, 'delete_password');
        assert.notProperty(reply, 'reported');
        done();
      });
  });

  // 5. Report thread
  test('Reporting a thread', function(done) {
    chai.request(server)
      .put('/api/threads/testboard')
      .send({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // 10. Report reply
  test('Reporting a reply', function(done) {
    chai.request(server)
      .put('/api/replies/testboard')
      .send({ reply_id: replyId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // 8. Delete reply (incorrect password)
  test('Delete a reply with incorrect password', function(done) {
    chai.request(server)
      .delete('/api/replies/testboard')
      .send({ reply_id: replyId, delete_password: 'wrongpassword' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. Delete reply (correct password)
  test('Delete a reply with correct password', function(done) {
    chai.request(server)
      .delete('/api/replies/testboard')
      .send({ reply_id: replyId, delete_password: testPassword })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 3. Delete thread (incorrect password)
  test('Delete a thread with incorrect password', function(done) {
    chai.request(server)
      .delete('/api/threads/testboard')
      .send({ thread_id: threadId, delete_password: 'wrongpassword' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 4. Delete thread (correct password)
  test('Delete a thread with correct password', function(done) {
    chai.request(server)
      .delete('/api/threads/testboard')
      .send({ thread_id: threadId, delete_password: testPassword })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });
});
