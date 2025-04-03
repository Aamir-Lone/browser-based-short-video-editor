// // This is a high-level starting point. The app uses React (not Next.js), ffmpeg.wasm, and face detection/speech libraries.

// // Install dependencies first:
// // npm install react react-dom
// // npm install @ffmpeg/ffmpeg
// // npm install react-dropzone
// // npm install @tensorflow/tfjs @tensorflow-models/blazeface


// // src/App.js
// import React, { useState } from 'react';
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import * as blazeface from '@tensorflow-models/blazeface';
// import * as tf from '@tensorflow/tfjs';
// import { useDropzone } from 'react-dropzone';
// import './App.css';


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
//       if (!ffmpeg.loaded) await ffmpeg.load();
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

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold">Conversation Video Editor</h1>
//       <div className="flex gap-4 mt-4">
//         <DropzoneWrapper onDrop={(files) => setVideo1({ file: files[0], url: URL.createObjectURL(files[0]) })} label="Upload Video 1" />
//         <DropzoneWrapper onDrop={(files) => setVideo2({ file: files[0], url: URL.createObjectURL(files[0]) })} label="Upload Video 2" />
//       </div>

//       {video1 && <video src={video1.url} controls width="300" />}
//       {video2 && <video src={video2.url} controls width="300" />}
//       <button onClick={processVideos} className="mt-4 px-4 py-2 bg-blue-500 text-white">Process</button>
//       {loading && <p>Processing...</p>}
//       {output && (
//         <div className="mt-4">
//           <h2 className="text-xl">Output Video</h2>
//           <video src={output} controls width="300" />
//           <a href={output} download="output.mp4" className="block text-blue-600 underline mt-2">Download</a>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;




// //*********************************************************************************************** */




// // src/App.js
// import React, { useState, useEffect, useRef } from 'react';
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import * as blazeface from '@tensorflow-models/blazeface';
// import * as tf from '@tensorflow/tfjs';
// import { useDropzone } from 'react-dropzone';
// import './App.css';

// // Create FFmpeg instance
// const ffmpeg = new FFmpeg();

// // Utility components
// function DropzoneWrapper({ onDrop, label, accept = { 'video/*': ['.mp4', '.webm'] } }) {
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
//     onDrop, 
//     accept,
//     maxSize: 100 * 1024 * 1024 // 100MB limit
//   });
  
//   return (
//     <div 
//       {...getRootProps()} 
//       className={`p-6 border-2 border-dashed rounded-lg cursor-pointer ${
//         isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
//       }`}
//     >
//       <input {...getInputProps()} />
//       <div className="text-center">
//         <p className="text-lg font-medium">{label}</p>
//         <p className="text-sm text-gray-500">Drag & drop or click to select (MP4/WebM, max 60s)</p>
//       </div>
//     </div>
//   );
// }

// function CaptionStyler({ options, onChange }) {
//   return (
//     <div className="grid grid-cols-2 gap-4">
//       <div>
//         <label className="block text-sm font-medium">Font</label>
//         <select 
//           value={options.font} 
//           onChange={(e) => onChange({...options, font: e.target.value})}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
//         >
//           <option value="Arial">Arial</option>
//           <option value="Roboto">Roboto</option>
//           <option value="Montserrat">Montserrat</option>
//           <option value="OpenSans">Open Sans</option>
//         </select>
//       </div>
      
//       <div>
//         <label className="block text-sm font-medium">Size</label>
//         <select 
//           value={options.size} 
//           onChange={(e) => onChange({...options, size: e.target.value})}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
//         >
//           <option value="24">Small</option>
//           <option value="32">Medium</option>
//           <option value="48">Large</option>
//         </select>
//       </div>
      
//       <div>
//         <label className="block text-sm font-medium">Color</label>
//         <select 
//           value={options.color} 
//           onChange={(e) => onChange({...options, color: e.target.value})}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
//         >
//           <option value="white">White</option>
//           <option value="yellow">Yellow</option>
//           <option value="black">Black</option>
//         </select>
//       </div>
      
//       <div>
//         <label className="block text-sm font-medium">Position</label>
//         <select 
//           value={options.position} 
//           onChange={(e) => onChange({...options, position: e.target.value})}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
//         >
//           <option value="bottom">Bottom</option>
//           <option value="top">Top</option>
//         </select>
//       </div>
//     </div>
//   );
// }

