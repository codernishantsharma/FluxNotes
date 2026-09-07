# FluxNotes Docker Server

The FluxNotes Docker Server provides a headless ChatGPT automation server with a live browser streaming web interface and WebSocket API. It allows hosting FluxNotes on cloud platforms like Render or inside Docker containers without running the Electron desktop app UI locally.

---

## Features

- **Live Browser Stream (`/ws/view` & Web UI at `/`)**: Renders a live Chrome browser stream directly in the browser over CDP (Chrome DevTools Protocol) screencast with real-time mouse and keyboard event forwarding. This allows completing manual interactive tasks like logging into ChatGPT (`chatgpt.com`).
- **WebSocket API (`/ws/api`)**: High-performance WebSocket endpoint for sending prompts, receiving responses, and downloading generated images.
- **Persistent User Data**: Mounts `/app/user_data` to preserve browser sessions and login state across container restarts.
- **Render Ready**: Includes a `render.yaml` blueprint configuration for one-click deployment on [Render](https://render.com/).
- **Ngrok Support**: Optional ngrok tunneling for secure public HTTPS/WSS access.

---

## Quick Start (Docker Compose)

### 1. Run locally with Docker Compose

```bash
cd docker-server
docker compose up -d --build
```

The server will start listening on port `8787`.

### 2. Log in to ChatGPT

1. Open `http://localhost:8787/` in your web browser.
2. Interact with the live browser view on the webpage to sign into your ChatGPT account (`chatgpt.com`).
3. Once logged in, the status indicator will update to **Logged in**.

### 3. Connect via WebSocket API

Connect your application or client to `ws://localhost:8787/ws/api`.

#### Authentication (If `API_TOKEN` is set):
```json
{
  "type": "auth",
  "apiToken": "your-secret-api-token"
}
```

#### Send a Chat Prompt:
```json
{
  "type": "send",
  "sessionId": "session-1",
  "requestId": "req-1",
  "text": "Generate a study outline for Quantum Mechanics."
}
```

---

## Deploying to Render

Render allows hosting the Docker container as a Web Service.

### Option A: Using Render Blueprint (`render.yaml`)

1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** and select **Blueprint**.
3. Connect your repository. Render will automatically detect `docker-server/render.yaml` and configure the Web Service and Persistent Disk (`/app/user_data`).
4. Set optional environment variables (such as `API_TOKEN`) in the Render Dashboard.
5. Deploy the Blueprint.

### Option B: Manual Web Service Setup on Render

1. Click **New +** -> **Web Service**.
2. Connect your repository and set the **Root Directory** to `docker-server`.
3. Set **Runtime** to `Docker`.
4. Add a **Persistent Disk**:
   - Name: `fluxnotes-userdata`
   - Mount Path: `/app/user_data`
   - Size: `2 GB` or more
5. Configure Environment Variables (see table below).
6. Click **Create Web Service**.

Once deployed:
1. Open the service URL (e.g., `https://your-app.onrender.com/`).
2. Use the live browser view to log into ChatGPT.
3. Use `wss://your-app.onrender.com/ws/api` for API requests.

---

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8787` | HTTP & WebSocket server port |
| `HOST` | `0.0.0.0` | Bind host address |
| `API_TOKEN` | `""` (none) | Secret token required for WebSockets auth. Leave empty to disable auth. |
| `CHATGPT_URL` | `https://chatgpt.com/` | Default URL opened in browser |
| `USER_DATA_DIR` | `/app/user_data` | Directory storing browser cookies & session state |
| `VIEW_FPS` | `4` | Target frame rate for live browser stream (1-30) |
| `VIEW_QUALITY` | `70` | JPEG compression quality for live browser stream (20-100) |
| `VIEW_WIDTH` | `1280` | Viewport width |
| `VIEW_HEIGHT` | `800` | Viewport height |
| `USE_NGROK` | `false` | Enable ngrok tunnel (`true`/`false`) |
| `NGROK_AUTHTOKEN` | `""` | Ngrok authentication token |
| `NGROK_DOMAIN` | `""` | Reserved ngrok domain (optional) |
| `LOG_RESPONSES` | `true` | Log chat responses to `/app/logs/result.json` |

---

## API Endpoints Summary

- **`GET /health`**: Healthcheck endpoint. Returns browser status, login state, and current URL.
- **`GET /status`**: Server status summary.
- **`GET /view`**: Fallback MJPEG browser stream.
- **`WS /ws/view`**: CDP screencast and real-time input forwarding stream.
- **`WS /ws/api`**: Chat prompt and session control WebSocket API.
