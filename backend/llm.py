import os
import json
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    genai.configure(api_key=GEMINI_API_KEY)
    _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


def analyze_event(event_data: dict) -> dict:
    model = _get_model()
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

    response = model.generate_content(prompt)
    text = response.text.strip()
    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def investigate_sequence(logs: list[dict]) -> dict:
    model = _get_model()
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

    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def chat_with_ai(question: str, context: list[dict] = None) -> str:
    model = _get_model()
    ctx = ""
    if context:
        ctx = f"\n\nRecent security context:\n{json.dumps(context[:10], indent=2)}"
    prompt = f"""You are an AI cybersecurity analyst assistant integrated into an LLM-Powered Log Forensic Investigator dashboard.{ctx}

User question: {question}

Provide a clear, actionable, expert response. Be concise but thorough."""
    response = model.generate_content(prompt)
    return response.text.strip()
