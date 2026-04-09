import os
import json
from groq import Groq

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

_client = None

SYSTEM_PROMPT = (
    "You are an AI cybersecurity analyst assistant integrated into an LLM-Powered "
    "Log Forensic Investigator dashboard. You help security professionals analyze logs, "
    "detect threats, and respond to incidents. Always remember and reference prior messages "
    "in the conversation to give contextually accurate, coherent responses."
)


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY environment variable is not set")
    _client = Groq(api_key=GROQ_API_KEY)
    return _client


def _chat(prompt: str) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def _chat_with_history(question: str, history: list[dict]) -> str:
    """Send a message with full conversation history for context-aware responses."""
    client = _get_client()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            messages.append({"role": "user", "content": content})
        elif role in ("ai", "assistant"):
            messages.append({"role": "assistant", "content": content})

    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def analyze_event(event_data: dict) -> dict:
    prompt = f"""You are a cybersecurity expert. Analyze the following security event:

{json.dumps(event_data, indent=2)}

Respond ONLY with a JSON object (no markdown, no code blocks) with exactly these fields:
{{
  "explanation": "<detailed explanation of what happened>",
  "attack_type": "<name of attack type>",
  "risk_level": "<low|medium|high|critical>",
  "why_dangerous": "<why this is dangerous>",
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"]
}}"""

    text = _chat(prompt).strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def investigate_sequence(logs: list[dict]) -> dict:
    sample = logs[:50] if len(logs) > 50 else logs
    prompt = f"""You are a cybersecurity forensic expert. Analyze the following sequence of security log events:

{json.dumps(sample, indent=2)}

Identify the attack flow, root cause, and attacker intent.
Respond ONLY with a JSON object (no markdown, no code blocks) with exactly these fields:
{{
  "attack_flow": "<step-by-step description of the attack>",
  "root_cause": "<root cause of the incident>",
  "attacker_intent": "<what the attacker was trying to achieve>",
  "affected_systems": ["<system 1>", "<system 2>"],
  "severity": "<low|medium|high|critical>",
  "remediation_steps": ["<step 1>", "<step 2>", "<step 3>"],
  "summary": "<one paragraph summary>"
}}"""

    text = _chat(prompt).strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def chat_with_ai(question: str, history: list[dict] = None) -> str:
    if history:
        return _chat_with_history(question, history)
    return _chat(question)