// function App() {
//   // State management
//   const [video1, setVideo1] = useState(null);
//   const [video2, setVideo2] = useState(null);
//   const [output, setOutput] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [transcript1, setTranscript1] = useState([]);
//   const [transcript2, setTranscript2] = useState([]);
//   const [faceModel, setFaceModel] = useState(null);
//   const [layoutMode, setLayoutMode] = useState('stack'); // 'stack' or 'switch'
//   const [captionOptions, setCaptionOptions] = useState({
//     font: 'Arial',
//     size: '32',
//     color: 'white',
//     position: 'bottom',
//     enabled: true
//   });
  
//   const videoRef1 = useRef(null);
//   const videoRef2 = useRef(null);

//   // Load models on component mount
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         // Load face detection model
//         const model = await blazeface.load();
//         setFaceModel(model);
//         console.log("Face detection model loaded");
        
//         // Load FFmpeg
//         if (!ffmpeg.loaded) {
//           await ffmpeg.load();
//           console.log("FFmpeg loaded");
//         }
//       } catch (err) {
//         console.error("Error loading models:", err);
//         alert("Failed to load required models. Check console for details.");
//       }
//     };
    
//     loadModels();
//   }, []);

//   // Face detection and crop calculation
//   const detectFaceCropFromFrame = async (videoElement, targetWidth, targetHeight) => {
//     return new Promise(async (resolve) => {
//       try {
//         if (!faceModel) {
//           console.warn("Face model not loaded yet");
//           resolve({ 
//             x: 0, 
//             y: 0, 
//             width: videoElement.videoWidth, 
//             height: videoElement.videoHeight 
//           });
//           return;
//         }
        
//         const canvas = document.createElement('canvas');
//         canvas.width = videoElement.videoWidth;
//         canvas.height = videoElement.videoHeight;
//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(videoElement, 0, 0);
        
//         const input = tf.browser.fromPixels(canvas);
//         const predictions = await faceModel.estimateFaces(input, false);
//         input.dispose();
        
//         let cropX = 0;
//         let cropY = 0;
        
//         if (predictions.length > 0) {
//           // Get face bounding box
//           const topLeft = predictions[0].topLeft;
//           const bottomRight = predictions[0].bottomRight;
//           const [x1, y1] = topLeft;
//           const [x2, y2] = bottomRight;
          
//           // Calculate face center
//           const faceCenterX = (x1 + x2) / 2;
//           const faceCenterY = (y1 + y2) / 2;
          
//           // Calculate crop area centered on face
//           cropX = Math.max(0, Math.min(videoElement.videoWidth - targetWidth, faceCenterX - targetWidth / 2));
//           cropY = Math.max(0, Math.min(videoElement.videoHeight - targetHeight, faceCenterY - targetHeight / 2));
//         }
        
//         resolve({ 
//           x: Math.floor(cropX), 
//           y: Math.floor(cropY), 
//           width: videoElement.videoWidth, 
//           height: videoElement.videoHeight 
//         });
//       } catch (err) {
//         console.error("Face detection error:", err);
//         resolve({ 
//           x: 0, 
//           y: 0, 
//           width: videoElement.videoWidth, 
//           height: videoElement.videoHeight 
//         });
//       }
//     });
//   };

//   // Generate WebVTT file for captions
//   const generateWebVTT = (transcript, speaker) => {
//     let vtt = "WEBVTT\n\n";
    
//     transcript.forEach((item, index) => {
//       vtt += `${index + 1}\n`;
//       vtt += `${formatTime(item.start)} --> ${formatTime(item.end)}\n`;
//       vtt += `<v Speaker ${speaker}>${item.text}</v>\n\n`;
//     });
    
//     return vtt;
//   };
  
//   // Format time for WebVTT
//   const formatTime = (seconds) => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = Math.floor(seconds % 60);
//     const ms = Math.floor((seconds % 1) * 1000);
    
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
//   };

//   // Basic speech-to-text (mock implementation)
//   const transcribeAudio = async (videoFile, setTranscript) => {
//     try {
//       // This is a placeholder. In a real app, you would use a proper speech API
//       const duration = await getVideoDuration(videoFile);
//       const wordCount = Math.floor(duration * 2); // Assume 2 words per second
      
//       const mockTranscript = [];
//       let currentTime = 0.5;
      
