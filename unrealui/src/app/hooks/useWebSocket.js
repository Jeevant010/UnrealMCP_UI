"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000];

export default function useWebSocket(url = "ws://localhost:8080/ws/chat") {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const retriesRef = useRef(0);
  const mountedRef = useRef(true);
  const urlRef = useRef(url);
  const hasLoggedConnectFailureRef = useRef(false);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(urlRef.current);
      wsRef.current = ws;
      setConnectionStatus("connecting");

      ws.onopen = () => {
        if (!mountedRef.current) return;
        retriesRef.current = 0;
        hasLoggedConnectFailureRef.current = false;
        setConnectionStatus("connected");
        console.log("[WS] connected to", urlRef.current);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch {
          console.warn("[WS] received non-JSON message");
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log("[WS] disconnected");
        setConnectionStatus("reconnecting");
        const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)];
        retriesRef.current += 1;
        setTimeout(connect, delay);
      };

      ws.onerror = () => {
        if (!hasLoggedConnectFailureRef.current) {
          console.warn("[WS] connection error; retrying automatically");
          hasLoggedConnectFailureRef.current = true;
        }
        // Let onclose handle reconnection scheduling to avoid duplicate logic.
      };
    } catch (err) {
      console.error("[WS] connection failed", err);
      setConnectionStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    urlRef.current = url;
    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [url, connect]);

  const sendMessage = useCallback((obj) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj));
      return true;
    }
    return false;
  }, []);

  return { sendMessage, lastMessage, connectionStatus };
}
