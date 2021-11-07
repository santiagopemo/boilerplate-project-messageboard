'use strict';

const {Board, Thread, Reply} = require('../models');
const bcrypt = require('bcrypt');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get((req, res) => {
      const {board} = req.params;
      const {thread_id} = req.query;
      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }
        if (thread_id) {
          const thread = boardData.threads.id(thread_id);
          if (thread) {
            res.json(thread)
          } else {
            res.json({error: `Thread ${thread_id} on board ${board} not found`});
          }
          return;
        }
        const threads = boardData.threads
          .map((thread) => ({
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies,
            replycount: thread.replies.length
          }))
          .sort((a, b) => new Date(b.bumped_on) - new Date(a.bumped_on))
          .slice(0, 10)
          .map((thread) => {
            thread.replies = thread.replies.sort((a, b) => new Date(b.created_on) - new Date(a.created_on)).slice(0, 3)
            return thread;
          });
        res.json(threads);
      })
    })
    .post(async (req, res) => {
      const {board} = req.params;
      let {text, delete_password, reported} = req.body;

      const createdOn = Date.now(); 
      
      delete_password = delete_password ? await bcrypt.hash(delete_password, 7) : undefined;
      const newThread = new Thread({text, delete_password, reported, created_on: createdOn, bumped_on: createdOn});
      
      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        else if (!boardData) {
          Board.create({name: board}, (err, newBoardData) => {
            if (err) {
              res.json({error: err.message});
              return;
            }
            newBoardData.threads.push(newThread);
            newBoardData.save((err, updatedBoardData) => {
              if (err) {
                res.json({error: err.message});
                return;
              }
              res.json(newThread)
            })
            
          });
        } else {
          boardData.threads.push(newThread);
            boardData.save((err, updatedBoardData) => {
              if (err) {
                res.json({error: err.message});
                return;
              }
              res.json(newThread)
            });
        }
      });
      
    })
    .put((req, res) => {
      const {board} = req.params;
      const {thread_id} = req.body;

      if(!thread_id) {
        res.json({error: 'Missing thread_id filed'});
        return;
      }

      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }
        
        const thread = boardData.threads.id(thread_id);
        if (thread) {
          thread.reported = true;
          boardData.save((err, savedBoardData) => {
            if (err) {
              res.json({error: err.message});
              return;
            }
            res.json(savedBoardData.threads.id(thread_id));
          });
        } else {
          res.json({error: `Thread ${thread_id} on board ${board} not found`});
        }
        
      })
    })
    .delete((req, res) => {
      const {board} = req.params;
      const {thread_id, delete_password} = req.body;

      if(!thread_id || !delete_password) {
        res.json({error: 'Missing reqiered fileds'});
        return;
      }

      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }
        
        const thread = boardData.threads.id(thread_id);
        if (thread) {
          if (bcrypt.compareSync(delete_password, thread.delete_password)) {
            thread.remove();
            boardData.save((err, savedBoardData) => {
              if (err) {
                res.json({error: err.message});
                return;
              }
              res.send('success');
            });
          } else {
            res.send('incorrect password');
          }          
        } else {
          res.json({error: `Thread ${thread_id} on board ${board} not found`});
        }
        
      })
    });
    
  app.route('/api/replies/:board')
    .get((req, res) => {
      const {board} = req.params;
      const {thread_id} = req.query;
      if (!thread_id) {
        res.json({error: `Missing thread_id field`});
        return;
      }
      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }        
        const thread = boardData.threads.id(thread_id);
        if (thread) {
          res.json(thread)
        } else {
          res.json({error: `Thread ${thread_id} on board ${board} not found`});
        }        
      })
    })
    .post(async (req, res) => {
      const {board} = req.params;
      let {text, delete_password, reported, thread_id} = req.body;
      if (!delete_password || !thread_id) {
        res.json({error: 'Missing required fields'});
        return;
      }
      delete_password = delete_password ? await bcrypt.hash(delete_password, 7) : undefined;
      
      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }
        const thread = boardData.threads.id(thread_id);
        if (!thread) {
          res.json({error: `Thread ${thread_id} on board ${board} not found`});
          return;
        }
        const created_on = Date.now()
        const newReply = new Reply({
          text,
          created_on,
          delete_password,
          reported
        });
        thread.replies.push(newReply);
        thread.bumped_on = created_on;
        boardData.save((err, savedBoardData) => {
          if (err) {
            res.json({error: err.message});
            return;
          }
          res.json(savedBoardData.threads.id(thread_id));
        });
      });
    })
    .put((req, res) => {
      const {board} = req.params;
      const {thread_id, reply_id} = req.body;

      if(!thread_id || !reply_id) {
        res.json({error: 'Missing required fileds'});
        return;
      }

      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }
        
        const thread = boardData.threads.id(thread_id);
        if (thread) {
          const reply = thread.replies.id(reply_id);
          if (reply) {            
            reply.reported = true;
            boardData.save((err, savedBoardData) => {
              if (err) {
                res.json({error: err.message});
                return;
              }
              res.json(savedBoardData.threads.id(thread_id).replies.id(reply_id));
            });            
          } else {
            res.json({error: `Reply ${reply_id} in thread ${thread_id} on board ${board} not found`});
          }        
        } else {
          res.json({error: `Thread ${thread_id} on board ${board} not found`});
        }        
      })
    })
    .delete((req, res) => {
      const {board} = req.params;
      const {thread_id, delete_password, reply_id} = req.body;

      if(!thread_id || !delete_password || !reply_id) {
        res.json({error: 'Missing required fileds'});
        return;
      }

      Board.findOne({name: board}, (err, boardData) => {
        if (err) {
          res.json({error: err.message});
          return;
        }
        if(!boardData) {
          res.json({error: `Board ${board} not found`});
          return;
        }
        
        const thread = boardData.threads.id(thread_id);
        if (thread) {
          const reply = thread.replies.id(reply_id);
          if (reply) {
            if (bcrypt.compareSync(delete_password, reply.delete_password)) {
              reply.text = "[deleted]";
              boardData.save((err, savedBoardData) => {
                if (err) {
                  res.json({error: err.message});
                  return;
                }
                res.send('success');
              });
            } else {
              res.send('incorrect password');
            }
          } else {
            res.json({error: `Reply ${reply_id} in thread ${thread_id} on board ${board} not found`});
          }        
        } else {
          res.json({error: `Thread ${thread_id} on board ${board} not found`});
        }        
      })
    });

};
