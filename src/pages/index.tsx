"use client";
import { useState, useEffect, useRef } from "react";
import { PaperAirplaneIcon, UserCircleIcon, CpuChipIcon, MicrophoneIcon } from "@heroicons/react/24/solid";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 音声認識開始
  const startRecognition = () => {
    const SpeechRecognitionClass = (() => {
      const w = window as unknown as {
        webkitSpeechRecognition?: { new (): ISpeechRecognition };
        SpeechRecognition?: { new (): ISpeechRecognition };
      };
      return w.webkitSpeechRecognition || w.SpeechRecognition;
    })();

    if (!SpeechRecognitionClass) {
      alert("お使いのブラウザは音声認識に対応していません");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: unknown) => {
      const e = event as {
        results: { 0: { 0: { transcript: string } } };
      };
      const transcript = e.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input;

    // 先に表示
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "/api/chat",
  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          history: newMessages,
        }),
      });
      if (!res.ok) throw new Error("AIからの応答取得に失敗しました。");
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      console.error("Error during chat:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "エラーが発生しました。時間をおいて再度お試しください。" },
      ]);
    } finally {
      setIsLoading(false);
      // フォーカスを戻す
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.nativeEvent as unknown as { isComposing: boolean }).isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : "";

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="病院ロゴ" className="h-14" />
          <span className="text-lg font-semibold text-gray-700">AI健康相談（PoC）</span>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 p-3 text-sm">
        このAIは健康に関する一般的なアドバイスを提供しますが、正確性を保証するものではありません。症状がある場合は必ず医師の診察を受けてください。
      </div>

      {/* チャットエリア */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                {m.role === "user" ? (
                  <UserCircleIcon className="h-6 w-6 text-slate-500" />
                ) : (
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div
                className={`max-w-lg p-3 rounded-lg text-sm whitespace-pre-wrap shadow-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 rounded-bl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <CpuChipIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="max-w-lg p-3 rounded-lg text-sm bg-slate-100 text-slate-400 rounded-bl-none shadow-sm">
                <span className="animate-pulse">考え中...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
        {/(人間ドック|健診)/.test(lastMessage) && (
          <div className="p-4">
            <a
              href="https://www.tdhospital.jp/reservation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              健診・人間ドックを予約する
            </a>
          </div>
        )}

        {/* 入力エリア */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2 p-1 border border-slate-300 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <textarea
              ref={inputRef}
              readOnly={isLoading}
              className="flex-1 resize-none bg-transparent focus:outline-none p-2"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "AIが回答中です..." : "メッセージを入力...(Shift+Enterで改行)"}
            />
            <button
              onClick={startRecognition}
              disabled={isLoading}
              className={`h-10 w-10 flex-shrink-0 rounded-md flex items-center justify-center transition-colors ${
                isRecording ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="音声入力"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 flex-shrink-0 bg-blue-600 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center justify-center transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}