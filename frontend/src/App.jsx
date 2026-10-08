import { useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './index.css'

const initialNodes = [
  { id: 'exec', type: 'default', position: { x: 50, y: 80 }, data: { label: 'Executive Producer', status: 'idle', logs: [] }, style: { background: '#1a0f2e', color: '#e0d0ff', border: '1px solid #7c3aed', width: 200 } },
  { id: 'script', type: 'default', position: { x: 320, y: 80 }, data: { label: 'Screenplay Writer', status: 'idle', logs: [] }, style: { background: '#0f1a2e', color: '#c0d8ff', border: '1px solid #3b82f6', width: 200 } },
  { id: 'qa', type: 'default', position: { x: 590, y: 80 }, data: { label: 'QA Validator', status: 'idle', logs: [] }, style: { background: '#1e1a0f', color: '#ffe0c0', border: '1px solid #f59e0b', width: 200 } },
  { id: 'char', type: 'default', position: { x: 860, y: 80 }, data: { label: 'Character Designer', status: 'idle', logs: [] }, style: { background: '#1a0f1e', color: '#f0c0ff', border: '1px solid #a855f7', width: 200 } },
  { id: 'dp', type: 'default', position: { x: 1130, y: 80 }, data: { label: 'Director of Photography', status: 'idle', logs: [] }, style: { background: '#0f1e1a', color: '#c0ffe0', border: '1px solid #10b981', width: 200 } },
  { id: 'voice', type: 'default', position: { x: 1400, y: 80 }, data: { label: 'Voice + Music', status: 'idle', logs: [] }, style: { background: '#1e0f1a', color: '#ffc0e0', border: '1px solid #ec4899', width: 200 } },
  { id: 'file', type: 'default', position: { x: 1670, y: 80 }, data: { label: 'File Broker', status: 'idle', logs: [] }, style: { background: '#1a0f0f', color: '#ffd0c0', border: '1px solid #ef4444', width: 200 } },
]

const initialEdges = [
  { id: 'e1', source: 'exec', target: 'script', animated: true },
  { id: 'e2', source: 'script', target: 'qa', animated: true },
  { id: 'e3', source: 'qa', target: 'char', animated: true },
  { id: 'e4', source: 'char', target: 'dp', animated: true },
  { id: 'e5', source: 'dp', target: 'voice', animated: true },
  { id: 'e6', source: 'voice', target: 'file', animated: true },
]

const nodeIdMap = {
  ExecutiveProducer: 'exec',
  ScreenplayWriter: 'script',
  QA_Validator: 'qa',
  CharacterDesigner: 'char',
  DirectorOfPhotography: 'dp',
  VoiceMusic: 'voice',
  FileBroker: 'file',
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [prompt, setPrompt] = useState('A gritty cyberpunk detective finding a toxic glowing vial in an undersea laboratory.')
  const [style, setStyle] = useState('cinematic photorealistic')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const eventSourceRef = useRef(null)

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const updateNode = (nodeId, updates) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...updates }, style: { ...n.style, boxShadow: updates.status === 'active' ? '0 0 12px #22d3ee' : n.style.boxShadow } }
          : n
      )
    )
  }

  const startProduction = async () => {
    if (running) return
    setRunning(true)
    setLog([])
    setNodes(initialNodes.map(n => ({ ...n, data: { ...n.data, status: 'idle', logs: [] } })))

    try {
      const res = await fetch('/api/v1/film/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative_spark: prompt, style_intent: style }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const chunk of lines) {
          if (!chunk.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(chunk.slice(6))
            const nodeId = nodeIdMap[payload.node]
            if (nodeId) {
              updateNode(nodeId, {
                status: 'active',
                logs: payload.logs || [],
                lastData: payload.data,
              })
              setLog((prev) => [...prev, `[${payload.node}] ${payload.logs?.[0] || 'update'}`])
            }
          } catch (e) {
            console.warn('parse error', e)
          }
        }
      }
    } catch (err) {
      setLog((prev) => [...prev, `Error: ${err.message}`])
    } finally {
      setRunning(false)
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'complete' } })))
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0F1015', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E202B', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ color: '#a78bfa' }}>Obzue AI Filmmaking Studio</strong>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Creative spark..."
          style={{ flex: 1, minWidth: 280, background: '#1E202B', border: '1px solid #374151', color: '#fff', padding: '6px 10px', borderRadius: 4 }}
        />
        <input
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="Style intent"
          style={{ width: 220, background: '#1E202B', border: '1px solid #374151', color: '#fff', padding: '6px 10px', borderRadius: 4 }}
        />
        <button
          onClick={startProduction}
          disabled={running}
          style={{ background: running ? '#374151' : '#7c3aed', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: running ? 'not-allowed' : 'pointer' }}
        >
          {running ? 'Generating...' : 'Run Production'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          style={{ background: '#0F1015' }}
        >
          <Background color="#1E202B" gap={20} />
          <Controls />
          <MiniMap nodeColor="#7c3aed" maskColor="#0F1015cc" />
        </ReactFlow>
      </div>

      <div style={{ height: 140, borderTop: '1px solid #1E202B', background: '#0a0b10', overflow: 'auto', padding: 10, fontFamily: 'monospace', fontSize: 12 }}>
        {log.length === 0 && <div style={{ color: '#6b7280' }}>Logs will stream here when production runs...</div>}
        {log.map((line, i) => (
          <div key={i} style={{ color: '#a7f3d0' }}>{line}</div>
        ))}
      </div>
    </div>
  )
}
