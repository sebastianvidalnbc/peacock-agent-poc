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

  // One stable agent for the session; reads live connection from the store.
  const agentRef = useRef<Agent | null>(null);
  if (agentRef.current === null) agentRef.current = new Agent(mockPeacockService);
  const agent = agentRef.current;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debug, setDebug] = useState(false);
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
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleAction(action: AssistantAction) {
    if (action.kind === "connect") {
      pendingResume.current = action.resumeText ?? null;
      setAuthOpen(true);
    }
  }

  function onAuthContinue() {
    prototypeStore.connect(DEFAULT_PERSONA_ID);
    setAuthOpen(false);
    const resume = pendingResume.current;
    pendingResume.current = null;
    if (resume) void handleSend(resume);
  }

  function resetConversation() {
    setMessages([]);
    agent.ctx.reset();
  }

  return (
    <div className="app">
      <AppBar onOpenSettings={() => setSettingsOpen(true)} />
      <ChatWindow
        messages={messages}
        pending={pending}
        debug={debug}
        onSend={handleSend}
        onAction={handleAction}
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
        onSelectPersona={(id) => prototypeStore.connect(id)}
        onToggleDebug={() => setDebug((d) => !d)}
        onDisconnect={() => prototypeStore.disconnect()}
        onReset={() => {
          prototypeStore.resetScenario();
          resetConversation();
        }}
        onClear={() => {
          prototypeStore.clearAll();
          resetConversation();
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
