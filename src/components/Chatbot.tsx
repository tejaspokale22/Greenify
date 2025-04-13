'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Image as ImageIcon, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callGeminiAPI } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const predefinedQuestions = [
  "How can I reduce food waste at home?",
  "What items can I recycle and how?",
  "How do I start composting?",
  "What are the best ways to reduce plastic waste?",
  "How can I properly dispose of electronic waste?"
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clearMessages = () => {
    setMessages([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const newMessage: Message = {
      role: 'user',
      content: selectedImage ? `[Image: ${selectedImage.name}]${input ? ` - ${input}` : ''}` : input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await callGeminiAPI(input, selectedImage || undefined);
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredefinedQuestion = (question: string) => {
    setInput(question);
    // Automatically send the message
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="p-4 text-white bg-gradient-to-r from-green-600 to-green-500 rounded-full shadow-lg transition-all cursor-pointer hover:shadow-xl hover:from-green-700 hover:to-green-600"
            aria-label="Open chat"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] h-[600px] flex flex-col shadow-2xl bg-white rounded-2xl border border-gray-200 overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 text-white bg-gradient-to-r from-green-600 to-green-500">
              <h3 className="text-lg font-semibold">Greenify AI Expert</h3>
              <div className="flex gap-2">
                <button
                  onClick={clearMessages}
                  className="p-2 rounded-full transition-colors cursor-pointer hover:bg-white/20"
                  aria-label="Clear messages"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full transition-colors cursor-pointer hover:bg-white/20"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-center text-gray-600">Try asking me about:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {predefinedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handlePredefinedQuestion(question)}
                        className="p-3 text-sm text-left bg-white rounded-lg border border-gray-200 transition-all cursor-pointer hover:border-green-500 hover:bg-green-50 hover:shadow-md"
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="block mt-1 text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-1">
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex flex-col gap-2">
                {selectedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 items-center p-2 bg-green-50 rounded-lg border border-green-200"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-700">
                      Image selected: {selectedImage.name}
                    </span>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="ml-auto text-green-600 hover:text-green-700"
                      title="Remove selected image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload image"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-600 transition-colors cursor-pointer hover:text-green-600"
                    aria-label="Upload image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2 text-base rounded-lg border border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="p-2 text-white bg-gradient-to-r from-green-600 to-green-500 rounded-lg transition-colors cursor-pointer hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 