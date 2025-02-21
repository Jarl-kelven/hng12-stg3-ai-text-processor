'use client';
import { useEffect, useState } from 'react';

export default function ChatTranslator() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isSupported, setIsSupported] = useState(true);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'tr', name: 'Turkey' },
    { code: 'ru', name: 'Russian' },
    { code: 'fr', name: 'French' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputText,
      detectedLang: '',
      confidence: 0,
      translations: {},
      showTranslation: false
    };

    try {
      const detector = await self.translation.createDetector();
      const detectionResult = await detector.detect(inputText.trim());
      const { detectedLanguage, confidence } = detectionResult[0];
      
      newMessage.detectedLang = languageTagToHumanReadable(detectedLanguage, 'en');
      newMessage.confidence = (confidence * 100).toFixed(1);
      
      setMessages(prev => [newMessage, ...prev]);
      setInputText('');
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  // Delete entire message
  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  // Clear specific translation
  const handleClearTranslation = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, translations: {}, showTranslation: false } 
        : msg
    ));
  };

  const handleTranslate = async (messageId) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, loading: true };
      }
      return msg;
    }));
  
    try {
      const message = messages.find(msg => msg.id === messageId);
      const detector = await self.translation.createDetector();
      const detectionResult = await detector.detect(message.text.trim());
      const sourceLang = detectionResult[0].detectedLanguage;
  
      // Check for same language first
      if (sourceLang === targetLanguage) {
        alert('⚠️ Source and target languages are the same!');
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, loading: false } : msg
        ));
        return; // Exit early
      }
  
      // Proceed with translation if languages are different
      const translator = await self.translation.createTranslator({
        sourceLanguage: sourceLang,
        targetLanguage
      });
  
      const translation = await translator.translate(message.text.trim());
  
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            translations: {
              ...msg.translations,
              [targetLanguage]: translation
            },
            showTranslation: true,
            loading: false
          };
        }
        return msg;
      }));
    } catch (error) {
      console.error('Translation error:', error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return { 
            ...msg, 
            loading: false,
            error: 'Translation failed. Please try another language pair.'
          };
        }
        return msg;
      }));
    }
  };
  const languageTagToHumanReadable = (languageTag, targetLanguage) => {
    const displayNames = new Intl.DisplayNames([targetLanguage], { type: 'language' });
    return displayNames.of(languageTag);
  };

  useEffect(() => {
    if (!('translation' in self) || !('createDetector' in self.translation)) {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported) {
    return <p className="text-red-500 p-4">Translation API is not supported on this browser.</p>;
  }

  return (
    <div className="flex flex-col h-screen">
    <header className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6 shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold">
        Welcome to the Ultimate Text Translator App!
      </h1>
    </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white p-4 rounded-lg shadow relative">
            {/* Delete Message Button */}
            <button
              onClick={() => handleDeleteMessage(message.id)}
              className="absolute text-4xl top-2 right-2 text-gray-400 hover:text-red-500"
              aria-label="Delete message"
            >
              ×
            </button>

            <div className="mb-2">
              <p className="text-blue-800">{message.text}</p>
              <p className="text-sm text-blue-800 mt-1">
                Detected: {message.detectedLang} ({message.confidence}% confidence)
              </p>
            </div>

            <div className="flex items-center gap-2 border-t pt-2">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="border text-blue-800 p-2 rounded flex-1"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              
              <button
                onClick={() => handleTranslate(message.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={message.loading}
              >
                {message.loading ? 'Translating...' : 'Translate'}
              </button>

              {/* Clear Translation Button */}
              {message.showTranslation && (
                <button
                  onClick={() => handleClearTranslation(message.id)}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300"
                  aria-label="Clear translation"
                >
                  Clear
                </button>
              )}
            </div>

            {message.showTranslation && message.translations[targetLanguage] && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="font-semibold text-blue-800">Translated to {languages.find(l => l.code === targetLanguage).name}:</p>
                <p className="text-blue-800">{message.translations[targetLanguage]}</p>
                {message.error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 rounded">
                    {message.error}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-black p-2 outline-blue-800 rounded resize-none"
            rows={2}
          />
          <button
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded hover:opacity-80 disabled:bg-gray-300"
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
      </form>
      
    </div>
  );
}