"use client";
import { useState, useEffect, useRef } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  CpuChipIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/solid";

// pagesディレクトリでは "use client" は不要です

const Home: NextPage = () => {
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

  const startRecognition = () => {
    const SpeechRecognitionClass =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("お使いのブラウザは音声認識に対応していません");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
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

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "https://medical-bot-api-ghgpf6ghccdbhjcp.centralus-01.azurewebsites.net/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userInput,
            history: newMessages,
          }),
        }
      );
      if (!res.ok) throw new Error("AIからの応答取得に失敗しました。");
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      console.error("Error during chat:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "エラーが発生しました。時間をおいて再度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.nativeEvent as any).isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : "";

  return (
    <>
      <Head>
        <title>AI健康相談 (PoC)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* 画面全体のコンテナ */}
      <div className="w-full h-screen bg-white flex justify-center font-sans">

        {/* チャットUIのメインコンテナ */}
        <div className="w-full max-w-4xl h-full flex flex-col">

          {/* ヘッダー */}
          <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="病院ロゴ" className="h-10 w-auto" />
              <h1 className="text-xl font-semibold text-gray-800">AI健康相談 (PoC)</h1>
            </div>
          </header>
          
          {/* 注意書き */}
          <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 text-blue-800 p-3 text-sm text-center">
            <p>このAIは一般的な健康アドバイスを提供します。正確性は保証されません。症状がある場合は必ず医師の診察を受けてください。</p>
          </div>

          {/* チャットメッセージエリア */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* ... メッセージのmap処理 ... */}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                  {m.role === "user" ? (
                    <UserCircleIcon className="h-6 w-6 text-gray-500" />
                  ) : (
                    <CpuChipIcon className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div
                  className={`max-w-xl p-4 rounded-2xl text-base whitespace-pre-wrap shadow-md ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {/* ... ローディング表示 ... */}
            {isLoading && (
              <div className="flex items-start gap-3 flex-row">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="max-w-lg p-4 rounded-2xl text-sm bg-gray-200 text-gray-500 rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* 予約ボタン */}
          {/(人間ドック|健診)/.test(lastMessage) && (
            <div className="flex-shrink-0 p-4 text-center">
              <a
                href="https://www.tdhospital.jp/reservation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                健診・人間ドックを予約する
              </a>
            </div>
          )}

          {/* 入力フォームエリア */}
          <div className="flex-shrink-0 p-4 pt-2">
            <div className="relative">
              <textarea
                ref={inputRef}
                readOnly={isLoading}
                className="w-full resize-none bg-gray-100 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 p-4 pr-28 text-base text-gray-800 placeholder-gray-500"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "AIが回答中です..." : "メッセージを入力..."}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={startRecognition}
                  disabled={isLoading}
                  className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    isRecording ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-200"
                  }`}
                  title="音声入力"
                >
                  <MicrophoneIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 flex-shrink-0 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center justify-center transition-colors duration-200"
                  title="送信"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

        </div> {/* */}
      </div> {/* */}
    </>
  );
};

export default Home;