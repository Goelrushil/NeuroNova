/* --------------------------------------------------------------
   Global Toast Notification
-------------------------------------------------------------- */
function toast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.padding = "12px 16px";
  t.style.background = "rgba(0,0,0,0.75)";
  t.style.color = "white";
  t.style.borderRadius = "8px";
  t.style.fontSize = "0.9rem";
  t.style.zIndex = "9999";
  t.style.transform = "translateY(20px)";
  t.style.opacity = "0";
  t.style.transition = "all .35s ease";
  document.body.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(20px)";
    setTimeout(() => t.remove(), 300);
  }, 2000);
}

/* --------------------------------------------------------------
   API Base URL
-------------------------------------------------------------- */
const API = (location.hostname === "localhost")
  ? "http://localhost:5000"
  : "";

/* --------------------------------------------------------------
   Chatbot Function (WORKING)
-------------------------------------------------------------- */
async function sendToChatbot() {
  const input = document.getElementById("msg");
  const replyBox = document.getElementById("reply");
  const text = input.value.trim();

  if (!text) {
    toast("Please type something");
    return;
  }

  replyBox.innerHTML = `<em style="color:#777;">Thinking...</em>`;

  try {
    const res = await fetch(API + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      replyBox.innerHTML = data.reply.replace(/\n/g, "<br>");
    } else {
      replyBox.innerHTML = "⚠️ Error getting response.";
    }
  } catch (err) {
    console.error("Chat error:", err);
    replyBox.innerHTML = "⚠️ Could not reach server.";
  }

  input.value = "";
}

/* --------------------------------------------------------------
   Webcam + Emotion Detection (FINAL)
-------------------------------------------------------------- */

let videoStream;
let detectionInterval;
let faceapiLoaded = false;
const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

async function loadFaceApi(){
  try{
    // load scripts dynamically
    if(!window.faceapi){
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    // load models
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    faceapiLoaded = true;
    toast('Emotion models loaded');
  }catch(e){
    console.error('face-api load failed', e);
    toast('Could not load emotion models — continuing without live detection');
    faceapiLoaded = false;
  }
}

async function startWebcam(){
  const video = document.getElementById('webcamVideo');
  try{
    videoStream = await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}, audio:false});
    video.srcObject = videoStream;
    await video.play();
    document.getElementById('startBtn').disabled = true;
    // try load face-api models in background
    loadFaceApi();
    // start detection loop if models load
    detectionInterval = setInterval(async ()=>{
      if(!faceapiLoaded) return;
      try{
        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        if(detections && detections.expressions){
          const exp = detections.expressions;
          // pick highest expression
          let max = {k:null,v:0};
          Object.keys(exp).forEach(k => { if(exp[k] > max.v){ max = {k, v: exp[k]} }});
          if(max.k){
            document.getElementById('detectedMood').innerText = max.k + ' (' + (max.v*100).toFixed(0) + '%)';
            // optionally auto-send snapshot with estimated mood if confidence high
            if(max.v > 0.7){
              // take a quick snapshot but do not spam: only when confidence > 0.85 we'll auto send
            }
          }
        }
      }catch(e){ console.error('detection error', e) }
    }, 800);
  }catch(e){
    console.error(e); toast('Cannot access camera — allow permissions');
  }
}

function stopWebcam(){
  if(videoStream){ videoStream.getTracks().forEach(t => t.stop()); videoStream = null; document.getElementById('startBtn').disabled = false; }
  if(detectionInterval){ clearInterval(detectionInterval); detectionInterval = null; }
}

// take snapshot and upload with estimated mood (reads detectedMood)
async function takeSnapshotAndSend(){
  const video = document.getElementById('webcamVideo');
  if(!video || !video.srcObject) return toast('Start webcam first');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85));
  const form = new FormData();
  const moodText = document.getElementById('detectedMood').innerText || 'unlabeled';
  form.append('snapshot', blob, 'snap.jpg');
  form.append('estimatedMood', moodText);
  try{
    const resp = await fetch(API + '/webcam', { method: 'POST', body: form });
    const data = await resp.json();
    toast('Snapshot saved: ' + (data.record?.estimatedMood || ''));
    prependLog(data.record);
  }catch(e){ console.error(e); toast('Upload failed') }
}

function prependLog(record){
  if(!record) return;
  const log = document.getElementById('webcamLog');
  const p = document.createElement('p');
  p.textContent = `• ${new Date(record.timestamp).toLocaleString()} — mood: ${record.estimatedMood} — id:${record.id}`;
  log.prepend(p);
}

// load recent webcam logs from data.json
async function loadRecent(){
  try{
    const res = await fetch(API + '/data.json');
    const db = await res.json();
    (db.webcam || []).slice().reverse().slice(0, 10).forEach(prependLog);
  }catch(e){ console.error('loadRecent failed', e) }
}

// initialize on DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  loadRecent();
});



// Mood Detection Loop
function startMoodDetection(video) {
  detectionInterval = setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (!detection) {
      document.getElementById("detectedMood").innerText = "—";
      return;
    }

    const mood = getTopMood(detection.expressions);
    document.getElementById("detectedMood").innerText = mood;
  }, 800);
}

function getTopMood(expressions) {
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

/* --------------------------------------------------------------
   Save Snapshot with Detected Mood
-------------------------------------------------------------- */
async function takeSnapshotAndSend() {
  const video = document.getElementById("webcamVideo");

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));

  const form = new FormData();
  form.append("snapshot", blob);
  form.append("estimatedMood", document.getElementById("detectedMood")?.innerText || "unknown");
  form.append("notes", "");

  try {
    await fetch(API + "/webcam", {
      method: "POST",
      body: form
    });

    toast("Snapshot saved");
  } catch (err) {
    console.error(err);
    toast("Failed to save snapshot");
  }
}

/* --------------------------------------------------------------
   Mood History Helper (not changed)
-------------------------------------------------------------- */
async function loadMoodHistory() {
  try {
    const res = await fetch(API + "/mood");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}
