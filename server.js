
// import multer from 'multer';
// import express from 'express';
// import cors from 'cors';
// import fs from 'fs';
// import { createClient } from '@deepgram/sdk';
// import dotenv from "dotenv";
// dotenv.config();

// const app = express();
// const PORT = 5000;

// // Enable CORS for frontend access
// app.use(cors());

// // Multer setup for handling file uploads
// const upload = multer({ dest: 'uploads/' });

// // Initialize Deepgram API

// const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// // API Route to Handle File Upload & Transcription
// app.post('/transcribe', upload.single('audio'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'No file uploaded' });
//         }

//         const fileBuffer = fs.readFileSync(req.file.path);

//         const response = await deepgram.transcription.preRecorded(
//             { buffer: fileBuffer, mimetype: 'audio/mp4' },
//             { punctuate: true, model: 'whisper' }
//         );

//         // Remove uploaded file after processing
//         fs.unlinkSync(req.file.path);

//         res.json({ transcript: response.results.channels[0].alternatives[0].transcript });
//     } catch (error) {
//         console.error('Deepgram API Error:', error);
//         res.status(500).json({ error: 'Transcription failed' });
//     }
// });

// // Start Express Server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





//******************************************************* */

import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { Deepgram } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

    const fileBuffer = fs.readFileSync(req.file.path);
    const response = await deepgram.transcription.preRecorded(
      { buffer: fileBuffer, mimetype: "audio/wav" },
      { punctuate: true, utterances: true, diarize: true }
    );

    fs.writeFileSync("transcription.json", JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error("Deepgram error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
