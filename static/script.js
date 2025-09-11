const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const cameraBtn = document.getElementById('cameraBtn');

const cameraModal = document.getElementById('cameraModal');
const videoPreview = document.getElementById('videoPreview');
const snapBtn = document.getElementById('snapBtn');
const sendCaptureBtn = document.getElementById('sendCaptureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');

let capturedBlob = null;
let stream = null;

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = sender === "You" ? "user-msg" : "assistant-msg";
    div.textContent = text;
    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    const files = fileInput.files;

    if (!message && files.length === 0) return;

    if (message) appendMessage("You", message);
    if (files.length > 0) appendMessage("You", `[📎 ${files.length} file(s) attached]`);

    const formData = new FormData();
    if (message) formData.append("message", message);
    for (let i = 0; i < files.length; i++) formData.append("files", files[i]);

    userInput.value = "";
    fileInput.value = "";

    const response = await fetch("/chat", { method: "POST", body: formData });
    const data = await response.json();
    appendMessage("Assistant", data.reply);
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', event => { if (event.key === "Enter") sendMessage(); });

// Open camera modal
cameraBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoPreview.srcObject = stream;
        cameraModal.style.display = "flex";
    } catch (err) {
        alert("Cannot access camera: " + err);
    }
});

// Capture photo
snapBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoPreview.videoWidth;
    canvas.height = videoPreview.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => { capturedBlob = blob; }, 'image/png');
    alert("Image captured! Click Send to send it to chatbot.");
});

// Send captured image
sendCaptureBtn.addEventListener('click', async () => {
    if (!capturedBlob) return alert("Capture an image first!");
    const formData = new FormData();
    formData.append("message", userInput.value || "Captured Image");
    const timestamp = new Date().getTime();
    formData.append("files", capturedBlob, `captured_${timestamp}.png`);

    userInput.value = "";
    capturedBlob = null;

    const response = await fetch("/chat", { method: "POST", body: formData });
    const data = await response.json();
    appendMessage("You", "[📸 Image Captured]");
    appendMessage("Assistant", data.reply);

    cameraModal.style.display = "none";
    if (stream) stream.getTracks().forEach(track => track.stop());
});

// Close camera modal
closeCameraBtn.addEventListener('click', () => {
    cameraModal.style.display = "none";
    if (stream) stream.getTracks().forEach(track => track.stop());
});
