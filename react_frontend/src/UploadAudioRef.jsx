import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, Upload, FileText, Trash2, Copy, Sparkles, Activity, Clock, Play, Maximize2, MoreHorizontal, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadAudio() {
    const { api, user } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [transcription, setTranscription] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [recording, setRecording] = useState(false);

    // Status State with Type
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info'); // 'info', 'success', 'error'

    const [loading, setLoading] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/history');
            setHistory(res.data);
        } catch (e) { console.error("History fetch error", e); }
    };

    const processFile = async (file) => {
        setLoading(true);
        setStatus("Uploading & Processing...");
        setStatusType("info");

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload', formData);
            if (res.data.text && res.data.text.startsWith("Error:")) throw new Error(res.data.text);

            setTranscription(res.data.text);
            setQuestions(res.data.questions || []);
            setStatus("Success! Analysis Complete.");
            setStatusType("success");
            fetchHistory();
        } catch (e) {
            console.error("Upload Error:", e);
            setStatus(e.response?.data?.detail || e.message || "Upload Failed. Check backend console.");
            setStatusType("error");
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Try to use a more widely supported MIME type
            const types = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4',
                'audio/wav'
            ];

            let mimeType = '';
            for (const type of types) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }

            if (!mimeType) {
                throw new Error("No supported audio recording format found in this browser.");
            }

            console.log("Using MIME type:", mimeType);
            const recorder = new MediaRecorder(stream, { mimeType });

            let chunks = [];
            recorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            recorder.onstop = () => {
                try {
                    const blob = new Blob(chunks, { type: mimeType });
                    if (blob.size === 0) throw new Error("Recording failed: Empty audio data.");

                    const extension = mimeType.includes('webm') ? 'webm' :
                        mimeType.includes('ogg') ? 'ogg' :
                            mimeType.includes('mp4') ? 'mp4' : 'wav';

                    processFile(new File([blob], `recording.${extension}`, { type: mimeType }));
                } catch (err) {
                    console.error("Recording blob error:", err);
                    setStatus("Error saving recording: " + err.message);
                    setStatusType("error");
                } finally {
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            recorder.start(1000); // Collect data every second for reliability
            setMediaRecorder(recorder);
            setRecording(true);
            setStatus("Recording Audio...");
            setStatusType("info");
        } catch (e) {
            console.error("Recording error:", e);
            setStatus(e.message || "Microphone access denied or not found.");
            setStatusType("error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setRecording(false);
    };

    return (
        <div className="min-h-screen pt-28 pb-12 px-6 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-pink-200/10 rounded-full blur-[100px] -z-10 animate-pulse-slow delay-100"></div>

            <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[300px_1fr] gap-8">

                {/* --- LEFT COLUMN: HISTORY --- */}
                <div className="space-y-6">
                    <div className="glass-card p-6 h-[calc(100vh-140px)] flex flex-col sticky top-28 bg-white/80">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                                <Clock size={18} className="text-purple-400" /> Recent
                            </h2>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">{history.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-3">
                            {history.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">
                                    <FileText size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-sans">No files yet</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => {
                                            setTranscription(item.text);
                                            // Assume history items might not have questions stored in this version, 
                                            // but we'll try to preserve them if they exist
                                            setQuestions(item.questions || []);
                                        }}
                                        className="p-4 rounded-2xl bg-white/50 border border-gray-100 hover:border-purple-200 hover:shadow-md cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-sm font-bold text-gray-700 truncate w-3/4 group-hover:text-purple-600 transition-colors">{item.filename}</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); /* Delete Logic */ }}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 font-sans">{item.text}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: WORKSPACE --- */}
                <div className="space-y-8">

                    {/* Header Greetings */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900 mb-1 leading-tight">Welcome back, {user?.username}</h1>
                            <p className="text-gray-500 font-sans">Ready to capture some ideas today?</p>
                        </div>

                        {/* Status Alert Pill */}
                        <AnimatePresence>
                            {status && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-sm border backdrop-blur-md ${statusType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        statusType === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-purple-50 text-purple-700 border-purple-200'
                                        }`}
                                >
                                    {statusType === 'success' ? <CheckCircle size={16} /> :
                                        statusType === 'error' ? <AlertCircle size={16} /> :
                                            <Activity size={16} className={loading ? "animate-spin" : ""} />}
                                    {status}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Record Card */}
                        <div className="glass-card p-8 flex flex-col items-center justify-center text-center hover:border-purple-300 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <button
                                onClick={recording ? stopRecording : startRecording}
                                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 relative z-10 ${recording ? 'bg-red-500 shadow-xl shadow-red-500/40 scale-110 animate-pulse' : 'bg-gray-900 shadow-lg group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-pink-600'}`}
                            >
                                <Mic size={32} className="text-white" />
                            </button>
                            <h3 className="text-lg font-display font-bold text-gray-900 mb-1 relative z-10">{recording ? 'Recording...' : 'Record Voice'}</h3>
                            <p className="text-sm text-gray-500 font-sans relative z-10">Click to start capturing</p>
                        </div>

                        {/* Upload Card */}
                        <div
                            className={`glass-card p-8 flex flex-col items-center justify-center text-center border-dashed border-2 cursor-pointer transition-all duration-300 ${dragActive ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200 hover:border-purple-300 group'}`}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 text-gray-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all duration-300">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">Upload Audio</h3>
                            <p className="text-sm text-gray-500 font-sans">Drag & drop or click to browse</p>
                            <input ref={fileInputRef} type="file" className="hidden" accept="audio/*" onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} />
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="glass-card min-h-[400px] flex flex-col relative overflow-hidden backdrop-blur-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 text-purple-600"><Sparkles size={18} /></div>
                                <span className="font-display font-bold text-gray-900">Transcription Result</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => navigator.clipboard.writeText(transcription)} disabled={!transcription} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"><Copy size={18} /></button>
                                <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"><Maximize2 size={18} /></button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 bg-white/10">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-pulse">
                                    <Activity size={48} className="mb-4 text-purple-400" />
                                    <p className="font-display font-semibold">Processing audio intelligence...</p>
                                </div>
                            ) : transcription ? (
                                <div className="prose prose-purple max-w-none">
                                    <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{transcription}</p>

                                    {questions.length > 0 && (
                                        <div className="mt-8 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100">
                                            <h4 className="text-purple-900 font-display font-bold mb-4 flex items-center gap-2"><Sparkles size={16} className="text-purple-500" /> Suggested Actions</h4>
                                            <ul className="space-y-2">
                                                {questions.map((q, i) => (
                                                    <li key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-white/40 border border-purple-100">
                                                        <div className="flex gap-2 text-purple-900 font-sans font-bold">
                                                            <span className="text-purple-400">Q{i + 1}:</span> {q.question || q}
                                                        </div>
                                                        {q && q.options && (
                                                            <div className="text-xs font-bold text-emerald-600 ml-7">
                                                                Answer: {q.options[q.answer]}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-8 flex justify-center">
                                                <button
                                                    onClick={() => navigate('/quiz', { state: { questions } })}
                                                    className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold flex items-center gap-2 hover:bg-purple-600 hover:scale-105 transition-all shadow-xl shadow-purple-500/20 group"
                                                >
                                                    <Award size={20} className="group-hover:rotate-12 transition-transform" />
                                                    Go to Quiz
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                    <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 transform rotate-12 shadow-inner">
                                        <FileText size={40} className="text-gray-200" />
                                    </div>
                                    <p className="text-xl font-display font-bold text-gray-400">No content generated yet</p>
                                    <p className="text-sm text-gray-400 mt-1 font-sans">Upload or record audio to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
