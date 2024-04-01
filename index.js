const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const upload = multer({ dest: 'uploads/' });

const sessions = {};

app.get('/api/create-session', (req, res) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions[sessionId] = { files: [], result: 0 };
  res.json({ Session_id: sessionId });
});

app.post('/api/upload-file/:sessionId', upload.array('files', 15), (req, res) => {
  const sessionId = req.params.sessionId;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const filePaths = req.files.map((file) => file.path);
  const equations = filePaths.map((filePath) => fs.readFileSync(filePath, 'utf-8').trim());

  session.files.push(...filePaths);
  session.result = calculateResult(session.files, equations);

  if (session.files.length > 15) {
    const fileToRemove = session.files.shift();
    fs.unlinkSync(fileToRemove);
  }

  res.json({ Result: session.result });
});

app.delete('/api/delete-session/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.files.forEach((filePath) => fs.unlinkSync(filePath));
  delete sessions[sessionId];

  res.status(200).json({ message: 'Session deleted' });
});

function calculateResult(filePaths, equations) {
  return equations.reduce((sum, equation) => {
    const result = eval(equation);
    return sum + result;
  }, 0);
}

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});