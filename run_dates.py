import anthropic
import argparse
import datetime

MODEL_MAP = {
    "low": "claude-haiku-4-5",
    "med": "claude-sonnet-4-6",
    "high": "claude-opus-4-6",
}

parser = argparse.ArgumentParser()
parser.add_argument("--api-key", help="Anthropic API key (defaults to ANTHROPIC_API_KEY env var)")
parser.add_argument("--model", choices=["low", "med", "high"], default="high",
                    help="Model tier: low=haiku, med=sonnet, high=opus (default: high)")
parser.add_argument("--start_date", required=True,
                    help="Start date in YYYY-MM-DD format (e.g. 2026-01-01)")
parser.add_argument("--end_date", required=True,
                    help="End date in YYYY-MM-DD format (e.g. 2026-12-31)")
args = parser.parse_args()

model = MODEL_MAP[args.model]

try:
    start = datetime.date.fromisoformat(args.start_date)
    end = datetime.date.fromisoformat(args.end_date)
except ValueError as e:
    parser.error(f"Invalid date format: {e}")

if end < start:
    parser.error("--end_date must be on or after --start_date")

client = anthropic.Anthropic(api_key=args.api_key) if args.api_key else anthropic.Anthropic()

# Read prompt template from prompt.txt
with open("prompt.txt", "r") as f:
    prompt_template = f.read().strip()

THINKING_SUPPORTED = {"claude-sonnet-4-6", "claude-opus-4-6"}

def call_api(date_str):
    kwargs = {"thinking": {"type": "adaptive"}} if model in THINKING_SUPPORTED else {}
    with client.messages.stream(
        model=model,
        max_tokens=16000,
        system=[{"type": "text", "text": prompt_template, "cache_control": {"type": "ephemeral"}}],
        **kwargs,
        messages=[{"role": "user", "content": f"Date: {date_str}"}],
    ) as stream:
        response = stream.get_final_message()
    for block in response.content:
        if block.type == "text":
            return block.text
    return ""


timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
results_file = f"results_{timestamp}.txt"

with open(results_file, "w") as f:
    f.write("---- prompt ----\n")
    f.write(prompt_template + "\n")
    f.write("----- results ------\n")
    f.write(f"start date: {args.start_date}\n")
    f.write(f"end date: {args.end_date}\n\n")

delta = datetime.timedelta(days=1)
current = start
while current <= end:
    date_str = current.strftime("%B %d, %Y")
    print(f"Processing {date_str}...")

    text = call_api(date_str)
    one_line = text.replace("\n", " ").strip()

    print(f"{date_str}: {one_line}\n")

    with open(results_file, "a") as f:
        f.write(f"{date_str}: {one_line}\n")

    current += delta

print("Done!")
