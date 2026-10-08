# Obzue AI Filmmaking Studio

Automated multi-agent AI filmmaking workspace.

## Architecture

- **Backend**: LangGraph StateGraph with Executive Producer router + specialized agents (Screenplay, Character Designer, DP, Voice/Music, File Broker, QA).
- **Streaming**: FastAPI + Server-Sent Events for real-time node updates to a React Flow / node-graph frontend.
- **Style**: Dark cinematic UI ready (obsidian canvas, color-coded agent blocks: violet screenplay, cyan DP, ruby file broker).

## Quick Start

```bash
pip install -r requirements.txt
python automated_studio_app.py
```

POST to `/api/v1/film/generate-stream` with `{"creative_spark": "your idea", "style_intent": "cartoon | cinematic | music-video"}`.

## Next Steps

- Wire real LLM wrappers (OpenAI, Anthropic, Grok, etc.)
- Add parallel Send() for visual / voice / music generation
- React Flow frontend with draggable agent nodes and socket connections
- Vector store for character lore / style bibles
- Integration with video models (Runway, Kling, Seedance, Veo, Grok Imagine Video)

Inspired by production pipelines from AgentCut, Filmcrew Studio, and multi-agent film systems.
