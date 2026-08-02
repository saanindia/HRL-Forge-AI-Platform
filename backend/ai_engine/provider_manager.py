"""AI Provider Manager - abstraction over multiple LLM providers.

Currently supports:
  - anthropic (via Emergent Universal LLM Key)
  - openai (via Emergent Universal LLM Key)
  - gemini (via Emergent Universal LLM Key)

Future slots ready (require user-provided keys via Settings):
  - openrouter
  - groq
  - huggingface
  - ollama
"""
from __future__ import annotations
import os
import json
import re
from typing import Optional, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage


class ProviderManager:
    SUPPORTED = {
        "anthropic": [
            "claude-sonnet-4-6",
            "claude-opus-4-7",
            "claude-haiku-4-5-20251001",
            "claude-sonnet-5",
        ],
        "openai": ["gpt-5.4", "gpt-5.4-mini", "gpt-5.2"],
        "gemini": ["gemini-3-flash-preview", "gemini-3.1-pro-preview"],
    }
    FUTURE = ["openrouter", "groq", "huggingface", "ollama"]

    def __init__(self):
        self.emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")

    def list_providers(self):
        return {
            "active": [
                {"id": p, "models": models, "requires_key": False}
                for p, models in self.SUPPORTED.items()
            ],
            "future": [{"id": p, "models": [], "requires_key": True} for p in self.FUTURE],
        }

    def _resolve(self, provider: Optional[str], model: Optional[str]):
        provider = (provider or "anthropic").lower()
        if provider not in self.SUPPORTED:
            provider = "anthropic"
        if not model or model not in self.SUPPORTED[provider]:
            model = self.SUPPORTED[provider][0]
        return provider, model

    async def complete(
        self,
        *,
        system_message: str,
        user_message: str,
        session_id: str,
        provider: Optional[str] = "anthropic",
        model: Optional[str] = "claude-sonnet-4-6",
    ) -> str:
        provider, model = self._resolve(provider, model)
        chat = LlmChat(
            api_key=self.emergent_key,
            session_id=session_id,
            system_message=system_message,
        ).with_model(provider, model)
        response = await chat.send_message(UserMessage(text=user_message))
        return response if isinstance(response, str) else str(response)


# ---------- Prompt Builder ----------
class PromptBuilder:
    """Builds structured engineering prompts for HRL Forge AI."""

    SYSTEM_ENGINEER = (
        "You are HRL Forge AI — a senior embedded systems and robotics engineer at "
        "Hemalata Robotics Lab. You produce production-grade firmware, wiring "
        "diagrams, and hardware guidance for microcontrollers (Arduino, ESP32, "
        "ESP8266, STM32, Raspberry Pi Pico, ATmega328P) and single-board computers. "
        "You are precise, safety-conscious, and always cite pin numbers, voltages, "
        "and required libraries.\n\n"
        "CRITICAL: Always respond with a single JSON object matching this schema, "
        "with NO markdown code fences around the JSON itself:\n"
        "{\n"
        '  "code": "<complete compilable source code>",\n'
        '  "explanation": "<step-by-step engineering explanation in markdown>",\n'
        '  "libraries": ["<library name + version if relevant>", ...],\n'
        '  "connections": [ {"component": "...", "pin": "...", "board_pin": "...", "notes": "..."} ],\n'
        '  "optimization": "<memory/power/latency notes in markdown>"\n'
        "}\n"
        "For non-code modes (explain/review), still return the JSON but you may put the "
        "primary output in `explanation` and leave `code` as the input code or empty."
    )

    MODES = {
        "generate": "Generate complete, compilable code for the following request:",
        "explain": "Explain this code in detail, line by line, for an engineering audience:",
        "review": "Perform a professional code review. Focus on bugs, safety, and best practices:",
        "fix": "Identify and fix all bugs. Return the corrected complete code:",
        "optimize": "Optimize this code for performance, memory usage, and power consumption:",
        "wiring": "Generate the exact wiring/connection diagram (as structured pin mappings) for this project:",
        "bom": "Generate the Bill of Materials (BOM) with components, quantities, and specs:",
        "serial": (
            "Simulate the Serial Monitor output that a user would see when this code runs. "
            "Show ~15-25 realistic lines of output including startup messages, sensor readings, "
            "wifi/mqtt handshakes if applicable, and a couple of loop iterations. Use realistic "
            "values. Return the simulated output in the `explanation` field as a raw plain-text "
            "serial log — ONE LINE PER OUTPUT. Absolutely NO markdown, NO code fences (```), "
            "NO headings (##), NO explanation prose. Start directly with the very first character "
            "the microcontroller would print. Leave `code` unchanged."
        ),
    }

    @staticmethod
    def build(
        prompt: str,
        board: str,
        language: str,
        framework: Optional[str],
        mode: str,
        existing_code: Optional[str] = None,
    ) -> str:
        instruction = PromptBuilder.MODES.get(mode, PromptBuilder.MODES["generate"])
        parts = [
            f"Target Board: {board}",
            f"Language: {language}",
        ]
        if framework:
            parts.append(f"Framework: {framework}")
        parts.append(f"Task Mode: {mode.upper()}")
        parts.append("")
        parts.append(instruction)
        parts.append("")
        parts.append(prompt)
        if existing_code:
            parts.append("")
            parts.append("Existing Code:")
            parts.append("```")
            parts.append(existing_code)
            parts.append("```")
        parts.append("")
        parts.append("Respond ONLY with the JSON object described in the system message.")
        return "\n".join(parts)


# ---------- Response Formatter ----------
class ResponseFormatter:
    @staticmethod
    def parse(raw: str) -> Dict[str, Any]:
        """Parse the JSON response from the LLM, tolerant of markdown fences."""
        cleaned = raw.strip()
        # Strip markdown fences if present
        fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, re.DOTALL)
        if fence:
            cleaned = fence.group(1)
        # Try direct
        try:
            data = json.loads(cleaned)
        except Exception:
            # Attempt to locate first { ... } block
            m = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if m:
                try:
                    data = json.loads(m.group(0))
                except Exception:
                    data = None
            else:
                data = None
        if not isinstance(data, dict):
            # Fallback: place whole raw as explanation
            return {
                "code": "",
                "explanation": raw,
                "libraries": [],
                "connections": [],
                "optimization": "",
            }
        return {
            "code": data.get("code", "") or "",
            "explanation": data.get("explanation", "") or "",
            "libraries": data.get("libraries", []) or [],
            "connections": data.get("connections", []) or [],
            "optimization": data.get("optimization", "") or "",
        }


provider_manager = ProviderManager()