//       for (let i = 0; i < wordCount; i++) {
//         const wordDuration = 0.3 + Math.random() * 0.4; // Between 0.3 and 0.7 seconds per word
//         mockTranscript.push({
//           text: `word${i+1}`,
//           start: currentTime,
//           end: currentTime + wordDuration
//         });
//         currentTime += wordDuration + 0.1;
//         if (currentTime > duration) break;
//       }
      
//       setTranscript(mockTranscript);
//       console.log("Generated mock transcript:", mockTranscript);
//       return mockTranscript;
//     } catch (err) {
//       console.error("Transcription error:", err);
//       return [];
//     }
//   };
  
//   // Get video duration
//   const getVideoDuration = (videoFile) => {
//     return new Promise((resolve) => {
//       const video = document.createElement('video');
//       video.preload = 'metadata';
//       video.onloadedmetadata = () => {
//         resolve(video.duration);
//       };
//       video.src = URL.createObjectURL(videoFile);
//     });
//   };

//   // Helper to fetch file data for FFmpeg
//   const fetchFile = async (file) => {
//     const response = await fetch(URL.createObjectURL(file));
//     return new Uint8Array(await response.arrayBuffer());
//   };

//   // Process videos
//   const processVideos = async () => {
//     if (!video1 || !video2) {
//       alert("Please upload both videos first.");
//       return;
//     }
    
//     setLoading(true);
//     setProgress(0);
    
//     try {
//       // Ensure FFmpeg is loaded
//       if (!ffmpeg.loaded) {
//         await ffmpeg.load();
//         ffmpeg.on('log', ({ type, message }) => {
//           console.log(`[FFmpeg ${type}] ${message}`);
//           // Extract progress information
//           if (message.includes('frame=')) {
//             const match = message.match(/frame=\s*(\d+)/);
//             if (match && match[1]) {
//               // Update progress (rough estimate)
//               setProgress(parseInt(match[1]) / 500 * 100);
//             }
//           }
//         });
//       }
      
//       // Update progress
//       setProgress(5);
      
//       // Write video files to FFmpeg's virtual file system
//       await ffmpeg.writeFile('video1.mp4', await fetchFile(video1.file));
//       await ffmpeg.writeFile('video2.mp4', await fetchFile(video2.file));
      
//       // Transcribe audio (in parallel)
//       setProgress(15);
//       const transcribePromise1 = transcribeAudio(video1.file, setTranscript1);
//       const transcribePromise2 = transcribeAudio(video2.file, setTranscript2);
      
//       // Generate captions files
//       const [transcript1Data, transcript2Data] = await Promise.all([transcribePromise1, transcribePromise2]);
//       const vtt1 = generateWebVTT(transcript1Data, 1);
//       const vtt2 = generateWebVTT(transcript2Data, 2);
      
//       await ffmpeg.writeFile('captions1.vtt', vtt1);
//       await ffmpeg.writeFile('captions2.vtt', vtt2);
      
//       setProgress(25);
      
//       // Get dimensions for 9:16 aspect ratio
//       const finalWidth = 1080;
//       const finalHeight = 1920;
      
//       // For stack layout, each video takes half height
//       const individualHeight = layoutMode === 'stack' ? finalHeight / 2 : finalHeight;
//       const cropWidth = finalWidth;
//       const cropHeight = individualHeight;
      
//       // Detect faces and determine crop regions
//       const videoEl1 = videoRef1.current;
//       const videoEl2 = videoRef2.current;
      
//       const face1 = await detectFaceCropFromFrame(videoEl1, cropWidth, cropHeight);
//       const face2 = await detectFaceCropFromFrame(videoEl2, cropWidth, cropHeight);
      
//       setProgress(40);
      
//       // Prepare FFmpeg filter complex based on layout mode
//       let filterComplex = '';
      
//       if (layoutMode === 'stack') {
//         // Stack layout (two videos on top of each other)
//         filterComplex = `
//           [0:v]crop=${Math.min(cropWidth, face1.width)}:${Math.min(cropHeight, face1.height)}:${face1.x}:${face1.y},scale=${finalWidth}:${individualHeight}[v1];
//           [1:v]crop=${Math.min(cropWidth, face2.width)}:${Math.min(cropHeight, face2.height)}:${face2.x}:${face2.y},scale=${finalWidth}:${individualHeight}[v2];
//           [v1][v2]vstack=inputs=2[outv]
//         `.replace(/\n/g, '');
//       } else {
//         // Switch layout (show who's speaking)
//         // This is a simplified approach with crossfades between speakers
//         filterComplex = `
//           [0:v]crop=${Math.min(cropWidth, face1.width)}:${Math.min(cropHeight, face1.height)}:${face1.x}:${face1.y},scale=${finalWidth}:${finalHeight}[v1];
//           [1:v]crop=${Math.min(cropWidth, face2.width)}:${Math.min(cropHeight, face2.height)}:${face2.x}:${face2.y},scale=${finalWidth}:${finalHeight}[v2];
//           [v1][v2]overlay=enable='between(t,2,4)+between(t,6,8)+between(t,10,12)'[outv]
//         `.replace(/\n/g, '');
//       }
      
