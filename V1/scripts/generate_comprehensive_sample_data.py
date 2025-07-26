import json
import random
from datetime import datetime, timedelta
import math

def generate_comprehensive_energy_data(
    start_date_str: str = "2024-07-01",
    num_days: int = 21,
    output_filename: str = "comprehensive-energy-data.json"
):
    """
    Generates comprehensive sample energy consumption data for multiple devices.
    All devices will have realistic activity patterns and power consumption.
    
    Args:
        start_date_str: Start date in 'YYYY-MM-DD' format
        num_days: Number of days to generate data for
        output_filename: Name of the JSON file to save the data
    """
    
    # Comprehensive device configurations with realistic power patterns
    devices = {
        "AC": {
            "base_power": 1200,
            "variance": 400,
            "active_hours": list(range(10, 23)),  # 10 AM to 11 PM
            "always_on_prob": 0.15,
            "seasonal_factor": 1.2,  # Higher in summer
            "efficiency_degradation": 0.98  # Slight efficiency loss over time
        },
        "Fridge": {
            "base_power": 120,
            "variance": 30,
            "active_hours": list(range(0, 24)),  # Always running
            "always_on_prob": 0.95,
            "seasonal_factor": 1.1,  # Slightly higher in summer
            "efficiency_degradation": 0.99
        },
        "Television": {
            "base_power": 85,
            "variance": 25,
            "active_hours": list(range(6, 8)) + list(range(17, 24)),  # Morning and evening
            "always_on_prob": 0.05,  # Standby mode
            "seasonal_factor": 1.0,
            "efficiency_degradation": 0.995
        },
        "Washing Machine": {
            "base_power": 450,
            "variance": 150,
            "active_hours": [8, 9, 10, 11, 18, 19, 20],  # Morning and evening cycles
            "always_on_prob": 0.02,
            "seasonal_factor": 1.0,
            "efficiency_degradation": 0.97
        },
        "Light": {
            "base_power": 35,
            "variance": 15,
            "active_hours": list(range(6, 9)) + list(range(17, 23)),  # Morning and evening
            "always_on_prob": 0.25,  # Some lights always on
            "seasonal_factor": 1.05,  # Slightly more in winter
            "efficiency_degradation": 0.999
        },
        "Fan": {
            "base_power": 55,
            "variance": 20,
            "active_hours": list(range(8, 24)),  # Day and evening
            "always_on_prob": 0.3,
            "seasonal_factor": 1.3,  # Much higher in summer
            "efficiency_degradation": 0.995
        },
        "Microwave": {
            "base_power": 800,
            "variance": 200,
            "active_hours": [7, 8, 12, 13, 19, 20, 21],  # Meal times
            "always_on_prob": 0.01,  # Mostly off, clock display
            "seasonal_factor": 1.0,
            "efficiency_degradation": 0.98
        },
        "Water Heater": {
            "base_power": 2000,
            "variance": 300,
            "active_hours": [6, 7, 8, 18, 19, 20, 21],  # Morning and evening
            "always_on_prob": 0.1,  # Maintaining temperature
            "seasonal_factor": 1.4,  # Much higher in winter
            "efficiency_degradation": 0.96
        },
        "Computer": {
            "base_power": 150,
            "variance": 50,
            "active_hours": list(range(9, 22)),  # Work and leisure hours
            "always_on_prob": 0.2,  # Sleep mode
            "seasonal_factor": 1.0,
            "efficiency_degradation": 0.99
        },
        "Router": {
            "base_power": 12,
            "variance": 3,
            "active_hours": list(range(0, 24)),  # Always on
            "always_on_prob": 0.98,
            "seasonal_factor": 1.0,
            "efficiency_degradation": 0.999
        },
        "Air Purifier": {
            "base_power": 45,
            "variance": 15,
            "active_hours": list(range(0, 24)),  # Can run all day
            "always_on_prob": 0.6,
            "seasonal_factor": 1.1,  # Higher during pollution season
            "efficiency_degradation": 0.98
        },
        "Dishwasher": {
            "base_power": 1200,
            "variance": 300,
            "active_hours": [21, 22, 23],  # Evening cleaning
            "always_on_prob": 0.02,
            "seasonal_factor": 1.0,
            "efficiency_degradation": 0.97
        }
    }

    all_records = []
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")

    print(f"Generating {num_days} days of comprehensive energy data starting from {start_date_str}...")
    print(f"Devices included: {', '.join(devices.keys())}")

    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        
        # Add some seasonal variation (summer = higher AC usage, winter = higher heating)
        season_factor = 1.0 + 0.3 * math.sin(2 * math.pi * day_offset / 365)
        
        # Weekend vs weekday patterns
        is_weekend = current_date.weekday() >= 5
        weekend_factor = 1.2 if is_weekend else 1.0
        
        for hour in range(24):
            current_time = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)
            
            # Time-of-day factors
            if 6 <= hour <= 9:  # Morning peak
                time_factor = 1.3
            elif 17 <= hour <= 22:  # Evening peak
                time_factor = 1.4
            elif 23 <= hour or hour <= 5:  # Night
                time_factor = 0.6
            else:  # Afternoon
                time_factor = 1.0

            for device_name, props in devices.items():
                # Calculate device activity probability
                base_activity_prob = 0.7 if hour in props["active_hours"] else 0.1
                
                # Apply various factors
                activity_prob = min(0.95, base_activity_prob * weekend_factor * time_factor)
                
                # Determine if device is active
                is_active = False
                if random.random() < props["always_on_prob"]:
                    is_active = True
                elif random.random() < activity_prob:
                    is_active = True
                
                # Calculate power consumption
                power = 0.0
                if is_active:
                    # Base power with variance
                    base_power = props["base_power"] + random.uniform(-props["variance"], props["variance"])
                    
                    # Apply seasonal factor
                    base_power *= props["seasonal_factor"] * season_factor
                    
                    # Apply time-based variations
                    base_power *= time_factor
                    
                    # Apply efficiency degradation over time
                    degradation_factor = props["efficiency_degradation"] ** (day_offset / 30)
                    base_power /= degradation_factor
                    
                    # Add some random fluctuation for realism
                    fluctuation = 1.0 + random.uniform(-0.1, 0.1)
                    power = max(0, base_power * fluctuation)
                    
                    # Special cases for certain devices
                    if device_name == "Washing Machine" and is_active:
                        # Washing machine has cycles - high power for washing, lower for spin
                        cycle_phase = random.choice(["wash", "rinse", "spin", "idle"])
                        if cycle_phase == "wash":
                            power *= 1.2
                        elif cycle_phase == "spin":
                            power *= 0.8
                        elif cycle_phase == "idle":
                            power *= 0.3
                    
                    elif device_name == "AC" and is_active:
                        # AC power varies with temperature difference
                        temp_factor = 1.0 + random.uniform(-0.2, 0.3)
                        power *= temp_factor
                    
                    elif device_name == "Water Heater" and is_active:
                        # Water heater cycles on/off to maintain temperature
                        if random.random() < 0.3:  # Heating cycle
                            power *= 1.0
                        else:  # Maintaining temperature
                            power *= 0.2
                
                else:
                    # Standby power for some devices
                    standby_powers = {
                        "Television": 3,
                        "Computer": 5,
                        "Microwave": 2,
                        "Washing Machine": 1,
                        "Dishwasher": 1,
                        "AC": 8
                    }
                    power = standby_powers.get(device_name, 0)

                # Calculate other electrical parameters
                voltage = round(random.uniform(220.0, 245.0), 2)
                current = round(power / voltage if voltage > 0 else 0.0, 3)
                electricity = round(power / 1000.0, 4)  # Convert Watts to kWh

                # Create record in the expected format
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
                    "t": int(current_time.timestamp() * 1000)  # Unix timestamp in milliseconds
                }
                all_records.append(record)

    # Sort records by timestamp for realistic data flow
    all_records.sort(key=lambda x: x["t"])

    # Save to file
    with open(output_filename, 'w') as f:
        json.dump(all_records, f, indent=2)

    # Generate summary statistics
    device_stats = {}
    for device_name in devices.keys():
        device_records = [r for r in all_records if r["result"]["device_name"] == device_name]
        total_energy = sum(r["result"]["electricity"] for r in device_records)
        avg_power = sum(r["result"]["power"] for r in device_records) / len(device_records)
        max_power = max(r["result"]["power"] for r in device_records)
        active_hours = sum(1 for r in device_records if r["result"]["switch"])
        
        device_stats[device_name] = {
            "total_records": len(device_records),
            "total_energy_kwh": round(total_energy, 2),
            "avg_power_w": round(avg_power, 2),
            "max_power_w": round(max_power, 2),
            "active_hours": active_hours,
            "activity_percentage": round((active_hours / len(device_records)) * 100, 1)
        }

    print(f"\n✅ Generated {len(all_records)} records and saved to {output_filename}")
    print(f"📊 Data Summary:")
    print(f"   • Total devices: {len(devices)}")
    print(f"   • Time period: {num_days} days")
    print(f"   • Records per device: {len(all_records) // len(devices)}")
    
    print(f"\n📈 Device Statistics:")
    for device, stats in device_stats.items():
        print(f"   • {device:15} | Energy: {stats['total_energy_kwh']:6.2f} kWh | "
              f"Avg: {stats['avg_power_w']:6.1f}W | Max: {stats['max_power_w']:6.1f}W | "
              f"Active: {stats['activity_percentage']:5.1f}%")
    
    total_energy = sum(stats['total_energy_kwh'] for stats in device_stats.values())
    print(f"\n🔋 Total System Energy Consumption: {total_energy:.2f} kWh")
    print(f"💰 Estimated Monthly Bill (₹5.5/kWh): ₹{total_energy * 5.5:.2f}")

