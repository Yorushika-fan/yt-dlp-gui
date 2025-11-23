import React, { useEffect, useRef } from 'react';
import { ServerLog, DownloadStatus } from '../types';

interface ServerConsoleProps {
  logs: ServerLog[];
  status: DownloadStatus;
  progress: number;
}

const ServerConsole: React.FC<ServerConsoleProps> = ({ logs, status, progress }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusColor = () => {
    switch (status) {
      case DownloadStatus.DOWNLOADING: return 'text-blue-400';
      case DownloadStatus.COMPLETED: return 'text-green-400';
      case DownloadStatus.ERROR: return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case DownloadStatus.IDLE: return '等待任务 (IDLE)';
      case DownloadStatus.PREPARING: return '连接服务器...';
      case DownloadStatus.DOWNLOADING: return `下载中 ${Math.round(progress)}%`;
      case DownloadStatus.PROCESSING: return '处理/转码中...';
      case DownloadStatus.COMPLETED: return '任务完成';
      case DownloadStatus.ERROR: return '发生错误';
    }
  };

  return (
    <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative group flex flex-col h-[300px]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <span>root@yt-dlp-server:~</span>
          </div>
        </div>
        <div className={`text-xs font-mono font-bold ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      
      {/* Progress Bar (Only visible when active) */}
      {(status === DownloadStatus.DOWNLOADING || status === DownloadStatus.PROCESSING) && (
        <div className="h-1 bg-slate-800 w-full shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Log Output area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs md:text-sm overflow-y-auto space-y-1 custom-scrollbar"
      >
        {logs.length === 0 && (
          <div className="text-slate-600 italic opacity-50 select-none">
            // 等待指令输入...
            <br />
            // 请在下方配置参数并点击 "开始下载"
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 hover:bg-white/5 px-1 -mx-1 rounded">
            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
            <span className={`break-all ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'warning' ? 'text-yellow-400' :
              'text-slate-300'
            }`}>
              {log.type === 'info' && <span className="text-blue-500 mr-2">ℹ</span>}
              {log.message}
            </span>
          </div>
        ))}
        
        {status === DownloadStatus.DOWNLOADING && (
           <div className="animate-pulse text-cyan-500">_</div>
        )}
      </div>
    </div>
  );
};

export default ServerConsole;