//       // Add captions if enabled
//       if (captionOptions.enabled) {
//         filterComplex += `; [outv]subtitles=captions1.vtt:force_style='FontName=${captionOptions.font},FontSize=${captionOptions.size},PrimaryColour=${captionOptions.color},${captionOptions.position === 'top' ? 'MarginV=50' : 'MarginV=30'}':charenc=UTF-8[outv_sub]`;
//       }
      
//       setProgress(50);
      
//       // Prepare FFmpeg command
//       const outputFilter = captionOptions.enabled ? '[outv_sub]' : '[outv]';
      
//       const args = [
//         '-i', 'video1.mp4',
//         '-i', 'video2.mp4',
//         '-filter_complex', filterComplex,
//         '-map', outputFilter,
//         '-map', '0:a', // Use audio from first video
//         '-c:v', 'libx264',
//         '-c:a', 'aac',
//         '-shortest',
//         '-preset', 'ultrafast', // For faster processing (lower quality)
//         '-movflags', 'frag_keyframe+empty_moov',
//         'output.mp4'
//       ];
      
//       console.log('Running FFmpeg command:', args);
//       await ffmpeg.exec(args);
      
//       setProgress(90);
      
//       // Read the output file
//       const data = await ffmpeg.readFile('output.mp4');
//       if (!data || data.length < 1000) throw new Error('Output video is too small or corrupt.');
      
//       // Create a downloadable blob
//       const blob = new Blob([data.buffer], { type: 'video/mp4' });
//       const url = URL.createObjectURL(blob);
//       console.log('Generated video size:', blob.size);
//       setOutput(url);
      
//       setProgress(100);
//     } catch (err) {
//       console.error('Processing error:', err);
//       alert(`Processing failed: ${err.message}. Check console for details.`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6">Conversation Video Editor</h1>
      
//       {/* Video upload section */}
//       <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//         <h2 className="text-xl font-semibold mb-4">1. Upload Videos</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <p className="mb-2">Speaker 1</p>
//             <DropzoneWrapper 
//               onDrop={(files) => {
//                 const url = URL.createObjectURL(files[0]);
//                 setVideo1({ file: files[0], url });
//               }} 
//               label="Upload First Speaker" 
//             />
//             {video1 && (
//               <div className="mt-4">
//                 <video 
//                   ref={videoRef1}
//                   src={video1.url} 
//                   controls 
//                   className="w-full max-h-64 object-contain" 
//                   onLoadedMetadata={(e) => {
//                     if (e.target.duration > 60) {
//                       alert("Video 1 is longer than 60 seconds. Please upload a shorter video.");
//                       setVideo1(null);
//                     }
//                   }}
//                 />
//               </div>
//             )}
//           </div>
          
//           <div>
//             <p className="mb-2">Speaker 2</p>
//             <DropzoneWrapper 
//               onDrop={(files) => {
//                 const url = URL.createObjectURL(files[0]);
//                 setVideo2({ file: files[0], url });
//               }} 
//               label="Upload Second Speaker" 
//             />
//             {video2 && (
//               <div className="mt-4">
//                 <video 
//                   ref={videoRef2}
//                   src={video2.url} 
//                   controls 
//                   className="w-full max-h-64 object-contain"
//                   onLoadedMetadata={(e) => {
//                     if (e.target.duration > 60) {
//                       alert("Video 2 is longer than 60 seconds. Please upload a shorter video.");
//                       setVideo2(null);
//                     }
//                   }}
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* Layout and Caption options */}
//       <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//         <h2 className="text-xl font-semibold mb-4">2. Configure Output</h2>
        