def generate_quick_test_data():
    """Generate a smaller dataset for quick testing"""
    generate_comprehensive_energy_data(
        start_date_str="2024-07-20",
        num_days=3,
        output_filename="quick-test-data.json"
    )

def generate_full_month_data():
    """Generate a full month of data for comprehensive testing"""
    generate_comprehensive_energy_data(
        start_date_str="2024-07-01",
        num_days=30,
        output_filename="full-month-energy-data.json"
    )

if __name__ == "__main__":
    print("🚀 Comprehensive Energy Data Generator")
    print("=" * 50)
    
    # Generate different datasets
    print("\n1. Generating 21-day comprehensive dataset...")
    generate_comprehensive_energy_data()
    
    print("\n2. Generating quick test dataset (3 days)...")
    generate_quick_test_data()
    
    print("\n3. Generating full month dataset...")
    generate_full_month_data()
    
    print("\n✅ All datasets generated successfully!")
    print("\nFiles created:")
    print("• comprehensive-energy-data.json (21 days, 12 devices)")
    print("• quick-test-data.json (3 days, 12 devices)")
    print("• full-month-energy-data.json (30 days, 12 devices)")
    
    print("\n🎯 Usage Instructions:")
    print("1. Upload any of these files to the energy tracker")
    print("2. All devices will show realistic activity patterns")
    print("3. Set up device-specific thresholds for testing alerts")
    print("4. Monitor real-time device status and efficiency")
