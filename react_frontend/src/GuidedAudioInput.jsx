import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Check, Volume2, ArrowRight } from 'lucide-react';
import { API_URL } from './config';

const GuidedAudioInput = ({ onComplete, onCancel, recipeId }) => {
    const [step, setStep] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [slots, setSlots] = useState({
        action: null,
        ingredient: null,
        modifier: null,
    });
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const steps = [
        { key: 'action', label: 'Say the target action (e.g., heat, fry, cut)', prompt: 'What is the action?' },
        { key: 'ingredient', label: 'Say the ingredient (e.g., pan, oil, onion)', prompt: 'What is the ingredient?' },
        { key: 'modifier', label: 'Say any modifier (e.g., medium heat, finely)', prompt: 'Any descriptors or modifiers?' },
    ];

    const currentStep = steps[step];

    const speakPrompt = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        speakPrompt(currentStep.label);
    }, [step]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];
            let supportedType = '';
            for (const type of types) {
                if (MediaRecorder.isTypeSupported(type)) {
                    supportedType = type;
                    break;
                }
            }
            if (!supportedType) throw new Error("No supported format");

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedType });
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: supportedType });
                await processStep(blob, supportedType);
            };
            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
        } catch (err) {
            alert("Mic error: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const processStep = async (blob, mimeType) => {
        setIsProcessing(true);
        const extension = mimeType.includes('webm') ? 'webm' :
            mimeType.includes('ogg') ? 'ogg' :
                mimeType.includes('mp4') ? 'mp4' : 'wav';

        const formData = new FormData();
        formData.append('audio', blob, `step.${extension}`);
        formData.append('recipe_id', recipeId);

        try {
            const res = await fetch(`${API_URL}/api/audio/transcribe`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.text) {
                const cleanedText = data.text.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim();
                setSlots(prev => ({ ...prev, [currentStep.key]: cleanedText }));

                if (step < steps.length - 1) {
                    setStep(step + 1);
                } else {
                    // All slots filled (roughly)
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinish = () => {
        // Construct a sentence from slots and send to backend
        const sentence = `${slots.action} the ${slots.ingredient} ${slots.modifier || ''}`.trim();
        onComplete(sentence);
    };

    return (
        <div className="guided-audio-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
            <div className="guided-box" style={{
                background: 'white', padding: '30px', borderRadius: '20px', maxWidth: '400px', width: '90%', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Voice Assistant</h3>
                    <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <div className="step-indicator" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: i === step ? '#3b82f6' : (i < step ? '#10b981' : '#e2e8f0')
                        }} />
                    ))}
                </div>

                <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>{currentStep.label}</p>

                <div style={{ margin: '30px 0' }}>
                    {!isRecording ? (
                        <button onClick={startRecording} disabled={isProcessing} style={{
                            width: '80px', height: '80px', borderRadius: '50%', background: '#3b82f6', color: 'white',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {isProcessing ? <div className="spinner" /> : <Mic size={40} />}
                        </button>
                    ) : (
                        <button onClick={stopRecording} style={{
                            width: '80px', height: '80px', borderRadius: '50%', background: '#ef4444', color: 'white',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'pulse 1.5s infinite'
                        }}>
                            <Square size={30} />
                        </button>
                    )}
                </div>

                <div style={{ textAlign: 'left', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#64748b' }}>Current Slots:</p>
                    <div style={{ fontSize: '0.9rem' }}>
                        <div><strong>Action:</strong> {slots.action || '...'}</div>
                        <div><strong>Ingredient:</strong> {slots.ingredient || '...'}</div>
                        <div><strong>Modifier:</strong> {slots.modifier || '...'}</div>
                    </div>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => setStep(prev => Math.max(0, prev - 1))} disabled={step === 0} style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white'
                    }}>Back</button>

                    {step === steps.length - 1 && slots.modifier ? (
                        <button onClick={handleFinish} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white'
                        }}>Finish</button>
                    ) : (
                        <button onClick={() => setStep(prev => Math.min(steps.length - 1, prev + 1))} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white'
                        }}>Skip <ArrowRight size={16} style={{ verticalAlign: 'middle' }} /></button>
                    )}
                </div>
            </div>

            <style>{`
                .spinner {
                    width: 30px; height: 30px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white;
                    border-radius: 50%; animation: spin 1s linear infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
};

export default GuidedAudioInput;
