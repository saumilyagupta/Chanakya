import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { transcribeAudio, textToSpeechAndPlay } from "../utils/sarvamApi";

function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechSynthesisRef = useRef(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [chatHistory] = useState([
    { id: 1, title: "Trigonometry explanation", date: "Today" },
    { id: 2, title: "Active listening techniques", date: "Yesterday" },
    { id: 3, title: "Class activity ideas", date: "Jan 10" },
    { id: 4, title: "Student engagement tips", date: "Jan 9" },
  ]);

  // Hide header on chat page
  useEffect(() => {
    document.body.classList.add("chat-page");
    return () => document.body.classList.remove("chat-page");
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Skip scroll if textarea is focused to prevent unwanted jumps
    const activeElement = document.activeElement;
    const isTextareaFocused = activeElement?.tagName === "TEXTAREA";

    if (!isTextareaFocused) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((m) => [
      ...m,
      { id: Date.now(), from: "teacher", text: userMessage },
    ]);
    setInput("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const botMessageId = Date.now() + 1;
      // const botResponse =
      //   "Try a simple activity: ask students to estimate the height of a tree using its shadow and a ruler.";
      const botResponse =
        "एक सोपी कृती करून पहा: विद्यार्थ्यांना झाडाची सावली आणि रुलर वापरून त्याची उंची मोजण्यास सांगा";
      setMessages((m) => [
        ...m,
        {
          id: botMessageId,
          from: "bot",
          text: botResponse,
        },
      ]);
      setIsLoading(false);

      // Automatically speak the bot response
      setTimeout(() => {
        speakText(botResponse, botMessageId);
      }, 100);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  };

  // Start voice recording - using only Sarvam AI
  const startRecording = async () => {
    try {
      // Clear input field when starting new recording
      setInput("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        if (audioChunksRef.current.length > 0) {
          setIsProcessingVoice(true);
          try {
            const { transcript } = await transcribeAudio(audioBlob, {
              mode: "transcribe",
              languageCode: "unknown",
            });
            if (transcript) {
              setInput(transcript.trim());
            }
          } catch (error) {
            console.error("Sarvam STT error:", error);
            alert("Failed to transcribe audio. Please try again.");
          } finally {
            setIsProcessingVoice(false);
          }
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Text-to-Speech handler
  const speakText = async (text, messageId) => {
    // Stop any currently speaking message
    if (speechSynthesisRef.current) {
      if (speechSynthesisRef.current instanceof Audio) {
        speechSynthesisRef.current.pause();
        speechSynthesisRef.current.currentTime = 0;
      }
      speechSynthesisRef.current = null;
    }

    try {
      const audio = await textToSpeechAndPlay(text, {
        onPlay: () => setSpeakingMessageId(messageId),
        onEnd: () => {
          setSpeakingMessageId(null);
          speechSynthesisRef.current = null;
        },
      });
      speechSynthesisRef.current = audio;
    } catch (error) {
      console.error("TTS error:", error);
      alert(`Failed to generate speech: ${error.message}`);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      if (speechSynthesisRef.current instanceof Audio) {
        speechSynthesisRef.current.pause();
        speechSynthesisRef.current = null;
      } else {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      speechSynthesisRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        if (speechSynthesisRef.current instanceof Audio) {
          speechSynthesisRef.current.pause();
        }
      }
    };
  }, [isRecording]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex relative overflow-hidden">
      {/* Background Image with very low opacity */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/background_alternative_wavy.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.1,
        }}
      />

      <div className="relative z-10 flex w-full">
        {/* Sidebar - Chat History */}
        <aside className="hidden md:flex flex-col w-64 bg-[#FFFFFF] border-r-2 border-[#000000]">
          {/* Sidebar Header */}
          <div className="p-4 border-b-2 border-[#000000]">
            <Link
              to="/"
              className="flex items-center gap-3 text-[#000000] hover:opacity-80 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-base font-bold">Chanakya</span>
            </Link>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b-2 border-[#000000]">
            <button
              className="w-full bg-[#E0EEEF] border-2 border-[#000000] px-4 py-2 font-bold text-[#000000] shadow-[2px_2px_0px_0px_#000000] hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              onClick={() => setMessages([])}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-bold text-[#000000] mb-3 px-2">
              Recent Chats
            </div>
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full text-left p-3 rounded-lg border-2 border-[#000000] bg-white hover:bg-[#FDE047] transition-all shadow-[2px_2px_0px_0px_#000000] hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E8D5FF] border-2 border-[#000000] flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-[#000000]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#000000] truncate">
                        {chat.title}
                      </div>
                      <div className="text-xs text-[#000000] opacity-60 mt-1">
                        {chat.date}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-h-screen bg-[#FFFFFF]">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b-2 border-[#000000] bg-[#FFFFFF]">
            <Link to="/" className="text-lg font-bold text-[#000000]">
              Chanakya
            </Link>
            <button
              onClick={() => setMessages([])}
              className="p-2 border-2 border-[#000000] rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
                <div>
                  <img
                    src="/happy_chanakya.png"
                    alt="Chanakya"
                    className="w-64 h-64 md:w-96 md:h-96 object-contain"
                  />
                </div>

                <div className="text-center mb-8">
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[#000000] mb-3"
                    style={{
                      fontFamily: "TT Firs Neue, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    How can I help you today, {user?.name || "Teacher"}?
                  </h2>
                </div>

                {/* Feature Mode Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    {
                      name: "Crisis-Handling Mode",
                      color: "#F99DA8",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      ),
                    },
                    {
                      name: "Activity Generator",
                      color: "#FDE047",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      ),
                    },
                    {
                      name: "Module Creator",
                      color: "#D4F1C5",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      ),
                    },
                    {
                      name: "Post-class Planner",
                      color: "#E8D5FF",
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                      ),
                    },
                  ].map((feature) => (
                    <button
                      key={feature.name}
                      className="p-4 rounded-lg border-2 border-[#000000] text-left transition-all shadow-[2px_2px_0px_0px_#000000] hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5"
                      style={{ backgroundColor: feature.color }}
                      onClick={() => setInput(`Activate ${feature.name}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[#000000]">{feature.icon}</div>
                        <span className="text-sm font-bold text-[#000000]">
                          {feature.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.from === "teacher"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.from === "bot" && (
                      <div className="w-8 h-8 rounded-full bg-[#FDE047] border-2 border-[#000000] flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-[#000000]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-lg border-2 border-[#000000] ${
                        message.from === "teacher"
                          ? "bg-[#FDE047] text-[#000000]"
                          : "bg-[#DDD6FE] text-[#000000]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap flex-1">
                          {message.text}
                        </p>
                        {message.from === "bot" && (
                          <button
                            onClick={() => {
                              if (speakingMessageId === message.id) {
                                stopSpeaking();
                              } else {
                                speakText(message.text, message.id);
                              }
                            }}
                            className="p-1.5 border border-[#000000] rounded bg-white hover:bg-[#FDE047] transition-all flex-shrink-0"
                            title={
                              speakingMessageId === message.id
                                ? "Stop speaking"
                                : "Listen to response"
                            }
                            aria-label="Voice output"
                          >
                            {speakingMessageId === message.id ? (
                              <svg
                                className="w-4 h-4 text-[#000000]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-[#000000]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {message.from === "teacher" && (
                      <div className="w-8 h-8 rounded-full bg-[#E8D5FF] border-2 border-[#000000] flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-[#000000]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-[#FDE047] border-2 border-[#000000] flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-[#000000] animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    <div className="bg-[#DDD6FE] border-2 border-[#000000] px-4 py-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#000000] rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-[#000000] rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="w-2 h-2 bg-[#000000] rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-[#000000] bg-[#FFFFFF] px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 border-2 border-[#000000] rounded-lg px-3 py-3 bg-white shadow-[2px_2px_0px_0px_#000000]">
                <button
                  className="p-1.5 border-2 border-[#000000] rounded bg-white hover:bg-[#FDE047] transition-all flex-shrink-0"
                  title="Attach file"
                  aria-label="Attach file"
                >
                  <svg
                    className="w-4 h-4 text-[#000000]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else if (!isProcessingVoice) {
                      startRecording();
                    }
                  }}
                  disabled={isProcessingVoice}
                  className={`p-1.5 border-2 border-[#000000] rounded transition-all flex-shrink-0 ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : isProcessingVoice
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-white hover:bg-[#FDE047]"
                  }`}
                  title={
                    isRecording
                      ? "Click to stop recording"
                      : "Click to record voice"
                  }
                  aria-label="Voice input"
                >
                  {isProcessingVoice ? (
                    <svg
                      className="w-4 h-4 text-[#000000] animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-[#000000]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </button>
                <textarea
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Message Chanakya..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm md:text-base text-[#000000] placeholder-gray-500 focus:outline-none resize-none overflow-y-auto"
                  style={{ minHeight: "24px", maxHeight: "128px" }}
                  aria-label="Message input"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!input.trim() || isLoading}
                  className="p-2 border-2 border-[#000000] rounded bg-[#FDE047] text-[#000000] font-bold hover:bg-[#FDE047] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex-shrink-0"
                  title="Send message"
                  aria-label="Send message"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
              <p className="text-xs text-[#000000] opacity-60 mt-2 text-center">
                Chanakya can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ChatInterface;
