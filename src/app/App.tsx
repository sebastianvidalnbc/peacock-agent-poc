import { useEffect, useRef, useState } from "react";
import { usePrototypeStore } from "../state/usePrototypeStore";
import { prototypeStore } from "../state/prototype-store";
import { mockPeacockService } from "../peacock/MockPeacockService";
import { Agent } from "../agent/agent";
import type { AgentResponse, AssistantAction, ChatMessage } from "../agent/types";
import { ChatWindow } from "../components/chat/ChatWindow";
import { PeacockAuthDialog } from "../components/prototype/PeacockAuthDialog";
import { SettingsPanel } from "../components/prototype/SettingsPanel";
import { AppBar } from "./AppBar";
import { useVisualViewport } from "../hooks/useVisualViewport";

/** Persona connected by the simulated authorization flow. */
const DEFAULT_PERSONA_ID = "alex";

/** Stable message id: crypto.randomUUID when available, else a random fallback. */
function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function App() {
  const { connectedPersonaId } = usePrototypeStore();

  // Keep the app shell sized to the visible viewport so the composer stays
  // above the iOS software keyboard (drives --app-viewport-height via CSS).
  useVisualViewport();

  // One stable agent for the session; reads live connection from the store.
  const agentRef = useRef<Agent | null>(null);
  if (agentRef.current === null) agentRef.current = new Agent(mockPeacockService);
  const agent = agentRef.current;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debug, setDebug] = useState(false);
  const [policyMode, setPolicyMode] = useState(false);
  // Message ids whose inline title-offer preview player is currently shown.
  const [previewOpenIds, setPreviewOpenIds] = useState<Set<string>>(new Set());
  const pendingResume = useRef<string | null>(null);

  // Lock the background from scrolling while any modal dialog is open, so the
  // page behind the backdrop stays fixed and only the dialog body scrolls.
  const modalOpen = settingsOpen || authOpen;
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: newId(), role: "user", text: trimmed }]);
    setPending(true);
    try {
      const res: AgentResponse = await agent.respond(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          text: res.text,
          card: res.card,
          actions: res.actions,
          toolName: res.toolName,
          debug: res.debug,
          policy: res.policy,
          policySource: res.policySource,
          access: res.access,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleAction(action: AssistantAction, messageId: string) {
    if (action.kind === "connect") {
      pendingResume.current = action.resumeText ?? null;
      setAuthOpen(true);
      return;
    }
    if (action.kind === "preview") {
      // Toggle the inline preview player for the message that offered it.
      setPreviewOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(messageId)) next.delete(messageId);
        else next.add(messageId);
        return next;
      });
      return;
    }
    if (action.kind === "plans_info") {
      // Informational only — open the neutral plans page in a new tab. Never a
      // checkout or plan-selection surface (GREEN entitlement-gap explanation).
      if (action.resumeText) window.open(action.resumeText, "_blank", "noopener,noreferrer");
      return;
    }
    // Both "open" and "resume" hand off to the simulated Peacock playback flow.
    if ((action.kind === "open" || action.kind === "resume") && action.contentId) {
      void openInPeacock(action.contentId);
    }
  }

  async function openInPeacock(contentId: string) {
    setPending(true);
    try {
      const res: AgentResponse = await agent.openTitle(contentId);
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          text: res.text,
          card: res.card,
          actions: res.actions,
          toolName: res.toolName,
          debug: res.debug,
          policy: res.policy,
          policySource: res.policySource,
          access: res.access,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onAuthContinue() {
    prototypeStore.connect(DEFAULT_PERSONA_ID);
    setAuthOpen(false);
    const resume = pendingResume.current;
    pendingResume.current = null;
    if (resume) void handleSend(resume);
  }

  // The composer's "+" tools menu surfaces Peacock as one connected capability.
  // When disconnected it starts the simulated authorization; when already
  // connected it opens Prototype Settings to manage the demo account.
  function handlePeacockTool() {
    if (connectedPersonaId) setSettingsOpen(true);
    else {
      pendingResume.current = null;
      setAuthOpen(true);
    }
  }

  function resetConversation() {
    setMessages([]);
    setPreviewOpenIds(new Set());
    agent.ctx.reset();
  }

  return (
    <div className="app">
      <AppBar
        onOpenSettings={() => setSettingsOpen(true)}
        onNewChat={resetConversation}
      />
      <ChatWindow
        messages={messages}
        pending={pending}
        debug={debug}
        policyMode={policyMode}
        previewOpenIds={previewOpenIds}
        peacockConnected={connectedPersonaId !== null}
        onSend={handleSend}
        onAction={handleAction}
        onPeacockTool={handlePeacockTool}
      />
      <PeacockAuthDialog
        open={authOpen}
        onContinue={onAuthContinue}
        onCancel={() => {
          pendingResume.current = null;
          setAuthOpen(false);
        }}
      />
      <SettingsPanel
        open={settingsOpen}
        connectedPersonaId={connectedPersonaId}
        debug={debug}
        policyMode={policyMode}
        onSelectPersona={(id) => prototypeStore.connect(id)}
        onToggleDebug={() => setDebug((d) => !d)}
        onTogglePolicy={() => setPolicyMode((p) => !p)}
        onDisconnect={() => prototypeStore.disconnect()}
        onReset={() => {
          prototypeStore.resetScenario();
          resetConversation();
        }}
        onClear={() => {
          prototypeStore.clearAll();
          resetConversation();
        }}
        onTryPrompt={(prompt) => {
          setSettingsOpen(false);
          void handleSend(prompt);
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
