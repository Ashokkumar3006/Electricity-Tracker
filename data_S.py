import json
import random
from datetime import datetime, timedelta

def generate_energy_data(
    start_date_str: str,
    num_days: int,
    output_filename: str = "sample-energy-data.json"
):
    """
    Generates sample energy consumption data for multiple devices over a period.

    Args:
        start_date_str: Start date in 'YYYY-MM-DD' format.
        num_days: Number of days to generate data for.
        output_filename: Name of the JSON file to save the data.
    """
    devices = {
        "AC": {"base_power": 1500, "variance": 500, "active_hours": range(10, 23), "always_on_prob": 0.1},
        "Fridge": {"base_power": 150, "variance": 50, "active_hours": range(0, 24), "always_on_prob": 0.95},
        "Television": {"base_power": 100, "variance": 30, "active_hours": range(17, 23), "always_on_prob": 0.2},
        "Light": {"base_power": 40, "variance": 10, "active_hours": list(range(18, 24)) + list(range(0, 6)), "always_on_prob": 0.3},
        "Fan": {"base_power": 60, "variance": 20, "active_hours": range(10, 24), "always_on_prob": 0.4},
        "Washing Machine": {"base_power": 500, "variance": 100, "active_hours": [9, 10, 11, 18, 19], "always_on_prob": 0.05},
    }

    all_records = []
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")

    print(f"Generating {num_days} days of data starting from {start_date_str}...")

    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        for hour in range(24):
            current_time = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)

            for device_name, props in devices.items():
                # Simulate device activity
                is_active = False
                if random.random() < props["always_on_prob"]: # Chance to be always on (e.g., fridge)
                    is_active = True
                elif hour in props["active_hours"]: # Active during specific hours
                    is_active = random.random() < 0.7 # 70% chance to be on during active hours
                else:
                    is_active = random.random() < 0.1 # Small chance to be on during inactive hours (standby)

                power = 0.0
                if is_active:
                    power = max(0, props["base_power"] + random.uniform(-props["variance"], props["variance"]))
                    # Add some hourly variation for devices like AC/Fridge
                    if device_name in ["AC", "Fridge"]:
                        power *= (0.8 + random.random() * 0.4) # Vary by +/- 20%

                voltage = round(random.uniform(220.0, 245.0), 2)
                current = round(power / voltage if voltage > 0 else 0.0, 2)
                electricity = round(power / 1000.0, 3) # Convert Watts to kWh

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
                    "t": int(current_time.timestamp() * 1000) # Unix timestamp in milliseconds
                }
                all_records.append(record)

    with open(output_filename, 'w') as f:
        json.dump(all_records, f, indent=2)

    print(f"Generated {len(all_records)} records and saved to {output_filename}")

# --- How to use the function ---
if __name__ == "__main__":
    # Generate 21 days of data starting from July 1, 2024
    generate_energy_data(start_date_str="2024-07-01", num_days=21, output_filename="sample-energy-data-21-days.json")

    # You can generate a smaller file for quick testing too
    # generate_energy_data(start_date_str="2024-07-15", num_days=2, output_filename="sample-energy-data-2-days.json")
