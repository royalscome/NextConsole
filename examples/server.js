const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = 3210;

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // SSE endpoint
  if (req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const events = [
      { event: 'connected', data: { status: 'ok', server: 'NextConsole Test', time: new Date().toISOString() } },
      { event: 'user_login', data: { userId: 'u_12345', name: '张三', role: 'admin' } },
      { event: 'order_created', data: { orderId: 'ORD-20260415-001', amount: 299.9, items: 3 } },
      { event: 'notification', data: { title: '系统通知', body: '服务器负载正常，CPU 23%，内存 61%' } },
      { event: 'chat_message', data: { from: 'Alice', to: 'Bob', text: '下午开会记得带文档', ts: Date.now() } },
      { event: 'data_sync', data: { table: 'products', synced: 1024, total: 1024, duration: '2.3s' } },
      { event: 'heartbeat', data: { ping: true, seq: 1, uptime: '3h 22m' } },
      { event: 'user_logout', data: { userId: 'u_12345', reason: '主动退出', sessionDuration: '45m' } },
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i >= events.length) {
        res.write(`event: done\ndata: ${JSON.stringify({ message: '所有事件已推送完毕', total: events.length })}\n\n`);
        clearInterval(timer);
        res.end();
        return;
      }
      const evt = events[i];
      res.write(`event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\nid: ${i + 1}\n\n`);
      i++;
    }, 800);

    req.on('close', () => clearInterval(timer));
    return;
  }

  // SSE - AI streaming simulation
  if (req.url === '/sse/ai') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const text = 'NextConsole 是新一代前端调试控制台，专为 AI 流式输出场景优化。它使用 Shadow DOM 实现完全隔离，支持 console/network/storage/element/system 五大面板，并提供 appendStream API 实现实时流式日志渲染。';
    const tokens = text.split('');
    let i = 0;

    const timer = setInterval(() => {
      if (i >= tokens.length) {
        res.write(`event: done\ndata: [DONE]\n\n`);
        clearInterval(timer);
        res.end();
        return;
      }
      // Send 1-3 chars at a time like real AI
      const chunk = tokens.slice(i, i + 1 + Math.floor(Math.random() * 2)).join('');
      i += chunk.length;
      res.write(`data: ${JSON.stringify({ content: chunk, index: i })}\n\n`);
    }, 50 + Math.random() * 80);

    req.on('close', () => clearInterval(timer));
    return;
  }

  // Health check
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'NextConsole Test Server',
      endpoints: {
        sse: `http://localhost:${PORT}/sse`,
        sseAI: `http://localhost:${PORT}/sse/ai`,
        ws: `ws://localhost:${PORT}/ws`,
      },
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket 客户端已连接');

  // Welcome
  ws.send(JSON.stringify({ type: 'welcome', data: { message: '连接成功', server: 'NextConsole Test', time: new Date().toISOString() } }));

  // Simulate server push messages
  const pushMsgs = [
    { type: 'notification', data: { title: '新消息', body: '你有 3 条未读消息' } },
    { type: 'user_status', data: { userId: 'u_67890', name: 'Alice', status: 'online' } },
    { type: 'stock_update', data: { symbol: 'AAPL', price: 198.52, change: '+1.23%' } },
    { type: 'stock_update', data: { symbol: 'TSLA', price: 245.10, change: '-0.87%' } },
    { type: 'chat', data: { from: 'Bob', text: '项目进度怎么样了？', ts: Date.now() } },
  ];

  let pushIdx = 0;
  const pushTimer = setInterval(() => {
    if (pushIdx >= pushMsgs.length || ws.readyState !== 1) {
      clearInterval(pushTimer);
      return;
    }
    ws.send(JSON.stringify(pushMsgs[pushIdx]));
    pushIdx++;
  }, 1200);

  // Echo + handle client messages
  ws.on('message', (raw) => {
    const text = raw.toString();
    console.log('📨 收到:', text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (parsed && parsed.action === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', data: { ts: Date.now(), echo: parsed } }));
    } else if (parsed && parsed.action === 'get_users') {
      ws.send(JSON.stringify({
        type: 'users_list',
        data: {
          users: [
            { id: 1, name: '张三', role: 'admin' },
            { id: 2, name: '李四', role: 'editor' },
            { id: 3, name: '王五', role: 'viewer' },
          ],
        },
      }));
    } else {
      // Echo back
      ws.send(JSON.stringify({ type: 'echo', data: { original: text, length: text.length, ts: Date.now() } }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket 客户端已断开');
    clearInterval(pushTimer);
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   NextConsole Test Server               ║
║                                         ║
║   SSE:  http://localhost:${PORT}/sse       ║
║   AI:   http://localhost:${PORT}/sse/ai    ║
║   WS:   ws://localhost:${PORT}/ws          ║
║   Info: http://localhost:${PORT}/           ║
╚══════════════════════════════════════════╝
`);
});
