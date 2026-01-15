import { useState, useRef, useEffect } from "react";
import { transcribeAudio } from "../utils/sarvamApi";

function ActiveListeningMode() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setTranscript("");
      setShowOptions(false);

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
          setIsProcessing(true);
          try {
            const { transcript: text } = await transcribeAudio(audioBlob, {
              mode: "transcribe",
              languageCode: "unknown",
            });
            setTranscript(text?.trim() || "");
            setShowOptions(true);
          } catch (error) {
            console.error("Sarvam STT error:", error);
            alert("Failed to transcribe audio. Please try again.");
          } finally {
            setIsProcessing(false);
          }
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/background_alternative_wavy.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.08,
        }}
      />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white border-2 border-[#000000] rounded-2xl shadow-[4px_4px_0px_0px_#000000] px-6 py-6 space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#000000] opacity-70">
              Mode
            </p>
            <h1
              className="text-2xl md:text-3xl font-bold text-[#000000]"
              style={{
                fontFamily: "TT Firs Neue, sans-serif",
                fontWeight: 700,
              }}
            >
              Active Listening
            </h1>
            <p className="text-sm text-[#000000] opacity-80 max-w-md mx-auto">
              Tap the mic to start capturing what&apos;s happening in the
              class. Pause and resume as needed, then mark it done to use the
              transcript.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <button
              onClick={() => {
                if (!isRecording) {
                  startRecording();
                }
              }}
              disabled={isRecording || isProcessing}
              className={`w-16 h-16 rounded-full border-2 border-[#000000] flex items-center justify-center shadow-[3px_3px_0px_0px_#000000] transition-all ${
                isRecording
                  ? "bg-red-500 cursor-not-allowed"
                  : isProcessing
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#FDE047] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000]"
              }`}
              aria-label="Start recording"
            >
              <svg
                className="w-7 h-7 text-[#000000]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-14 0M12 18v3m0 0H9m3 0h3"
                />
              </svg>
            </button>

            <p className="text-xs font-medium text-[#000000] opacity-80 text-center">
              {isProcessing
                ? "Processing your audio with Sarvam..."
                : isRecording && !isPaused
                ? "Listening... tap Pause or Done when ready."
                : isRecording && isPaused
                ? "Paused. Continue when you&apos;re ready."
                : "Ready to start. Your mic will be used only for this mode."}
            </p>

            {isRecording && (
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="px-3 py-1.5 text-xs font-bold bg-white border-2 border-[#000000] rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:bg-[#FDE047] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  {isPaused ? "Continue" : "Pause"}
                </button>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1.5 text-xs font-bold bg-[#F99DA8] border-2 border-[#000000] rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div className="border-t-2 border-dashed border-[#000000] pt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#000000] mb-1">
                Captured text
              </p>
              <div className="min-h-[80px] max-h-40 overflow-y-auto bg-[#F9FAFB] border-2 border-[#000000] rounded-lg px-3 py-2 text-xs text-[#000000]">
                {transcript
                  ? transcript
                  : "Your transcript will appear here after you tap Done."}
              </div>
            </div>

            {showOptions && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#000000]">
                  What would you like to use this for?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Feedback on teaching", color: "#F99DA8" },
                    { label: "Notes maker", color: "#DDC9FF" },
                    { label: "Topics covered till now", color: "#D4F1C5" },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="px-3 py-2 text-xs font-bold text-left border-2 border-[#000000] rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      style={{ backgroundColor: option.color }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#000000] opacity-70">
                  These options are placeholders for now. The transcript won&apos;t
                  be processed further until these features are implemented.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveListeningMode;

