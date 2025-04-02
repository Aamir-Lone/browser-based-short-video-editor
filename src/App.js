// This is a high-level starting point. The app uses React (not Next.js), ffmpeg.wasm, and face detection/speech libraries.

// Install dependencies first:
// npm install react react-dom
// npm install @ffmpeg/ffmpeg
// npm install react-dropzone
// npm install @tensorflow/tfjs @tensorflow-models/blazeface


// src/App.js
import React, { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { useDropzone } from 'react-dropzone';
import './App.css';


const ffmpeg = new FFmpeg();

function DropzoneWrapper({ onDrop, label }) {
  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  return (
    <div {...getRootProps()} className="p-4 border cursor-pointer">
      <input {...getInputProps()} />
      {label}
    </div>
  );
}

function App() {
  const [video1, setVideo1] = useState(null);
  const [video2, setVideo2] = useState(null);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const detectFaceCropFromFrame = async (videoUrl, fallbackWidth, fallbackHeight) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.currentTime = 0.1;
      video.muted = true;
      video.addEventListener('loadeddata', async () => {
        const model = await blazeface.load();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const input = tf.browser.fromPixels(canvas);
        const predictions = await model.estimateFaces(input, false);
        input.dispose();

        let cropX = 0;
        let cropY = 0;

        if (predictions.length > 0) {
          const topLeft = predictions[0].topLeft;
          const bottomRight = predictions[0].bottomRight;
          const [x1, y1] = topLeft;
          const [x2, y2] = bottomRight;
          const faceCenterX = (x1 + x2) / 2;
          const faceCenterY = (y1 + y2) / 2;
          cropX = Math.max(0, Math.min(video.videoWidth - fallbackWidth, faceCenterX - fallbackWidth / 2));
          cropY = Math.max(0, Math.min(video.videoHeight - fallbackHeight, faceCenterY - fallbackHeight / 2));
        }

        resolve({ x: Math.floor(cropX), y: Math.floor(cropY), width: video.videoWidth, height: video.videoHeight });
      });
    });
  };

  const fetchFile = async (file) => {
    const response = await fetch(URL.createObjectURL(file));
    return new Uint8Array(await response.arrayBuffer());
  };

  const processVideos = async () => {
    setLoading(true);
    try {
      if (!ffmpeg.loaded) await ffmpeg.load();
      ffmpeg.on('log', ({ type, message }) => console.log(`[FFmpeg ${type}] ${message}`));

      await ffmpeg.writeFile('video1.mp4', await fetchFile(video1.file));
      await ffmpeg.writeFile('video2.mp4', await fetchFile(video2.file));

      const cropWidth = 1080;
      const cropHeight = 960;
      const face1 = await detectFaceCropFromFrame(video1.url, cropWidth, cropHeight);
      const face2 = await detectFaceCropFromFrame(video2.url, cropWidth, cropHeight);

      const filter = `
        [0:v]crop=${Math.min(cropWidth, face1.width)}:${Math.min(cropHeight, face1.height)}:${face1.x}:${face1.y}[v1];
        [1:v]crop=${Math.min(cropWidth, face2.width)}:${Math.min(cropHeight, face2.height)}:${face2.x}:${face2.y}[v2];
        [v1][v2]vstack=inputs=2[outv]
      `.replace(/\n/g, '');

      const args = [
        '-i', 'video1.mp4',
        '-i', 'video2.mp4',
        '-filter_complex', filter,
        '-map', '[outv]',
        '-map', '0:a?',
        '-map', '1:a?',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        '-preset', 'ultrafast',
        '-movflags', 'frag_keyframe+empty_moov',
        'output.mp4'
      ];

      console.log('Running FFmpeg:', args);
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile('output.mp4');
      if (!data || data.length < 1000) throw new Error('Video too small or corrupt.');

      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      console.log('Generated video size:', blob.size);
      setOutput(url);
    } catch (err) {
      console.error('FFmpeg Error:', err);
      alert('Processing failed. Check console for details.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Conversation Video Editor</h1>
      <div className="flex gap-4 mt-4">
        <DropzoneWrapper onDrop={(files) => setVideo1({ file: files[0], url: URL.createObjectURL(files[0]) })} label="Upload Video 1" />
        <DropzoneWrapper onDrop={(files) => setVideo2({ file: files[0], url: URL.createObjectURL(files[0]) })} label="Upload Video 2" />
      </div>

      {video1 && <video src={video1.url} controls width="300" />}
      {video2 && <video src={video2.url} controls width="300" />}
      <button onClick={processVideos} className="mt-4 px-4 py-2 bg-blue-500 text-white">Process</button>
      {loading && <p>Processing...</p>}
      {output && (
        <div className="mt-4">
          <h2 className="text-xl">Output Video</h2>
          <video src={output} controls width="300" />
          <a href={output} download="output.mp4" className="block text-blue-600 underline mt-2">Download</a>
        </div>
      )}
    </div>
  );
}

export default App;




//***************************************************************************************************** */



// import React, { useState } from 'react';
// // import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
// import { FFmpeg } from '@ffmpeg/ffmpeg';

// import * as blazeface from '@tensorflow-models/blazeface';
// import * as tf from '@tensorflow/tfjs';
// import { useDropzone } from 'react-dropzone';
// import axios from 'axios';
// import './App.css';

// // const ffmpeg = createFFmpeg({ log: true });
// const ffmpeg = new FFmpeg();

// function DropzoneWrapper({ onDrop, label }) {
//   const { getRootProps, getInputProps } = useDropzone({ onDrop });
//   return (
//     <div {...getRootProps()} className="p-4 border cursor-pointer">
//       <input {...getInputProps()} />
//       {label}
//     </div>
//   );
// }

// function App() {
//   const [video1, setVideo1] = useState(null);
//   const [video2, setVideo2] = useState(null);
//   const [output, setOutput] = useState(null);
//   const [transcription, setTranscription] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const detectFaceCropFromFrame = async (videoUrl, fallbackWidth, fallbackHeight) => {
//     return new Promise((resolve) => {
//       const video = document.createElement('video');
//       video.src = videoUrl;
//       video.crossOrigin = 'anonymous';
//       video.currentTime = 0.1;
//       video.muted = true;
//       video.addEventListener('loadeddata', async () => {
//         const model = await blazeface.load();
//         const canvas = document.createElement('canvas');
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(video, 0, 0);
//         const input = tf.browser.fromPixels(canvas);
//         const predictions = await model.estimateFaces(input, false);
//         input.dispose();

//         let cropX = 0;
//         let cropY = 0;

//         if (predictions.length > 0) {
//           const topLeft = predictions[0].topLeft;
//           const bottomRight = predictions[0].bottomRight;
//           const [x1, y1] = topLeft;
//           const [x2, y2] = bottomRight;
//           const faceCenterX = (x1 + x2) / 2;
//           const faceCenterY = (y1 + y2) / 2;
//           cropX = Math.max(0, Math.min(video.videoWidth - fallbackWidth, faceCenterX - fallbackWidth / 2));
//           cropY = Math.max(0, Math.min(video.videoHeight - fallbackHeight, faceCenterY - fallbackHeight / 2));
//         }

//         resolve({ x: Math.floor(cropX), y: Math.floor(cropY), width: video.videoWidth, height: video.videoHeight });
//       });
//     });
//   };

//   const fetchFile = async (file) => {
//     const response = await fetch(URL.createObjectURL(file));
//     return new Uint8Array(await response.arrayBuffer());
//   };

//   const processVideos = async () => {
//     setLoading(true);
//     try {
//       if (!ffmpeg.isLoaded()) await ffmpeg.load();
//       ffmpeg.on('log', ({ type, message }) => console.log(`[FFmpeg ${type}] ${message}`));

//       await ffmpeg.writeFile('video1.mp4', await fetchFile(video1.file));
//       await ffmpeg.writeFile('video2.mp4', await fetchFile(video2.file));

//       const cropWidth = 1080;
//       const cropHeight = 960;
//       const face1 = await detectFaceCropFromFrame(video1.url, cropWidth, cropHeight);
//       const face2 = await detectFaceCropFromFrame(video2.url, cropWidth, cropHeight);

//       const filter = `
//         [0:v]crop=${Math.min(cropWidth, face1.width)}:${Math.min(cropHeight, face1.height)}:${face1.x}:${face1.y}[v1];
//         [1:v]crop=${Math.min(cropWidth, face2.width)}:${Math.min(cropHeight, face2.height)}:${face2.x}:${face2.y}[v2];
//         [v1][v2]vstack=inputs=2[outv]
//       `.replace(/\n/g, '');

//       const args = [
//         '-i', 'video1.mp4',
//         '-i', 'video2.mp4',
//         '-filter_complex', filter,
//         '-map', '[outv]',
//         '-map', '0:a?',
//         '-map', '1:a?',
//         '-c:v', 'libx264',
//         '-c:a', 'aac',
//         '-shortest',
//         '-preset', 'ultrafast',
//         '-movflags', 'frag_keyframe+empty_moov',
//         'output.mp4'
//       ];

//       console.log('Running FFmpeg:', args);
//       await ffmpeg.run(...args);

//       const data = await ffmpeg.readFile('output.mp4');
//       if (!data || data.length < 1000) throw new Error('Video too small or corrupt.');

//       const blob = new Blob([data.buffer], { type: 'video/mp4' });
//       const url = URL.createObjectURL(blob);
//       setOutput(url);

//       // Extract and send audio for transcription
//       extractAudioAndTranscribe(blob);
//     } catch (err) {
//       console.error('FFmpeg Error:', err);
//       alert('Processing failed. Check console for details.');
//     }
//     setLoading(false);
//   };

//   const extractAudioAndTranscribe = async (videoBlob) => {
//     if (!ffmpeg.isLoaded()) await ffmpeg.load();

//     ffmpeg.FS('writeFile', 'final.mp4', await fetchFile(videoBlob));
//     await ffmpeg.run('-i', 'final.mp4', '-q:a', '0', '-map', 'a', 'audio.wav');

//     const audioData = ffmpeg.FS('readFile', 'audio.wav');
//     const audioBlob = new Blob([audioData.buffer], { type: 'audio/wav' });
//     const audioFile = new File([audioBlob], 'audio.wav');

//     const formData = new FormData();
//     formData.append('file', audioFile);

//     try {
//       const response = await axios.post('http://localhost:5000/transcribe', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       setTranscription(response.data);
//       saveJsonFile(response.data, 'transcription.json');
//       burnCaptions(response.data);
//     } catch (error) {
//       console.error('Transcription Error:', error);
//     }
//   };

//   const saveJsonFile = (data, filename) => {
//     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const burnCaptions = async (transcriptionData) => {
//     if (!ffmpeg.isLoaded()) await ffmpeg.load();

//     let srtContent = "";
//     transcriptionData.results.channels[0].alternatives[0].words.forEach((word, index) => {
//       const start = new Date(word.start * 1000).toISOString().substr(11, 12);
//       const end = new Date(word.end * 1000).toISOString().substr(11, 12);
//       srtContent += `${index + 1}\n${start} --> ${end}\n${word.word}\n\n`;
//     });

//     ffmpeg.FS('writeFile', 'subtitles.srt', new TextEncoder().encode(srtContent));

//     await ffmpeg.run(
//       '-i', 'final.mp4',
//       '-vf', 'subtitles=subtitles.srt',
//       '-c:a', 'copy',
//       'final_with_subs.mp4'
//     );

//     const processedData = ffmpeg.FS('readFile', 'final_with_subs.mp4');
//     const processedBlob = new Blob([processedData.buffer], { type: 'video/mp4' });
//     setOutput(URL.createObjectURL(processedBlob));
//   };

//   return (
//     <div>
//       <h1>Conversation Video Editor</h1>
//       <button onClick={processVideos}>Process</button>
//       {output && <video src={output} controls width="600" />}
//     </div>
//   );
// }

// export default App;










// import React, { useState } from 'react';
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { useDropzone } from 'react-dropzone';
// import axios from 'axios';
// import './App.css';

// // const ffmpeg = new FFmpeg();
// import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
// const ffmpeg = createFFmpeg({ log: true }); // Enable logs for debugging
// async function loadFFmpeg() {
//   if (!ffmpeg.isLoaded()) {
//       await ffmpeg.load();
//   }
// }
// async function extractAudioAndTranscribe(videoFile) {
//   await loadFFmpeg(); // Ensure FFmpeg is loaded before using FS

//   ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

//   await ffmpeg.run(
//       '-i', 'input.mp4',
//       '-q:a', '0',
//       '-map', 'a',
//       'audio.mp3'
//   );

//   const audioData = ffmpeg.FS('readFile', 'audio.mp3');
//   const audioBlob = new Blob([audioData.buffer], { type: 'audio/mp3' });
//   return audioBlob;
// }

// function DropzoneWrapper({ onDrop, label }) {
//   const { getRootProps, getInputProps } = useDropzone({ onDrop });
//   return (
//     <div {...getRootProps()} className="p-4 border cursor-pointer">
//       <input {...getInputProps()} />
//       {label}
//     </div>
//   );
// }

// function App() {
//   const [video1, setVideo1] = useState(null);
//   const [video2, setVideo2] = useState(null);
//   const [output, setOutput] = useState(null);
//   const [transcription, setTranscription] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // Helper function to convert file/blob into Uint8Array
//   const fetchFile = async (file) => {
//     if (!file) throw new Error("fetchFile received an invalid file!");

//     if (typeof file === "string" && file.startsWith("blob:")) {
//       const response = await fetch(file);
//       file = await response.blob();
//     }

//     if (file instanceof Blob || file instanceof File) {
//       return new Uint8Array(await file.arrayBuffer());
//     }

//     throw new Error("fetchFile expected a Blob or File but got something else.");
//   };

//   const processVideos = async () => {
//     setLoading(true);
//     try {
//       if (!ffmpeg.loaded) await ffmpeg.load();
//       ffmpeg.on('log', ({ type, message }) => console.log(`[FFmpeg ${type}] ${message}`));

//       await ffmpeg.writeFile('video1.mp4', await fetchFile(video1.file));
//       await ffmpeg.writeFile('video2.mp4', await fetchFile(video2.file));

//       const args = [
//         '-i', 'video1.mp4',
//         '-i', 'video2.mp4',
//         '-filter_complex', '[0:v][1:v]vstack=inputs=2[outv]',
//         '-map', '[outv]',
//         '-map', '0:a?',
//         '-map', '1:a?',
//         '-c:v', 'libx264',
//         '-c:a', 'aac',
//         '-shortest',
//         '-preset', 'ultrafast',
//         '-movflags', 'frag_keyframe+empty_moov',
//         'output.mp4'
//       ];

//       console.log('Running FFmpeg:', args);
//       await ffmpeg.exec(args);

//       const data = await ffmpeg.readFile('output.mp4');
//       if (!data || data.length < 1000) throw new Error('Video too small or corrupt.');

//       const blob = new Blob([data.buffer], { type: 'video/mp4' });
//       const url = URL.createObjectURL(blob);
//       console.log('Generated video size:', blob.size);
//       setOutput(url);
//     } catch (err) {
//       console.error('FFmpeg Error:', err);
//       alert('Processing failed. Check console for details.');
//     }
//     setLoading(false);
//   };

//   const extractAudioAndTranscribe = async (videoBlob) => {
//     setLoading(true);
//     try {
//       if (!ffmpeg.loaded) await ffmpeg.load();

//       await ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(videoBlob));
//       await ffmpeg.run('-i', 'video.mp4', '-q:a', '0', '-map', 'a', 'audio.wav');

//       const audioData = ffmpeg.FS('readFile', 'audio.wav');
//       if (!audioData || audioData.length === 0) throw new Error("Audio extraction failed.");

//       const audioBlob = new Blob([audioData.buffer], { type: 'audio/wav' });
//       const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

//       const formData = new FormData();
//       formData.append('file', audioFile);

//       const response = await axios.post('http://localhost:5000/transcribe', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       setTranscription(response.data);
//       saveJsonFile(response.data, 'transcription.json');
//       burnCaptions(response.data);
//     } catch (error) {
//       console.error('Error extracting audio or transcribing:', error);
//       alert(`Error: ${error.message}`);
//     }
//     setLoading(false);
//   };

//   const saveJsonFile = (data, filename) => {
//     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const burnCaptions = async (transcriptionData) => {
//     if (!ffmpeg.loaded) await ffmpeg.load();

//     let srtContent = '';
//     transcriptionData.results.channels[0].alternatives[0].words.forEach((word, index) => {
//       const start = new Date(word.start * 1000).toISOString().substr(11, 12);
//       const end = new Date(word.end * 1000).toISOString().substr(11, 12);
//       srtContent += `${index + 1}\n${start} --> ${end}\n${word.word}\n\n`;
//     });

//     ffmpeg.FS('writeFile', 'subtitles.srt', new TextEncoder().encode(srtContent));

//     await ffmpeg.run(
//       '-i', 'video.mp4',
//       '-vf', 'subtitles=subtitles.srt',
//       '-c:a', 'copy',
//       'final_with_subs.mp4'
//     );

//     const processedData = ffmpeg.FS('readFile', 'final_with_subs.mp4');
//     const processedBlob = new Blob([processedData.buffer], { type: 'video/mp4' });
//     setOutput(URL.createObjectURL(processedBlob));
//     setLoading(false);
//   };

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold">Conversation Video Editor</h1>
//       <div className="flex gap-4 mt-4">
//         <DropzoneWrapper onDrop={(files) => setVideo1({ file: files[0], url: URL.createObjectURL(files[0]) })} label="Upload Video 1" />
//         <DropzoneWrapper onDrop={(files) => setVideo2({ file: files[0], url: URL.createObjectURL(files[0]) })} label="Upload Video 2" />
//       </div>
//       {loading && <p>Processing...</p>}
//       {video1 && video2 && (
//         <button onClick={processVideos} className="bg-blue-500 text-white p-2 mt-4">
//           Process Videos
//         </button>
//       )}
//       {output && (
//         <div className="mt-4">
//           <h2 className="font-semibold">Final Video</h2>
//           <video src={output} controls width="500" />
//         </div>
//       )}
//       {output && !transcription && (
//         <button onClick={() => extractAudioAndTranscribe(output)} className="bg-green-500 text-white p-2 mt-4">
//           Transcribe Video Audio
//         </button>
//       )}
//       {transcription && (
//         <div className="mt-4">
//           <h2 className="font-semibold">Transcription</h2>
//           <pre>{JSON.stringify(transcription, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
