"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [targetLang, setTargetLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const supportedLangs = [
    { code: "en", name: "English" },
    { code: "pt", name: "Portuguese" },
    { code: "es", name: "Spanish" },
    { code: "ru", name: "Russian" },
    { code: "tr", name: "Turkish" },
    { code: "fr", name: "French" },
  ];

  const handleSend = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text");
      return;
    }

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
    };

    try {
      setLoading(true);
      setError("");

      if (!window.ai || !window.ai.languageDetection) {
        setError("Language detection service is unavailable.");
        setLoading(false);
        return;
      }

      const detectedLang = await window.ai.languageDetection.detect(inputText);
      newMessage.detectedLang = detectedLang[0]?.language;

      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
    } catch (err) {
      setError(err?.message || "Failed to detect language");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (messageId) => {
    try {
      setLoading(true);
      setError("");

      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const message = messages[messageIndex];

      const translation = await window.ai.translator.translate({
        text: message.text,
        targetLang,
        sourceLang: message.detectedLang,
      });

      const updatedMessages = [...messages];
      updatedMessages[messageIndex].translation = translation;
      updatedMessages[messageIndex].targetLang = targetLang;
      setMessages(updatedMessages);
    } catch (err) {
      setError(err?.message || "Translation failed. Language pair may not be supported.");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white p-4 rounded-lg shadow relative w-1/3">
            <p className="text-gray-500 text-xs absolute top-2 right-2">
              {message.detectedLang ? `Detected language: ${message.detectedLang}` : ""}
            </p>
            <p className="text-gray-800 text-lg font-semibold mb-2">{message.text}</p>
            <div className="flex items-center gap-2">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="border p-2 rounded"
                disabled={loading}
              >
                {supportedLangs.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <button
                onClick={() => handleTranslate(message.id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
                disabled={loading}
              >
                Translate
              </button>
            </div>
            {message.translation && (
              <div className="mt-2 p-2 bg-green-50 rounded">
                <p className="text-black">{message.translation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t flex gap-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your text..."
          className="flex-1 text-black p-2 border rounded resize-none"
          rows={3}
          disabled={loading}
          aria-label="Input text"
        />
        <button
          onClick={handleSend}
          className="bg-purple-500 text-white p-4 rounded hover:bg-purple-600 disabled:bg-gray-300"
          disabled={loading}
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      {error && <div className="p-2 bg-red-100 text-red-700 rounded text-center">{error}</div>}
    </div>
  );
}
