import React, { useState } from 'react';

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
  return <div style={{padding:20,color:'#ddd'}}>
    <h2>Activate VAMP</h2>
    <input value={key} onChange={e=>setKey(e.target.value)} placeholder="VAMP-XXXX-..." style={{width:'60%'}}/>
    <button onClick={submit}>Activate</button>
    {status && <div>{status}</div>}
  </div>;
}

export default function App(){
  const [licensed,setLicensed]=useState(false);
  const [code,setCode]=useState('-- Luau script');
  const [logs,setLogs]=useState<string[]>([]);
  const [wsReady,setWsReady]=useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(()=>{
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
    <div style={{height:'100vh',background:'#1e1e2b',color:'#ddd'}}>
      {!licensed ? <LicenseScreen onActivated={()=>setLicensed(true)}/> : (
        <div style={{display:'flex',height:'100%'}}>
          <div style={{width:250,background:'#111',padding:10}}>
            <h3>Explorer</h3>
            <div>Connection: {wsReady? 'Connected':'Disconnected'}</div>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',gap:8,padding:8}}>
              <button onClick={execute}>Execute</button>
              <button onClick={stop}>Stop</button>
            </div>
            <div style={{flex:1,padding:8}}>
              <textarea value={code} onChange={(e)=>setCode(e.target.value)} style={{width:'100%',height:'60vh',background:'#1e1e2b',color:'#ddd',border:'1px solid #333',padding:8}} />
            </div>
            <div style={{height:200,background:'#000',color:'#0f0',padding:8,overflow:'auto'}}>
              {logs.map((l,i)=><div key={i}>{l}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
