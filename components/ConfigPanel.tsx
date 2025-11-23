import React from 'react';
import { DlpOptions, Tab, DownloadStatus } from '../types';
import { FORMAT_OPTIONS, AUDIO_FORMATS, MERGE_FORMATS, BROWSER_OPTIONS } from '../constants';

interface ConfigPanelProps {
  options: DlpOptions;
  setOptions: React.Dispatch<React.SetStateAction<DlpOptions>>;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isAnalyzing: boolean;
  status: DownloadStatus;
  aiOutput: string;
  onAnalyze: () => void;
}

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void; description?: string; disabled?: boolean }> = ({ label, checked, onChange, description, disabled }) => (
  <div className={`flex items-start justify-between py-3 border-b border-slate-800 last:border-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div>
      <div className="font-medium text-slate-200 text-sm">{label}</div>
      {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        checked ? 'bg-blue-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const ModeCard: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  description: string;
}> = ({ title, icon, active, onClick, description }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 w-full text-left group ${
      active 
        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10' 
        : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80'
    }`}
  >
    <div className={`p-2 rounded-lg mb-3 ${active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:text-slate-200'}`}>
      {icon}
    </div>
    <h3 className={`font-bold ${active ? 'text-blue-400' : 'text-slate-200'}`}>{title}</h3>
    <p className="text-xs text-slate-500 mt-1">{description}</p>
    
    {active && (
      <div className="absolute top-4 right-4 text-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    )}
  </button>
);

const ConfigPanel: React.FC<ConfigPanelProps> = ({ options, setOptions, activeTab, setActiveTab, isAnalyzing, status, aiOutput, onAnalyze }) => {
  const isLocked = status === DownloadStatus.DOWNLOADING || status === DownloadStatus.PREPARING;

  const updateOption = <K extends keyof DlpOptions>(key: K, value: DlpOptions[K]) => {
    if (isLocked) return;
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden transition-opacity ${isLocked ? 'opacity-80 pointer-events-none' : ''}`}>
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab(Tab.QUICK)}
          className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
            activeTab === Tab.QUICK ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          快速模式
        </button>
        <button
          onClick={() => setActiveTab(Tab.ADVANCED)}
          className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
            activeTab === Tab.ADVANCED ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          高级参数
        </button>
        <button
          onClick={() => setActiveTab(Tab.AI_HELP)}
          className={`flex-1 px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === Tab.AI_HELP ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI 助手
        </button>
      </div>

      <div className="p-6 min-h-[300px]">
        {/* Quick Mode Tab (Card Based) */}
        {activeTab === Tab.QUICK && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModeCard 
                title="视频下载"
                description="下载最佳画质视频与音频"
                active={!options.audioOnly}
                onClick={() => updateOption('audioOnly', false)}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
              />
              <ModeCard 
                title="纯音频提取"
                description="仅提取音轨，转换为 MP3/M4A"
                active={options.audioOnly}
                onClick={() => updateOption('audioOnly', true)}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                }
              />
            </div>

            <div className="bg-slate-950/30 rounded-lg p-4 border border-slate-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {!options.audioOnly ? (
                   <>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold uppercase">最大分辨率</label>
                      <select
                        value={options.format}
                        onChange={(e) => updateOption('format', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {FORMAT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold uppercase">封装格式 (Container)</label>
                      <select
                        value={options.mergeOutput}
                        onChange={(e) => updateOption('mergeOutput', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {MERGE_FORMATS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                   </>
                 ) : (
                   <div>
                      <label className="block text-xs text-slate-400 mb-2 font-semibold uppercase">音频编码</label>
                      <select
                        value={options.audioFormat}
                        onChange={(e) => updateOption('audioFormat', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {AUDIO_FORMATS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                 )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
               <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">常用开关</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <Toggle 
                    label="下载播放列表" 
                    description="如果链接是合集，则全部下载"
                    checked={options.playlist} 
                    onChange={(val) => updateOption('playlist', val)} 
                  />
                   <Toggle 
                    label="嵌入字幕" 
                    description="自动下载并合并字幕 (Subtitles)"
                    checked={options.embedSubs} 
                    onChange={(val) => {
                      updateOption('embedSubs', val);
                      if (val) {
                        updateOption('subs', true);
                        updateOption('autoSubs', true);
                      }
                    }} 
                  />
               </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === Tab.ADVANCED && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">元数据 & 高级字幕</h3>
               <Toggle 
                  label="嵌入缩略图" 
                  checked={options.embedThumbnail} 
                  onChange={(val) => updateOption('embedThumbnail', val)} 
                />
               <Toggle 
                  label="嵌入元数据" 
                  description="写入 Artist, Title 等标签"
                  checked={options.embedMetadata} 
                  onChange={(val) => updateOption('embedMetadata', val)} 
                />
               <Toggle 
                  label="下载字幕文件 (.srt/.vtt)" 
                  checked={options.subs} 
                  onChange={(val) => updateOption('subs', val)} 
                />
                <Toggle 
                    label="自动生成字幕 (Auto-subs)" 
                    description="尝试下载自动翻译或生成的字幕"
                    checked={options.autoSubs} 
                    onChange={(val) => updateOption('autoSubs', val)} 
                  />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">网络 & 代理</h3>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cookies 来源浏览器</label>
                <select
                  value={options.cookiesBrowser}
                  onChange={(e) => updateOption('cookiesBrowser', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {BROWSER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">用于会员内容或通过年龄验证。</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">HTTP 代理 (Proxy)</label>
                <input
                  type="text"
                  value={options.proxy}
                  onChange={(e) => updateOption('proxy', e.target.value)}
                  placeholder="http://127.0.0.1:7890"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">文件名模板</label>
                <input
                  type="text"
                  value={options.filenameTemplate}
                  onChange={(e) => updateOption('filenameTemplate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <Toggle 
                  label="限制文件名字符" 
                  description="仅使用 ASCII 字符，避免乱码"
                  checked={options.restrictFilenames} 
                  onChange={(val) => updateOption('restrictFilenames', val)} 
                />
            </div>
          </div>
        )}

        {/* AI Help Tab */}
        {activeTab === Tab.AI_HELP && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-400">Gemini 智能分析器</h3>
              <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all ${
                  isAnalyzing 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中...
                  </span>
                ) : '分析 URL 与配置'}
              </button>
            </div>
            
            <div className="flex-1 bg-slate-950/50 rounded-lg p-4 border border-slate-800 text-sm leading-relaxed overflow-y-auto max-h-[300px]">
               {aiOutput ? (
                 <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{aiOutput}</div>
                 </div>
               ) : (
                 <div className="text-slate-500 flex flex-col items-center justify-center h-40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-center">输入视频 URL 并点击上方按钮<br/>让 Gemini AI 为您推荐针对该网站的最佳下载参数。</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;