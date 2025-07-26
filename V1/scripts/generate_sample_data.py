import json
import random
from datetime import datetime, timedelta
import math

def generate_energy_data(
    start_date_str: str,
    num_days: int,
    output_filename: str = "sample-energy-data.json"
):
    """
    Generates sample energy consumption data for multiple devices over a period.
    All devices will be active with realistic consumption patterns.

    Args:
        start_date_str: Start date in 'YYYY-MM-DD' format.
        num_days: Number of days to generate data for.
        output_filename: Name of the JSON file to save the data.
    """
    # Enhanced device configurations - all devices active
    devices = {
        "AC": {
            "base_power": 1500, 
            "variance": 500, 
            "active_hours": list(range(10, 23)), 
            "always_on_prob": 0.2,
            "peak_hours": [14, 15, 16, 17, 18]  # Hottest part of day
        },
        "Fridge": {
            "base_power": 150, 
            "variance": 50, 
            "active_hours": list(range(0, 24)), 
            "always_on_prob": 0.95,
            "peak_hours": [13, 14, 15, 19, 20]  # After shopping/cooking
        },
        "Television": {
            "base_power": 100, 
            "variance": 30, 
            "active_hours": list(range(6, 8)) + list(range(17, 24)), 
            "always_on_prob": 0.1,
            "peak_hours": [19, 20, 21, 22]  # Prime time
        },
        "Light": {
            "base_power": 40, 
            "variance": 15, 
            "active_hours": list(range(6, 9)) + list(range(17, 24)), 
            "always_on_prob": 0.3,
            "peak_hours": [18, 19, 20, 21]  # Evening hours
        },
        "Fan": {
            "base_power": 60, 
            "variance": 20, 
            "active_hours": list(range(8, 24)), 
            "always_on_prob": 0.4,
            "peak_hours": [12, 13, 14, 15, 16]  # Hot afternoon
        },
        "Washing Machine": {
            "base_power": 500, 
            "variance": 150, 
            "active_hours": [8, 9, 10, 11, 18, 19, 20], 
            "always_on_prob": 0.05,
            "peak_hours": [9, 10, 19, 20]  # Morning and evening cycles
        },
        "Microwave": {
            "base_power": 800,
            "variance": 200,
            "active_hours": [7, 8, 12, 13, 19, 20, 21],
            "always_on_prob": 0.02,
            "peak_hours": [8, 13, 20]  # Meal times
        },
        "Water Heater": {
            "base_power": 2000,
            "variance": 400,
            "active_hours": [6, 7, 8, 18, 19, 20, 21],
            "always_on_prob": 0.15,
            "peak_hours": [7, 8, 19, 20]  # Bath times
        },
        "Computer": {
            "base_power": 120,
            "variance": 40,
            "active_hours": list(range(9, 22)),
            "always_on_prob": 0.25,
            "peak_hours": [10, 11, 14, 15, 20, 21]  # Work hours
        },
        "Router": {
            "base_power": 15,
            "variance": 5,
            "active_hours": list(range(0, 24)),
            "always_on_prob": 0.98,
            "peak_hours": [19, 20, 21, 22]  # Heavy internet usage
        }
    }

    all_records = []
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")

    print(f"Generating {num_days} days of data starting from {start_date_str}...")
    print(f"Active devices: {', '.join(devices.keys())}")

    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        
        # Weekend factor - more usage on weekends
        is_weekend = current_date.weekday() >= 5
        weekend_multiplier = 1.3 if is_weekend else 1.0
        
        for hour in range(24):
            current_time = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)

            for device_name, props in devices.items():
                # Determine if device is active
                is_active = False
                
                # Always on probability (for devices like fridge, router)
                if random.random() < props["always_on_prob"]:
                    is_active = True
                # Active during specific hours with higher probability
                elif hour in props["active_hours"]:
                    base_prob = 0.7
                    # Peak hours have even higher probability
                    if hour in props.get("peak_hours", []):
                        base_prob = 0.9
                    
                    if random.random() < base_prob * weekend_multiplier:
                        is_active = True
                # Small chance to be on during inactive hours (standby/unexpected usage)
                else:
                    if random.random() < 0.05:
                        is_active = True

                # Calculate power consumption
                power = 0.0
                if is_active:
                    base_power = props["base_power"]
                    variance = props["variance"]
                    
                    # Add variance
                    power = base_power + random.uniform(-variance, variance)
                    
                    # Peak hour boost
                    if hour in props.get("peak_hours", []):
                        power *= random.uniform(1.1, 1.3)
                    
                    # Weekend usage pattern
                    power *= weekend_multiplier
                    
                    # Add some hourly variation for realism
                    hourly_factor = 0.8 + random.random() * 0.4  # 0.8 to 1.2
                    power *= hourly_factor
                    
                    # Ensure minimum power when active
                    power = max(power, props["base_power"] * 0.3)
                else:
                    # Standby power for some devices
                    standby_power = {
                        "Television": 3,
                        "Computer": 5,
                        "Microwave": 2,
                        "AC": 8,
                        "Router": 12  # Router always consumes some power
                    }
                    power = standby_power.get(device_name, 0)

                # Ensure power is not negative
                power = max(0, power)

                # Calculate electrical parameters
                voltage = round(random.uniform(220.0, 245.0), 2)
                current = round(power / voltage if voltage > 0 else 0.0, 2)
                electricity = round(power / 1000.0, 3)  # Convert Watts to kWh

                record = {
                    "success": True,
                    "result": {
                        "device_name": device_name,
                        "power": round(power, 2),
                        "voltage": voltage,
                        "current": current,
                        "electricity": electricity,
                        "switch": is_active,
                        "update_time": current_time.isoformat(timespec='seconds') + 'Z'
                    },
                    "t": int(current_time.timestamp() * 1000)
                }
                all_records.append(record)

    # Sort by timestamp
    all_records.sort(key=lambda x: x["t"])

    with open(output_filename, 'w') as f:
        json.dump(all_records, f, indent=2)

    # Print statistics
    print(f"Generated {len(all_records)} records and saved to {output_filename}")
    
    # Device activity summary
    print("\nDevice Activity Summary:")
    for device_name in devices.keys():
        device_records = [r for r in all_records if r["result"]["device_name"] == device_name]
        active_count = sum(1 for r in device_records if r["result"]["switch"])
        activity_rate = (active_count / len(device_records)) * 100
        avg_power = sum(r["result"]["power"] for r in device_records) / len(device_records)
        max_power = max(r["result"]["power"] for r in device_records)
        
        print(f"  {device_name:15} | Active: {activity_rate:5.1f}% | "
              f"Avg: {avg_power:6.1f}W | Max: {max_power:6.1f}W")

# Generate different datasets
if __name__ == "__main__":
    print("🔋 Enhanced Energy Data Generator")
    print("=" * 40)
    
    # Generate 21 days of data starting from July 1, 2024
    generate_energy_data(
        start_date_str="2024-07-01", 
        num_days=21, 
        output_filename="sample-energy-data-21-days.json"
    )
    
    # Generate a smaller dataset for quick testing
    generate_energy_data(
        start_date_str="2024-07-15", 
        num_days=7, 
        output_filename="sample-energy-data-7-days.json"
    )
    
    # Generate current month data
    current_date = datetime.now()
    first_day = current_date.replace(day=1)
    generate_energy_data(
        start_date_str=first_day.strftime("%Y-%m-%d"),
        num_days=30,
        output_filename="current-month-energy-data.json"
    )
    
    print("\n✅ All datasets generated successfully!")
    print("\nFiles created:")
    print("• sample-energy-data-21-days.json (21 days, 10 active devices)")
    print("• sample-energy-data-7-days.json (7 days, 10 active devices)")
    print("• current-month-energy-data.json (30 days, 10 active devices)")
