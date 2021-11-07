const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const boardName = 'test_board';
const threadDeletedPassword = '1234';
const threadText = 'test thread';
const replyDeletedPassword = '54321';
const replyText = 'test reply';
let threadId, replyId;

suite('Functional Tests', function() {
  test('Creating a new thread: POST request to /api/threads/{board}', done => {
    chai
      .request(server)
      .post(`/api/threads/${boardName}`)
      .send({
        text: threadText,
        delete_password: threadDeletedPassword
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.text, threadText);
        assert.property(res.body, '_id');
        assert.notEqual(new Date(res.body.created_on), 'Invalid Date');
        assert.notEqual(new Date(res.body.bumped_on), 'Invalid Date');
        assert.equal(res.body.created_on, res.body.bumped_on)
        assert.equal(res.body.reported, false);
        assert.property(res.body, 'delete_password');
        assert.isArray(res.body.replies);
        threadId = res.body._id;
        done();
      });
  })

  test('Creating a new reply: POST request to /api/replies/{board}', done => {
    chai
      .request(server)
      .post(`/api/replies/${boardName}`)
      .send({
        text: replyText,
        delete_password: replyDeletedPassword,
        thread_id: threadId
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        const reply = res.body.replies[res.body.replies.length - 1]
        assert.equal(res.body.bumped_on, reply.created_on);
        assert.property(reply, '_id');
        assert.notEqual(new Date(reply.created_on), 'Invalid Date');
        assert.equal(reply.reported, false);
        assert.property(reply, 'delete_password');
        replyId = reply._id;
        done();
      });
  })

  test('Reporting a thread: PUT request to /api/threads/{board}', done => {
    chai
      .request(server)
      .put(`/api/replies/${boardName}`)
      .send({
        thread_id: threadId,
        reply_id: replyId
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.reported, true);
        done();
      });
  })

  test('Reporting a reply: PUT request to /api/replies/{board}', done => {
    chai
      .request(server)
      .put(`/api/threads/${boardName}`)
      .send({
        thread_id: threadId,

      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.reported, true);
        done();
      });
  })
  
  
  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', done => {
    chai
      .request(server)
      .get(`/api/threads/${boardName}`)
      .query({
        
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        assert.isAtMost(res.body[0].replies.length, 3);
        done();
      });
  })
  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', done => {
    chai
      .request(server)
      .get(`/api/replies/${boardName}`)
      .query({
        thread_id: threadId,
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        const reply = res.body.replies[res.body.replies.length - 1]
        assert.equal(res.body.bumped_on, reply.created_on);
        assert.property(reply, '_id');
        assert.notEqual(new Date(reply.created_on), 'Invalid Date');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'reported');
        assert.property(reply, 'reported');
        assert.property(reply, 'delete_password');
        replyId = reply._id;
        done();
      });
  })
  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', done => {
    chai
      .request(server)
      .delete(`/api/threads/${boardName}`)
      .send({
        thread_id: threadId,
        delete_password: threadDeletedPassword + '123'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  })
  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', done => {
    chai
      .request(server)
      .delete(`/api/replies/${boardName}`)
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: threadDeletedPassword + '123'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  })
  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', done => {
    chai
      .request(server)
      .delete(`/api/replies/${boardName}`)
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: replyDeletedPassword
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  })
  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', done => {
    chai
      .request(server)
      .delete(`/api/threads/${boardName}`)
      .send({
        thread_id: threadId,
        delete_password: threadDeletedPassword
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  })
});
