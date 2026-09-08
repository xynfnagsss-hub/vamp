import React, { useState, useEffect, useRef } from 'react';

// Lightweight SVG icons (replaceable with Lucide later)
const Icon = ({name}:{name:string}) => {
  const size = 18;
  switch(name){
    case 'scripts': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'workspace': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/></svg>;
    case 'library': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20l9-5-9-5-9 5 9 5z" /></svg>;
    case 'settings': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.3-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.5 2.5l.06.06c.5.5 1.2.5 1.82.33h.09C9 2.7 9 2 9 1.3V1a2 2 0 1 1 4 0v.09c0 .7.4 1.3 1 1.51.62.17 1.32.17 1.82-.33L17.5 2.5A2 2 0 1 1 20.33 5.33l-.06.06c-.7.7-.7 1.8 0 2.5.7.7.7 1.8 0 2.5z"/></svg>;
    default: return null;
  }
};

function LicenseScreen({onActivated}:{onActivated:() => void}){
  const [key,setKey]=useState('');
  const [status,setStatus]=useState<string | null>(null);
  async function submit(){
    try{
      const res = await fetch('http://localhost:4000/api/license/activate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key,deviceInfo:navigator.userAgent})});
      const j = await res.json();
      if (res.ok) { setStatus('Activated'); onActivated(); } else setStatus(JSON.stringify(j));
    }catch(e){ setStatus('network_error'); }
  }
  return (
    <div className="license-screen">
      <div className="license-card">
        <div className="license-hero">
          <div className="logo">VAMP</div>
          <div className="subtitle">Enter your license to activate VAMP</div>
        </div>
        <div className="license-actions">
          <input value={key} onChange={e=>setKey(e.target.value)} placeholder="VAMP-XXXX-XXXX-XXXX" className="input" />
          <div className="row">
            <button className="btn primary" onClick={submit}>Activate</button>
            <button className="btn" onClick={()=>setStatus('trial-mode')}>Use Trial</button>
          </div>
          {status && <div className="status">{status}</div>}
        </div>
      </div>
    </div>
  );
}

// Editor wrapper — tries to load Monaco, falls back to textarea
function Editor({value,onChange}:{value:string,onChange:(v:string)=>void}){
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        // dynamic import to avoid bundler issues; fall back gracefully
        const monaco = (window as any).monaco || await import('monaco-editor');
        if (!mounted || !ref.current) return;
        const editor = monaco.editor.create(ref.current, {
          value,
          language: 'lua',
          automaticLayout: true,
          theme: 'vs-dark',
          minimap: { enabled: false }
        });
        editor.onDidChangeModelContent(()=> onChange(editor.getValue()));
        return ()=> editor.dispose();
      }catch(e){ /* ignore — caller will render fallback */ }
    })();
    return ()=>{ mounted=false };
  },[]);
  return <div className="editor-area"><div ref={ref} className="monaco-root" /><textarea className="editor-fallback" value={value} onChange={e=>onChange(e.target.value)} /></div>;
}

export default function App(){
  const [licensed,setLicensed]=useState(false);
  const [code,setCode]=useState('-- Luau script');
  const [logs,setLogs]=useState<string[]>([]);
  const [wsReady,setWsReady]=useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [sidebar, setSidebar] = useState('scripts');
  const [showConsole, setShowConsole] = useState(true);

  useEffect(()=>{
    const token = encodeURIComponent((window as any).__VAMP_RUNTIME_TOKEN__ || 'dev-token');
    try{
      const ws = new WebSocket(`ws://localhost:8081/?token=${token}`);
      ws.onopen = ()=> setWsReady(true);
      ws.onmessage = (ev)=>{
        try{ const d = JSON.parse(ev.data); if(d.type==='stdout'||d.type==='stderr') setLogs(l=>[...l,d.data]); else if(d.type==='exit') setLogs(l=>[...l,`[exit:${d.code}]`]); }
        catch(e){ setLogs(l=>[...l,ev.data.toString()]); }
      };
      ws.onclose = ()=> setWsReady(false);
      wsRef.current = ws;
      return ()=> ws.close();
    }catch(e){ console.warn('ws error',e); }
  },[]);

  function execute(){
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) { setLogs(l=>[...l,'[runtime not connected]']); return; }
    wsRef.current.send(JSON.stringify({ type: 'execute', code }));
    setLogs(l=>[...l,'[sent execute]']);
  }
  function stop(){
    setLogs(l=>[...l,'[stop not supported in this runtime]']);
  }

  return (
    <div className="app-root">
      <div className="topbar">
        <div className="brand">VAMP <span className="dot"/></div>
        <div className="top-actions">
          <div className={`status ${wsReady? 'connected':'disconnected'}`}>{wsReady? 'Connected':'Disconnected'}</div>
          <button className="icon-btn">⚙</button>
          <div className="window-controls">
            <button className="win">_</button>
            <button className="win">▢</button>
            <button className="win close">×</button>
          </div>
        </div>
      </div>
      <div className="body">
        <aside className="sidebar">
          <div className="sidebar-top">
            <button className={`side-item ${sidebar==='scripts'?'active':''}`} onClick={()=>setSidebar('scripts')}><Icon name="scripts"/><span>Scripts</span></button>
            <button className={`side-item ${sidebar==='workspace'?'active':''}`} onClick={()=>setSidebar('workspace')}><Icon name="workspace"/><span>Workspace</span></button>
            <button className={`side-item ${sidebar==='library'?'active':''}`} onClick={()=>setSidebar('library')}><Icon name="library"/><span>Library</span></button>
            <button className={`side-item ${sidebar==='settings'?'active':''}`} onClick={()=>setSidebar('settings')}><Icon name="settings"/><span>Settings</span></button>
          </div>
          <div className="sidebar-bottom">VAMP</div>
        </aside>
        <main className="main-area">
          <div className="tabs">
            <div className="tab active">script1.lua <button className="tab-close">×</button></div>
            <div className="tab">script2.lua</div>
            <div className="tabs-spacer" />
          </div>
          <div className="editor-row">
            <div className="editor-column">
              <Editor value={code} onChange={setCode} />
            </div>
            <div className="right-panel">
              <div className="panel-card">
                <h4>Script Info</h4>
                <div className="info-row"><strong>Lines:</strong> {code.split('\n').length}</div>
                <div className="info-row"><strong>Symbols:</strong> 0</div>
              </div>
            </div>
          </div>
          {showConsole && (
            <div className="console">
              <div className="console-toolbar">
                <div className="console-actions">
                  <button className="btn primary" onClick={execute}>Execute</button>
                  <button className="btn" onClick={stop}>Stop</button>
                  <button className="btn" onClick={()=>setLogs([])}>Clear</button>
                </div>
                <div className="console-status">{logs.some(l=>l.includes('error'))? 'Errors' : 'Idle'}</div>
              </div>
              <div className="console-body">
                {logs.map((l,i)=><div key={i} className={`log ${/error/i.test(l)? 'err':''}`}>{l}</div>)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
