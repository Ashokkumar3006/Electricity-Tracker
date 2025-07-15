
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
DEVICE_NAME      = "AC"
START_DATE       = "2025-07-15"
DAYS             = 7
INTERVAL_MINUTES = 60
OUT_FILE         = "sample_d.json"

def simulate_power(ts: datetime) -> int:
    hr = ts.hour
    if 10 <= hr <= 18:
        return random.randint(1200, 1600)
    elif 2 <= hr <= 5:
        return random.randint(150, 300)
    else:
        return random.randint(400, 800)

def main() -> None:
    start_time = datetime.fromisoformat(START_DATE)
    total_steps = (DAYS * 24 * 60) // INTERVAL_MINUTES
    step_delta = timedelta(minutes=INTERVAL_MINUTES)

    records = []
    for step in range(total_steps):
        ts = start_time + step * step_delta
        power     = simulate_power(ts)
        voltage   = round(random.uniform(228, 242), 1)
        current   = round(power / voltage, 2)
        electricity = round(power / 1000.0 * (INTERVAL_MINUTES / 60), 3)

        records.append({
            "result": {
                "device_name": DEVICE_NAME,
                "power": power,
                "voltage": voltage,
                "current": current,
                "electricity": electricity,
                "switch": True,
                "update_time": ts.strftime("%Y-%m-%dT%H:%M:%SZ")
            },
            "success": True,
            "t": int(ts.timestamp() * 1000)
        })

    Path(OUT_FILE).write_text(json.dumps(records, indent=2))
    print(f"✅ Generated {len(records):,} samples → {OUT_FILE}")

if __name__ == "__main__":
    main()
