const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// 允许跨域请求 (根据你的前端部署地址修改 origin)
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST"]
}));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const DOWNLOAD_ROOT = path.join(__dirname, 'downloads');

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_ROOT)) {
  fs.mkdirSync(DOWNLOAD_ROOT);
}

// 清理函数：删除超过1小时的文件
setInterval(() => {
    fs.readdir(DOWNLOAD_ROOT, (err, files) => {
        if (err) return;
        files.forEach(file => {
            const filePath = path.join(DOWNLOAD_ROOT, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (Date.now() - stats.mtime.getTime() > 3600000) {
                    fs.rm(filePath, { recursive: true, force: true }, () => {});
                }
            });
        });
    });
}, 1800000); // 每30分钟检查一次

// 构建 yt-dlp 参数
const buildArgs = (options, outputDir) => {
  const args = [];
  
  // 基础参数
  args.push('--newline'); // 关键：让进度输出换行，方便解析
  args.push('--no-colors');
  args.push('--progress');
  
  // 输出模板 (保存到特定会话目录)
  // 使用 path.join 可能会有转义问题，直接拼接字符串更安全，yt-dlp 会处理路径
  const template = `${outputDir}/${options.filenameTemplate || '%(title)s.%(ext)s'}`;
  args.push('-o', template);

  // 格式选择
  if (options.audioOnly) {
    args.push('-x'); // Extract audio
    if (options.audioFormat) {
      args.push('--audio-format', options.audioFormat);
    }
  } else {
    if (options.format) {
      args.push('-f', options.format);
    }
    if (options.mergeOutput) {
      args.push('--merge-output-format', options.mergeOutput);
    }
  }

  // 其他开关
  if (options.subs) args.push('--write-subs');
  if (options.autoSubs) args.push('--write-auto-subs');
  if (options.embedSubs) args.push('--embed-subs');
  if (options.embedThumbnail) args.push('--embed-thumbnail');
  if (options.embedMetadata) args.push('--embed-metadata');
  if (options.cookiesBrowser) args.push('--cookies-from-browser', options.cookiesBrowser);
  if (options.proxy) args.push('--proxy', options.proxy);
  if (options.restrictFilenames) args.push('--restrict-filenames');
  
  // 只有明确开启播放列表才下载，否则默认只下载单视频
  if (options.playlist) {
    args.push('--yes-playlist');
  } else {
    args.push('--no-playlist');
  }

  // 目标 URL (最后添加)
  args.push(options.url);

  return args;
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('start-download', (data) => {
    const { url, options } = data;
    
    if (!url) {
        socket.emit('log', { message: '错误: URL 不能为空', type: 'error' });
        socket.emit('status', 'error');
        return;
    }

    const sessionId = uuidv4();
    const sessionDir = path.join(DOWNLOAD_ROOT, sessionId);
    
    if (!fs.existsSync(sessionDir)){
        fs.mkdirSync(sessionDir);
    }

    socket.emit('log', { message: `会话已创建 ID: ${sessionId}`, type: 'info' });
    socket.emit('status', 'preparing');

    const args = buildArgs(options, sessionDir);
    socket.emit('log', { message: `执行指令: yt-dlp ${args.join(' ')}`, type: 'info' });

    const ytProcess = spawn('yt-dlp', args);
    let finalFileName = null;

    socket.emit('status', 'downloading');

    ytProcess.stdout.on('data', (data) => {
      const text = data.toString();
      
      // 尝试解析进度
      // [download]  25.0% of 10.00MiB...
      const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        socket.emit('progress', percent);
      }
      
      // 尝试捕捉文件名 (Destination: ...) 或者 [Merger] Merging formats into "..."
      const destMatch = text.match(/Destination:\s+(.*)$/m) || text.match(/Merging formats into "(.*)"/);
      if (destMatch) {
          // 只保留文件名，不要路径
          const fullPath = destMatch[1];
          finalFileName = path.basename(fullPath);
      }
      
      // 已经下载过的情况
      const alreadyMatch = text.match(/\[download\]\s+(.*)\s+has already been downloaded/);
      if (alreadyMatch) {
          finalFileName = path.basename(alreadyMatch[1]);
          socket.emit('progress', 100);
      }

      // 发送原始日志 (去除空白行)
      if (text.trim()) {
        socket.emit('log', { message: text.trim(), type: 'info' });
      }
    });

    ytProcess.stderr.on('data', (data) => {
      const text = data.toString();
      // yt-dlp 的 stderr 有时包含警告而非错误
      const type = text.toLowerCase().includes('error') ? 'error' : 'warning';
      socket.emit('log', { message: text.trim(), type });
    });

    ytProcess.on('close', (code) => {
      if (code === 0) {
        socket.emit('log', { message: '下载流程结束', type: 'success' });
        
        // 查找目录下生成的文件 (为了确保找到正确的文件)
        fs.readdir(sessionDir, (err, files) => {
            if (err || files.length === 0) {
                socket.emit('log', { message: '未找到生成的文件', type: 'error' });
                socket.emit('status', 'error');
                return;
            }
            
            // 简单的逻辑：取第一个文件，或者取我们在 stdout 捕获到的文件名
            const fileToSend = finalFileName || files[0];
            
            socket.emit('completed', {
                filename: fileToSend,
                downloadUrl: `/download/${sessionId}/${encodeURIComponent(fileToSend)}`
            });
            socket.emit('status', 'completed');
        });
        
      } else {
        socket.emit('log', { message: `进程退出，代码: ${code}`, type: 'error' });
        socket.emit('status', 'error');
      }
    });
    
    // 监听客户端断开，如果在下载中则杀掉进程
    socket.on('disconnect', () => {
        if (ytProcess.exitCode === null) {
            ytProcess.kill();
        }
    });
  });
});

// 文件下载路由
app.get('/download/:sessionId/:filename', (req, res) => {
    const { sessionId, filename } = req.params;
    // 安全检查：防止路径遍历
    if (sessionId.includes('..') || filename.includes('..') || sessionId.includes('/')) {
        return res.status(403).send('Invalid path');
    }

    const filePath = path.join(DOWNLOAD_ROOT, sessionId, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
            } else {
                // 可选：下载后立即删除文件
                // fs.rm(path.join(DOWNLOAD_ROOT, sessionId), { recursive: true }, () => {});
            }
        });
    } else {
        res.status(404).send('File not found or expired');
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});