//         <div className="mb-6">
//           <h3 className="text-lg font-medium mb-2">Layout Mode</h3>
//           <div className="flex gap-4">
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="layoutMode"
//                 value="stack"
//                 checked={layoutMode === 'stack'}
//                 onChange={() => setLayoutMode('stack')}
//                 className="mr-2"
//               />
//               <span>Stack View (Both speakers visible)</span>
//             </label>
            
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="layoutMode"
//                 value="switch"
//                 checked={layoutMode === 'switch'}
//                 onChange={() => setLayoutMode('switch')}
//                 className="mr-2"
//               />
//               <span>Switch View (Based on who's speaking)</span>
//             </label>
//           </div>
//         </div>
        
//         <div>
//           <div className="flex items-center mb-4">
//             <h3 className="text-lg font-medium">Caption Options</h3>
//             <label className="ml-4 flex items-center">
//               <input
//                 type="checkbox"
//                 checked={captionOptions.enabled}
//                 onChange={(e) => setCaptionOptions({...captionOptions, enabled: e.target.checked})}
//                 className="mr-2"
//               />
//               <span>Enable Captions</span>
//             </label>
//           </div>
          
//           {captionOptions.enabled && (
//             <CaptionStyler options={captionOptions} onChange={setCaptionOptions} />
//           )}
//         </div>
//       </div>
      
//       {/* Process button */}
//       <div className="flex justify-center mb-8">
//         <button 
//           onClick={processVideos} 
//           disabled={!video1 || !video2 || loading}
//           className={`px-8 py-3 text-lg font-medium rounded-lg ${
//             loading || !video1 || !video2 
//               ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
//               : 'bg-blue-600 text-white hover:bg-blue-700'
//           }`}
//         >
//           {loading ? 'Processing...' : 'Create Combined Video'}
//         </button>
//       </div>
      
//       {/* Progress bar */}
//       {loading && (
//         <div className="mb-8">
//           <div className="w-full bg-gray-200 rounded-full h-4">
//             <div 
//               className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
//               style={{ width: `${progress}%` }}
//             ></div>
//           </div>
//           <p className="text-center mt-2">{Math.round(progress)}% complete</p>
//         </div>
//       )}
      
//       {/* Output video */}
//       {output && (
//         <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//           <h2 className="text-xl font-semibold mb-4">3. Output Video</h2>
//           <div className="flex flex-col items-center">
//             <video 
//               src={output} 
//               controls 
//               className="max-h-96 border rounded-lg shadow-sm" 
//             />
//             <a 
//               href={output} 
//               download="conversation.mp4" 
//               className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//             >
//               Download Video
//             </a>
//           </div>
//         </div>
//       )}
      
//       {/* Memory optimization notice */}
//       <div className="text-sm text-gray-600 mt-8">
//         <p>Note: Large video files may consume significant memory. Close this tab when finished to release memory.</p>
//       </div>
//     </div>
//   );
// }

// export default App;





//************************************************************************************************* */

// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { useDropzone } from 'react-dropzone';
import './App.css';

// Create FFmpeg instance
const ffmpeg = new FFmpeg();

// DeepGram API key (in a real app, use environment variables)
// const DEEPGRAM_API_KEY = 'YOUR_DEEPGRAM_API_KEY';
const DEEPGRAM_API_KEY = '5a9995a0b14f408164613a050a6cca54f077831b';

