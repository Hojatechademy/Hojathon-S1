import { useCallback, useRef, useState, useEffect } from "react";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

let nextId = 1;
const makeId = () => `m${Date.now()}-${nextId++}`;

export default function App() {
  const [messages, setMessages] = useState([
    { id: makeId(), role: "ai", text: "Hello! How can I help you?" },
  ]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // { dataUrl, name }
  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const listRef = useRef(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const showNotice = useCallback((text) => {
    setNotice(text);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (text) noticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, aiBusy]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !imagePreview) return;

    const userMsg = {
      id: makeId(),
      role: "user",
      text,
      image: imagePreview ? imagePreview.dataUrl : null,
    };
    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, text: m.text, image: m.image || null }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setAiBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          message: { text, image: userMsg.image },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((prev) => [...prev, { id: makeId(), role: "ai", text: data.text || "" }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "ai", text: err.message || "Something went wrong.", error: true },
      ]);
    } finally {
      setAiBusy(false);
    }
  }, [input, imagePreview, messages]);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        showNotice("Please choose a JPG, PNG or WEBP image.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        showNotice("Image is too large (max 10 MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImagePreview({ dataUrl: String(reader.result), name: file.name });
      reader.onerror = () => showNotice("Could not read that image.");
      reader.readAsDataURL(file);
    },
    [showNotice]
  );

  const onTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (input.trim() || imagePreview) && !aiBusy;

  return (
    <div className="page">
      <div className="chat">
        <header className="chat-header">
          <span className="dot on" />
          <h1>AI Assistant</h1>
          {aiBusy && (
            <span className="status busy">
              <span className="pulse" /> AI responding&hellip;
            </span>
          )}
        </header>

        {notice && (
          <div className="notice" role="alert">
            {notice}
            <button className="notice-x" onClick={() => showNotice("")} aria-label="Dismiss">
              &times;
            </button>
          </div>
        )}

        <div className="messages" ref={listRef}>
          {messages.map((m) =>
            m.role === "user" ? (
              <div className="row user" key={m.id}>
                <div className="bubble user-bubble">
                  {m.image && <img src={m.image} alt="Uploaded" className="msg-image" />}
                  {m.text && <div className="msg-text">{m.text}</div>}
                </div>
              </div>
            ) : (
              <div className="row ai" key={m.id}>
                <div className={`bubble ai-bubble${m.error ? " error" : ""}`}>
                  <div className="msg-text">{m.text}</div>
                </div>
              </div>
            )
          )}

          {aiBusy && (
            <div className="row ai">
              <div className="bubble ai-bubble thinking">
                <span className="thinking-text">AI is thinking</span>
                <span className="thinking-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {imagePreview && (
          <div className="preview-bar">
            <div className="preview-thumb">
              <img src={imagePreview.dataUrl} alt="Preview" />
              <button
                className="preview-remove"
                onClick={() => setImagePreview(null)}
                aria-label="Remove image"
                title="Remove image"
              >
                &times; Remove
              </button>
            </div>
          </div>
        )}

        <footer className="input-bar">
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            className="icon-btn"
            title="Attach image (JPG, PNG, WEBP)"
            aria-label="Attach image"
            onClick={() => fileRef.current?.click()}
          >
            &#x1F4CE;
          </button>

          <textarea
            ref={textareaRef}
            className="input"
            placeholder="Message AI…"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
            onKeyDown={onTextareaKeyDown}
          />

          <button
            className="icon-btn send"
            title="Send"
            aria-label="Send"
            onClick={handleSend}
            disabled={!canSend}
          >
            &#x27A4;
          </button>
        </footer>
      </div>
    </div>
  );
}
