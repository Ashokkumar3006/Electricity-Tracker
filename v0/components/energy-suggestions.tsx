"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Leaf, Zap, TrendingDown } from "lucide-react"

interface EnergySuggestionsProps {
  suggestions: string[]
}

export default function EnergySuggestions({ suggestions }: EnergySuggestionsProps) {
  const getRandomIcon = (index: number) => {
    const icons = [Lightbulb, Leaf, Zap, TrendingDown]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-5 w-5" />
  }

  const getRandomColor = (index: number) => {
    const colors = [
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-purple-100 text-purple-800 border-purple-200",
    ]
    return colors[index % colors.length]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Energy Saving Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md hover:translate-x-1 ${getRandomColor(index)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getRandomIcon(index)}</div>
                  <p className="text-sm font-medium leading-relaxed">{suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No suggestions available</p>
            <p className="text-sm">Upload energy data to get personalized energy saving tips</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
