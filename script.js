const toggleBtn = document.getElementById("chatToggle");
const chatContainer = document.getElementById("chatContainer");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("chatInput");
const messages = document.getElementById("chatMessages");
const themeToggle = document.getElementById("themeToggle");
const micBtn = document.getElementById("micBtn");
const uploadBtn = document.getElementById("uploadBtn");
const fileUpload = document.getElementById("fileUpload");

toggleBtn.addEventListener("click", toggleChat);
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if(e.key === "Enter") sendMessage();
});

function toggleChat(){
  chatContainer.classList.toggle("active");
}

function addMessage(text, sender){
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function sendMessage(){
  const text = input.value.trim();
  if(!text) return;
  addMessage(text,"user");
  input.value="";
  fetch("http://localhost:5000/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: text })
})
.then(res => res.json())
.then(data => {
  addMessage(data.reply, "bot");
})
.catch(() => {
  addMessage("Server error. Try again.", "bot");
});
}

/* Dark Mode */
themeToggle.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
});

/* Voice Input */
let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";

  micBtn.addEventListener("click",()=>{
    micBtn.classList.add("recording");
    recognition.start();
  });

  recognition.onresult = (event)=>{
    input.value = event.results[0][0].transcript;
  };

  recognition.onend = ()=>{
    micBtn.classList.remove("recording");
  };
}

/* File Upload */
uploadBtn.addEventListener("click",()=>{
  fileUpload.click();
});

fileUpload.addEventListener("change",(e)=>{
  const file = e.target.files[0];
  if(file){
    addMessage("📎 Uploaded: " + file.name,"user");
  }
});
