"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestions?: string[]
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your Smart Energy AI Assistant. I can analyze your energy consumption patterns and provide personalized optimization strategies.\n\nAsk me questions like:\n• How can I save energy?\n• Why is my electricity bill high?\n• Which devices consume the most power?\n• What's my peak usage time?\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    const aiPlaceholderMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: "",
      timestamp: new Date(),
    }

    try {
      setMessages((prev) => [...prev, aiPlaceholderMessage])

      // Use enhanced API (two-step process)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiPlaceholderMessage.id ? { ...msg, content: "🔍 Gathering your energy data..." } : msg,
        ),
      )

      const response = await fetch("/api/chat-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.message) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiPlaceholderMessage.id ? { ...msg, content: data.message } : msg)),
        )
      } else {
        throw new Error("AI service returned no response")
      }
    } catch (error) {
      console.error("Error sending message to AI:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiPlaceholderMessage.id
            ? {
                ...msg,
                content: `❌ **Error**: ${errorMessage}\n\n💡 **Troubleshooting**:\n• Make sure your OpenAI API key is set\n• Check that the backend server is running\n• Try asking a simpler question\n\nPlease try again in a moment.`,
              }
            : msg,
        ),
      )
    } finally {
      setIsTyping(false)
    }
  }

  const quickActions = [
    "How can I save energy?",
    "What's my peak usage time?",
    "Show device performance",
    "Analyze my electricity bill",
  ]

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 
          rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-8 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl 
              border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Smart Energy AI</div>
                  <div className="text-xs opacity-90">Energy Optimization Assistant</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-xs ${message.type === "user" ? "order-2" : "order-1"}`}>
                    <div
                      className={`p-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                  </div>

                  <div className={`flex-shrink-0 ${message.type === "user" ? "order-1 mr-2" : "order-2 ml-2"}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === "user" ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-3">
                      <div className="text-sm text-gray-600">Analyzing your energy data...</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Quick Actions */}
              <div className="mb-3 flex flex-wrap gap-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(action)}
                    className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 
                      rounded-md transition-colors border border-blue-200"
                    disabled={isTyping}
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about energy optimization..."
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
