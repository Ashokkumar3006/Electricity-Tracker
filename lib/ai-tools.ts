import { tool } from "ai"
import { z } from "zod"

const API_BASE = "http://localhost:5000/api"

// Tool for Usage Analyzer Agent
export const getEnergyUsageSummary = tool({
  description:
    "Analyzes the user's overall energy usage patterns, including peak usage hours and total consumption across different time periods (morning, afternoon, evening, night). This helps identify when and how much energy is being consumed.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${API_BASE}/peak`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching energy usage summary:", error)
      return {
        error: `Failed to fetch energy usage summary: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

// Tool for Device Optimizer Agent
export const getDeviceConsumptionData = tool({
  description:
    "Retrieves detailed energy consumption data for all smart devices, including current power, total energy, peak usage, and efficiency. This helps identify high-energy-consuming devices and potential idle loads.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${API_BASE}/devices`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching device consumption data:", error)
      return {
        error: `Failed to fetch device consumption data: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

// Tool for Tariff Mapper & Bill Predictor Agent
export const getPredictedBillAndTariff = tool({
  description:
    "Forecasts the end-of-month electricity bill based on current consumption patterns and applies tiered unit costs according to local billing rules (TNEB LT-1A tariff). This also provides a slab-wise breakdown.",
  parameters: z.object({}), // Backend handles prediction based on loaded data
  execute: async () => {
    try {
      const response = await fetch(`${API_BASE}/predict`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching predicted bill and tariff data:", error)
      return {
        error: `Failed to fetch predicted bill and tariff data: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

// Tool for Energy Saver Advisor Agent (to get device-specific details for tailored advice)
export const getSpecificDeviceDetails = tool({
  description:
    "Retrieves granular details for a specific smart device, including its hourly and daily usage patterns, efficiency, and any specific suggestions generated by the backend. Useful for providing targeted optimization advice.",
  parameters: z.object({
    deviceName: z
      .string()
      .describe(
        "The exact name of the device (e.g., 'AC', 'Fridge', 'Television', 'Light', 'Fan', 'Washing Machine').",
      ),
  }),
  execute: async ({ deviceName }) => {
    try {
      const response = await fetch(`${API_BASE}/device/${deviceName}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error fetching details for device ${deviceName}:`, error)
      return {
        error: `Failed to fetch details for ${deviceName}: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

// Tool for general energy saving suggestions (can be used by Energy Saver Advisor Agent)
export const getGeneralEnergySuggestions = tool({
  description:
    "Fetches general energy-saving suggestions and tips from the system based on overall patterns. This can complement AI-generated advice.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${API_BASE}/suggestions`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching general energy suggestions:", error)
      return {
        error: `Failed to fetch general energy suggestions: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

export const getWeatherData = tool({
  description:
    "Fetches current weather data for a specified city, including temperature, condition, and humidity. This can help in providing context-aware energy-saving suggestions, especially for heating or cooling.",
  parameters: z.object({
    city: z
      .string()
      .describe("The name of the city for which to get weather data (e.g., 'Chennai', 'Delhi', 'Mumbai')."),
  }),
  execute: async ({ city }) => {
    try {
      const response = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error fetching weather data for ${city}:`, error)
      return {
        error: `Failed to fetch weather data for ${city}: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})
