import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { API_URL } from './config';

const AudioInput = ({ onTranscriptionSuccess, recipeId, mode = "sentence" }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Auto-detect best supported MIME type
            const types = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4',
                'audio/wav'
            ];
            let supportedType = '';
            for (const type of types) {
                if (MediaRecorder.isTypeSupported(type)) {
                    supportedType = type;
                    break;
                }
            }

            if (!supportedType) {
                throw new Error("No supported recording format found.");
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedType });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: supportedType });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                await sendAudioToBackend(blob, supportedType);
            };

            mediaRecorderRef.current.start(1000); // Collect data every 1s for reliability
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Error: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks to release the microphone
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const sendAudioToBackend = async (blob, mimeType) => {
        setIsProcessing(true);
        const extension = mimeType.includes('webm') ? 'webm' :
            mimeType.includes('ogg') ? 'ogg' :
                mimeType.includes('mp4') ? 'mp4' : 'wav';

        const formData = new FormData();
        formData.append('audio', blob, `recording.${extension}`);
        formData.append('recipe_id', recipeId);

        try {
            const response = await fetch(`${API_URL}/api/audio/transcribe`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Transcription failed");
            }

            const data = await response.json();
            if (data.text) {
                onTranscriptionSuccess(data.text, data);
            }
        } catch (err) {
            console.error("Transcription error:", err);
            alert("Error: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="audio-input-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="audio-btn record"
                    disabled={isProcessing}
                    title="Record Audio"
                    style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                </button>
            ) : (
                <button
                    onClick={stopRecording}
                    className="audio-btn stop"
                    title="Stop Recording"
                    style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                        animation: 'pulse 1.5s infinite'
                    }}
                >
                    <Square size={20} />
                </button>
            )}

            {isRecording && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', animation: 'blink 1s infinite' }}>
                    Recording...
                </span>
            )}
            {isProcessing && (
                <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                    Processing speech...
                </span>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
                    100% { transform: scale(1); }
                }
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AudioInput;
