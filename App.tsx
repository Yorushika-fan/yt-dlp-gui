import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ServerConsole from './components/TerminalDisplay';
import ConfigPanel from './components/ConfigPanel';
import { DlpOptions, Tab, DownloadStatus, ServerLog, DownloadPayload } from './types';
import { DEFAULT_OPTIONS } from './constants';
import { analyzeCommand } from './services/geminiService';
import { io, Socket } from 'socket.io-client';

// Change this to your actual server URL when deploying
// If hosting frontend and backend on same server/port, use '/'
// If separate, use 'http://your-server-ip:3001'
const BACKEND_URL = 'http://localhost:3001'; 

const App: React.FC = () => {
  const [options, setOptions] = useState<DlpOptions>(DEFAULT_OPTIONS);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.QUICK);
  
  // Download State
  const [status, setStatus] = useState<DownloadStatus>(DownloadStatus.IDLE);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>('');

  // Socket
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    // We use forceNew to ensure a clean state if re-mounting
    const socket = io(BACKEND_URL, {
        autoConnect: false
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
        addLog('已连接到后端服务器', 'success');
    });

    socket.on('connect_error', (err) => {
        addLog(`连接服务器失败: ${err.message}. 请确保后端已启动 (node server/index.js)`, 'error');
        setStatus(DownloadStatus.ERROR);
    });

    socket.on('log', (data: { message: string, type?: ServerLog['type'] }) => {
        addLog(data.message, data.type || 'info');
    });

    socket.on('progress', (percent: number) => {
        setProgress(percent);
        if (percent < 100) {
            setStatus(DownloadStatus.DOWNLOADING);
        } else {
            setStatus(DownloadStatus.PROCESSING);
        }
    });

    socket.on('status', (newStatus: string) => {
        switch(newStatus) {
            case 'preparing': setStatus(DownloadStatus.PREPARING); break;
            case 'downloading': setStatus(DownloadStatus.DOWNLOADING); break;
            case 'completed': setStatus(DownloadStatus.COMPLETED); break;
            case 'error': setStatus(DownloadStatus.ERROR); break;
            default: break;
        }
    });

    socket.on('completed', (data: { filename: string, downloadUrl: string }) => {
        setDownloadLink(`${BACKEND_URL}${data.downloadUrl}`);
        addLog(`文件已就绪: ${data.filename}`, 'success');
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  const addLog = (message: string, type: ServerLog['type'] = 'info') => {
    const newLog: ServerLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleDownload = () => {
    if (status === DownloadStatus.DOWNLOADING || status === DownloadStatus.PREPARING) return;
    if (!options.url) {
        alert("请先输入视频 URL");
        return;
    }
    
    // Reset state
    setLogs([]);
    setProgress(0);
    setDownloadLink(null);
    setStatus(DownloadStatus.PREPARING);

    // Connect and start
    if (socketRef.current) {
        if (!socketRef.current.connected) {
            socketRef.current.connect();
        }
        
        // Give it a moment to connect if it wasn't
        setTimeout(() => {
            socketRef.current?.emit('start-download', {
                url: options.url,
                options: options
            });
        }, 500);
    }
  };
  
  const handleSaveFile = () => {
      if (downloadLink) {
          window.open(downloadLink, '_blank');
      }
  };

  const handleAnalyze = async () => {
    if (!options.url) {
      alert("请先输入视频 URL");
      return;
    }
    setIsAnalyzing(true);
    setAiOutput("正在连接 Gemini 进行分析...");
    
    const pseudoCommand = `yt-dlp ${options.url} ${options.audioOnly ? '-x' : ''} ...`;

    try {
      const result = await analyzeCommand(pseudoCommand, options);
      setAiOutput(result);
    } catch (e) {
      setAiOutput("AI 分析失败。请检查 API Key。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col gap-6">
          
          {/* Hero Input Section */}
          <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
              视频链接 / URL
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={options.url}
                onChange={(e) => setOptions(prev => ({ ...prev, url: e.target.value }))}
                placeholder="在此粘贴视频链接 (YouTube, Bilibili, Twitch...)"
                disabled={status === DownloadStatus.DOWNLOADING}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none shadow-inner"
              />
              <button
                onClick={handleDownload}
                disabled={status === DownloadStatus.DOWNLOADING}
                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 min-w-[160px] ${
                  status === DownloadStatus.DOWNLOADING
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-500/25'
                }`}
              >
                {status === DownloadStatus.DOWNLOADING ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    下载中
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    开始下载
                  </>
                )}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configuration */}
            <div className="lg:col-span-7 space-y-6">
               <ConfigPanel 
                 options={options} 
                 setOptions={setOptions} 
                 activeTab={activeTab}
                 setActiveTab={setActiveTab}
                 isAnalyzing={isAnalyzing}
                 status={status}
                 aiOutput={aiOutput}
                 onAnalyze={handleAnalyze}
               />
            </div>

            {/* Right: Server Console */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm text-slate-400 px-1">
                <span className="font-semibold uppercase tracking-wider">Server Logs</span>
                <span className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${socketRef.current?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <span className="text-xs">{socketRef.current?.connected ? 'Backend Online' : 'Offline'}</span>
                </span>
              </div>
              <ServerConsole 
                logs={logs} 
                status={status} 
                progress={progress}
              />
              
              {status === DownloadStatus.COMPLETED && downloadLink && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-400">下载完成</h4>
                      <p className="text-xs text-green-500/70">文件已保存在服务器临时目录</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveFile}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    保存文件
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;