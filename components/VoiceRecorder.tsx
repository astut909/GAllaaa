
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';

interface VoiceRecorderProps {
  onProcessing: (status: boolean) => void;
  onResult: (result: any) => void;
  processAudio: (base64: string) => Promise<any>;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onProcessing, onResult, processAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Setup Visualizer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsProcessing(true);
          onProcessing(true);
          const result = await processAudio(base64Audio);
          onResult(result);
          setIsProcessing(false);
          onProcessing(false);
        };
        
        // Clean up visualizer
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isRecording && (
        <div className="flex gap-1 h-12 items-center">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-indigo-500 rounded-full transition-all duration-75"
              style={{ 
                height: `${Math.max(4, audioLevel * (0.5 + Math.random()))}%`,
                opacity: 0.5 + (audioLevel / 255)
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative group flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 transform active:scale-95 shadow-xl ${
          isRecording 
          ? 'bg-red-500 hover:bg-red-600' 
          : 'bg-indigo-600 hover:bg-indigo-700'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-8 h-8 text-white fill-current" />
        ) : (
          <>
            <Mic className="w-8 h-8 text-white" />
            <div className="absolute -inset-1 bg-indigo-400 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
          </>
        )}
      </button>

      <p className="text-sm font-medium text-slate-500 animate-pulse">
        {isRecording ? "Listening... Speak clearly" : isProcessing ? "AI is processing..." : "Tap to record transaction"}
      </p>

      {!isRecording && !isProcessing && (
        <div className="bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 text-indigo-700 text-xs border border-indigo-100">
          <Sparkles className="w-3 h-3" />
          <span>Try: "Paid 500 to Ramesh for milk"</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