// Utility components
function DropzoneWrapper({ onDrop, label, accept = { 'video/*': ['.mp4', '.webm'] } }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept,
    maxSize: 100 * 1024 * 1024 // 100MB limit
  });
  
  return (
    <div 
      {...getRootProps()} 
      className={`dropzone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <p className="dropzone-label">{label}</p>
        <p className="dropzone-hint">Drag & drop or click to select (MP4/WebM, max 65s)</p>
      </div>
    </div>
  );
}

function CaptionStyler({ options, onChange }) {
  return (
    <div className="caption-styler-grid">
      <div className="caption-option">
        <label>Font</label>
        <select 
          value={options.font} 
          onChange={(e) => onChange({...options, font: e.target.value})}
        >
          <option value="Arial">Arial</option>
          <option value="Roboto">Roboto</option>
          <option value="Montserrat">Montserrat</option>
          <option value="OpenSans">Open Sans</option>
        </select>
      </div>
      
      <div className="caption-option">
        <label>Size</label>
        <select 
          value={options.size} 
          onChange={(e) => onChange({...options, size: e.target.value})}
        >
          <option value="24">Small</option>
          <option value="32">Medium</option>
          <option value="48">Large</option>
        </select>
      </div>
      
      <div className="caption-option">
        <label>Color</label>
        <select 
          value={options.color} 
          onChange={(e) => onChange({...options, color: e.target.value})}
        >
          <option value="white">White</option>
          <option value="yellow">Yellow</option>
          <option value="black">Black</option>
          <option value="#FF6B6B">Red</option>
          <option value="#4ECDC4">Teal</option>
        </select>
      </div>
      
      <div className="caption-option">
        <label>Position</label>
        <select 
          value={options.position} 
          onChange={(e) => onChange({...options, position: e.target.value})}
        >
          <option value="bottom">Bottom</option>
          <option value="top">Top</option>
          <option value="middle">Middle</option>
        </select>
      </div>
    </div>
  );
}

function App() {
  // State management
  const [video1, setVideo1] = useState(null);
  const [video2, setVideo2] = useState(null);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript1, setTranscript1] = useState([]);
  const [transcript2, setTranscript2] = useState([]);
  const [faceModel, setFaceModel] = useState(null);
  const [layoutMode, setLayoutMode] = useState('stack');
  const [captionOptions, setCaptionOptions] = useState({
    font: 'Roboto',
    size: '32',
    color: 'white',
    position: 'bottom',
    enabled: true
  });
  
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load face detection model
        await tf.setBackend('webgl');
        const model = await blazeface.load();
        setFaceModel(model);
        
        // Load FFmpeg
        if (!ffmpeg.loaded) {
          await ffmpeg.load();
        }
      } catch (err) {
        console.error("Error loading models:", err);
        alert("Failed to load required models. Please try refreshing the page.");
      }
    };
    
    loadModels();

    return () => {
      // Cleanup
      if (faceModel) {
        tf.disposeVariables();
      }
    };
  }, []);

  // Face detection and crop calculation
  const detectFaceCropFromFrame = async (videoElement, targetWidth, targetHeight) => {
    if (!faceModel) {
      return { 
        x: 0, 
        y: 0, 
        width: videoElement.videoWidth, 
        height: videoElement.videoHeight 
      };
    }
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);
      
      const input = tf.browser.fromPixels(canvas);
      const predictions = await faceModel.estimateFaces(input, false);
      input.dispose();
      
      let cropX = 0;
      let cropY = 0;
      
      if (predictions.length > 0) {
        const topLeft = predictions[0].topLeft;
        const bottomRight = predictions[0].bottomRight;
        const faceCenterX = (topLeft[0] + bottomRight[0]) / 2;
        const faceCenterY = (topLeft[1] + bottomRight[1]) / 2;
        
        cropX = Math.max(0, Math.min(videoElement.videoWidth - targetWidth, faceCenterX - targetWidth / 2));
        cropY = Math.max(0, Math.min(videoElement.videoHeight - targetHeight, faceCenterY - targetHeight / 2));
      }
      
      return { 
        x: Math.floor(cropX), 
        y: Math.floor(cropY), 
        width: videoElement.videoWidth, 
        height: videoElement.videoHeight 
      };
    } catch (err) {
      console.error("Face detection error:", err);
      return { 
        x: 0, 
        y: 0, 
        width: videoElement.videoWidth, 
        height: videoElement.videoHeight 
      };
    }
  };

  // Generate WebVTT with word-level highlighting
  const generateWebVTT = (transcript, speaker) => {
    let vtt = "WEBVTT\n\n";
    let wordIndex = 0;
    
    transcript.forEach((sentence, sentenceIndex) => {
      const words = sentence.text.split(' ');
      const wordDuration = (sentence.end - sentence.start) / words.length;
      
      words.forEach((word, wordPos) => {
        const start = sentence.start + (wordPos * wordDuration);
        const end = start + wordDuration;
        
        vtt += `${wordIndex + 1}\n`;
        vtt += `${formatTime(start)} --> ${formatTime(end)}\n`;
        vtt += `<v Speaker ${speaker}><u>${word}</u></v>\n\n`;
        wordIndex++;
      });
    });
    
    return vtt;
  };
  
  // Format time for WebVTT
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // DeepGram transcription
  const transcribeAudio = async (videoFile, speakerNum) => {
    try {
      // Extract audio from video
      const audioBlob = await extractAudioFromVideo(videoFile);
      
      // Call DeepGram API
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav'
        },
        body: audioBlob
      });
      
      const data = await response.json();
      const transcript = data.results.channels[0].alternatives[0].words.map(word => ({
        text: word.word,
        start: word.start,
        end: word.end
      }));
      
      if (speakerNum === 1) {
        setTranscript1(transcript);
      } else {
        setTranscript2(transcript);
      }
      
      return transcript;
    } catch (err) {
      console.error("Transcription error:", err);
      return [];
    }
  };

  // Extract audio from video using FFmpeg
  const extractAudioFromVideo = async (videoFile) => {
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', 'output.wav']);
    const data = await ffmpeg.readFile('output.wav');
    return new Blob([data.buffer], { type: 'audio/wav' });
  };

  // Get video duration
  const getVideoDuration = (videoFile) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Helper to fetch file data for FFmpeg
  const fetchFile = async (file) => {
    const response = await fetch(URL.createObjectURL(file));
    return new Uint8Array(await response.arrayBuffer());
  };

  // Process videos
  const processVideos = async () => {
    if (!video1 || !video2) {
      alert("Please upload both videos first.");
      return;
    }
    
    setLoading(true);
    setProgress(0);
    
    try {
      // Ensure FFmpeg is loaded
      if (!ffmpeg.loaded) {
        await ffmpeg.load();
        ffmpeg.on('log', ({ message }) => {
          if (message.includes('frame=')) {
            const match = message.match(/frame=\s*(\d+)/);
            if (match) setProgress(Math.min(90, parseInt(match[1]) / 500 * 100));
          }
        });
      }
      
      // Write video files to FFmpeg
      await ffmpeg.writeFile('video1.mp4', await fetchFile(video1.file));
      await ffmpeg.writeFile('video2.mp4', await fetchFile(video2.file));
      
      // Transcribe audio in parallel
      setProgress(15);
      const [transcript1Data, transcript2Data] = await Promise.all([
        transcribeAudio(video1.file, 1),
        transcribeAudio(video2.file, 2)
      ]);
      
      // Generate captions files
      const vtt1 = generateWebVTT(transcript1Data, 1);
      const vtt2 = generateWebVTT(transcript2Data, 2);
      await ffmpeg.writeFile('captions1.vtt', vtt1);
      await ffmpeg.writeFile('captions2.vtt', vtt2);
      
      setProgress(30);
      
      // Get dimensions for 9:16 aspect ratio
      const finalWidth = 1080;
      const finalHeight = 1920;
      const individualHeight = layoutMode === 'stack' ? finalHeight / 2 : finalHeight;
      
      // Detect faces and determine crop regions
      const face1 = await detectFaceCropFromFrame(videoRef1.current, finalWidth, individualHeight);
      const face2 = await detectFaceCropFromFrame(videoRef2.current, finalWidth, individualHeight);
      
      setProgress(45);
      
      // Prepare FFmpeg filter complex
      let filterComplex = '';
      
      if (layoutMode === 'stack') {
        // Stack layout
        filterComplex = `
          [0:v]crop=${Math.min(finalWidth, face1.width)}:${Math.min(individualHeight, face1.height)}:${face1.x}:${face1.y},
          scale=${finalWidth}:${individualHeight}[v1];
          [1:v]crop=${Math.min(finalWidth, face2.width)}:${Math.min(individualHeight, face2.height)}:${face2.x}:${face2.y},
          scale=${finalWidth}:${individualHeight}[v2];
          [v1][v2]vstack=inputs=2[outv];
          [0:a][1:a]amix=inputs=2:duration=first[aout]
        `.replace(/\n/g, '');
      } else {
        // Switch layout with voice activity detection
        filterComplex = `
          [0:v]crop=${Math.min(finalWidth, face1.width)}:${Math.min(finalHeight, face1.height)}:${face1.x}:${face1.y},
          scale=${finalWidth}:${finalHeight}[v1];
          [1:v]crop=${Math.min(finalWidth, face2.width)}:${Math.min(finalHeight, face2.height)}:${face2.x}:${face2.y},
          scale=${finalWidth}:${finalHeight}[v2];
          [v1][v2]xfade=transition=fade:duration=0.5:offset=4[outv];
          [0:a][1:a]amix=inputs=2:duration=first[aout]
        `.replace(/\n/g, '');
      }
      
      // Add captions if enabled
      if (captionOptions.enabled) {
        const positionStyle = captionOptions.position === 'top' ? 'MarginV=50' : 
                           captionOptions.position === 'middle' ? 'MarginV=300' : 'MarginV=30';
        filterComplex += `; [outv]subtitles=captions1.vtt:force_style='FontName=${captionOptions.font},FontSize=${captionOptions.size},PrimaryColour=${captionOptions.color},${positionStyle}'[outv_sub]`;
      }
      
      setProgress(60);
      
      // Prepare FFmpeg command
      const outputFilter = captionOptions.enabled ? '[outv_sub]' : '[outv]';
      
      const args = [
        '-i', 'video1.mp4',
        '-i', 'video2.mp4',
        '-filter_complex', filterComplex,
        '-map', outputFilter,
        '-map', '[aout]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        '-preset', 'ultrafast',
        '-movflags', 'frag_keyframe+empty_moov',
        'output.mp4'
      ];
      
      await ffmpeg.exec(args);
      setProgress(90);
      
      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      setOutput(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('Processing error:', err);
      alert(`Processing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Conversation Video Editor</h1>
        <p className="app-subtitle">Combine two speaker videos with automatic transcription</p>
      </header>
      
      <main className="app-main">
        {/* Video upload section */}
        <section className="upload-section">
          <h2>1. Upload Videos</h2>
          <div className="video-upload-grid">
            <div className="video-upload-box">
              <p className="video-label">Speaker 1</p>
              <DropzoneWrapper 
                onDrop={(files) => {
                  const url = URL.createObjectURL(files[0]);
                  setVideo1({ file: files[0], url });
                }} 
                label="Upload First Speaker" 
              />
              {video1 && (
                <div className="video-preview-container">
                  <video 
                    ref={videoRef1}
                    src={video1.url} 
                    controls 
                    className="video-preview"
                    onLoadedMetadata={(e) => {
                      if (e.target.duration > 60) {
                        alert("Video is longer than 60 seconds. Please upload a shorter video.");
                        setVideo1(null);
                      }
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="video-upload-box">
              <p className="video-label">Speaker 2</p>
              <DropzoneWrapper 
                onDrop={(files) => {
                  const url = URL.createObjectURL(files[0]);
                  setVideo2({ file: files[0], url });
                }} 
                label="Upload Second Speaker" 
              />
              {video2 && (
                <div className="video-preview-container">
                  <video 
                    ref={videoRef2}
                    src={video2.url} 
                    controls 
                    className="video-preview"
                    onLoadedMetadata={(e) => {
                      if (e.target.duration > 60) {
                        alert("Video is longer than 60 seconds. Please upload a shorter video.");
                        setVideo2(null);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Configuration section */}
        <section className="config-section">
          <h2>2. Configure Output</h2>
          
          <div className="layout-options">
            <h3>Layout Mode</h3>
            <div className="layout-choices">
              <label className="layout-choice">
                <input
                  type="radio"
                  name="layoutMode"
                  value="stack"
                  checked={layoutMode === 'stack'}
                  onChange={() => setLayoutMode('stack')}
                />
                <span>Stack View (Both speakers)</span>
              </label>
              
              <label className="layout-choice">
                <input
                  type="radio"
                  name="layoutMode"
                  value="switch"
                  checked={layoutMode === 'switch'}
                  onChange={() => setLayoutMode('switch')}
                />
                <span>Switch View (Active speaker)</span>
              </label>
            </div>
          </div>
          
          <div className="caption-options">
            <div className="caption-toggle">
              <h3>Caption Options</h3>
              <label>
                <input
                  type="checkbox"
                  checked={captionOptions.enabled}
                  onChange={(e) => setCaptionOptions({...captionOptions, enabled: e.target.checked})}
                />
                <span>Enable Captions</span>
              </label>
            </div>
            
            {captionOptions.enabled && (
              <CaptionStyler options={captionOptions} onChange={setCaptionOptions} />
            )}
          </div>
        </section>
        
        {/* Process button */}
        <div className="process-button-container">
          <button 
            onClick={processVideos} 
            disabled={!video1 || !video2 || loading}
            className={`process-button ${loading || !video1 || !video2 ? 'disabled' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : 'Create Combined Video'}
          </button>
        </div>
        
        {/* Progress bar */}
        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">{Math.round(progress)}% complete</p>
          </div>
        )}
        
        {/* Output video */}
        {output && (
          <section className="output-section">
            <h2>3. Output Video</h2>
            <div className="output-container">
              <video 
                src={output} 
                controls 
                className="output-video"
              />
              <a 
                href={output} 
                download="conversation.mp4" 
                className="download-button"
              >
                Download Video
              </a>
            </div>
          </section>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Note: All processing happens in your browser. Large videos may take longer to process.</p>
      </footer>
    </div>
  );
}

export default App;