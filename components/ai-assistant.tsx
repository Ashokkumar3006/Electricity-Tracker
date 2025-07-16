"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"

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
        "Hello! I'm your Smart Energy AI Assistant. I can help you optimize your energy consumption, analyze device performance, and provide personalized recommendations. How can I assist you today?",
      timestamp: new Date(),
      suggestions: [
        "Analyze my AC usage",
        "How to reduce electricity bill?",
        "Best time to run washing machine",
        "Energy saving tips",
      ],
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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(input)
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const generateAIResponse = (userInput: string): Message => {
    const lowerInput = userInput.toLowerCase()

    let response = ""
    let suggestions: string[] = []

    if (lowerInput.includes("ac") || lowerInput.includes("air conditioner")) {
      response =
        "Based on your AC usage patterns, I recommend setting the temperature to 24°C for optimal efficiency. Your AC consumes the most energy during afternoon hours. Consider using a timer and ensuring proper insulation."
      suggestions = ["Show AC efficiency tips", "Compare AC costs", "Set AC schedule"]
    } else if (lowerInput.includes("bill") || lowerInput.includes("cost") || lowerInput.includes("reduce")) {
      response =
        "To reduce your electricity bill, focus on these high-impact areas: 1) Optimize AC usage (40% of consumption), 2) Use energy-efficient lighting, 3) Run appliances during off-peak hours, 4) Regular maintenance of devices."
      suggestions = ["Calculate potential savings", "Peak hour analysis", "Device efficiency report"]
    } else if (lowerInput.includes("washing machine") || lowerInput.includes("laundry")) {
      response =
        "Your washing machine is most efficient when run with full loads during off-peak hours (10 PM - 6 AM). Use cold water settings when possible - this can reduce energy consumption by up to 90%."
      suggestions = ["Optimal washing schedule", "Energy-efficient settings", "Load optimization tips"]
    } else if (lowerInput.includes("fridge") || lowerInput.includes("refrigerator")) {
      response =
        "Your refrigerator shows good efficiency at 87%. Keep temperature at 3-4°C, avoid overloading, and ensure door seals are tight. The current energy consumption is within optimal range."
      suggestions = ["Fridge maintenance tips", "Temperature optimization", "Energy usage analysis"]
    } else if (lowerInput.includes("fan")) {
      response =
        "Your fans are operating efficiently. Clean the blades regularly and use appropriate speed settings. Ceiling fans can help reduce AC load by 2-3°C, saving significant energy."
      suggestions = ["Fan maintenance guide", "AC + Fan combination tips", "Speed optimization"]
    } else if (lowerInput.includes("light") || lowerInput.includes("lighting")) {
      response =
        "Consider switching to LED bulbs if you haven't already. Use natural light during daytime and install motion sensors for automatic control. Smart lighting can reduce consumption by 20-30%."
      suggestions = ["LED upgrade calculator", "Smart lighting options", "Natural light optimization"]
    } else if (lowerInput.includes("peak") || lowerInput.includes("time")) {
      response =
        "Your peak usage is during evening hours (6-10 PM). Consider shifting heavy appliance usage to off-peak hours (10 PM - 6 AM) to reduce costs and grid load."
      suggestions = ["Peak hour schedule", "Off-peak appliance timing", "Load shifting guide"]
    } else {
      response =
        "I can help you with device-specific optimization, energy saving tips, bill reduction strategies, and usage pattern analysis. What specific aspect of your energy consumption would you like to explore?"
      suggestions = ["Device analysis", "Bill optimization", "Usage patterns", "Energy tips"]
    }

    return {
      id: Date.now().toString(),
      type: "ai",
      content: response,
      timestamp: new Date(),
      suggestions,
    }
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 
          rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: [
            "0 4px 20px rgba(59, 130, 246, 0.3)",
            "0 8px 30px rgba(59, 130, 246, 0.4)",
            "0 4px 20px rgba(59, 130, 246, 0.3)",
          ],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
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
                      <div className="text-sm">{message.content}</div>
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="mt-2 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 
                              text-blue-700 rounded-lg transition-colors border border-blue-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

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
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
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
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-1 mt-2">
                {["Energy tips", "Bill analysis", "Device help"].map((action) => (
                  <Badge
                    key={action}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 text-xs"
                    onClick={() => handleSuggestionClick(action)}
                  >
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
