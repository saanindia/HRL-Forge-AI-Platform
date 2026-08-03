"""AI Provider Manager - direct HTTP integration with major LLM providers.

Vendor-independent implementation. Supports:
  - openrouter   → OpenRouter aggregator (Claude, GPT, Gemini, Llama, ...)
  - gemini       → Google Generative Language API
  - groq         → Groq Cloud (Llama, Mixtral)
  - huggingface  → HuggingFace Inference API
  - ollama       → Local Ollama server (any model)

Configure API keys via environment variables:
  OPENROUTER_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, HUGGINGFACE_API_KEY,
  OLLAMA_BASE_URL (defaults to http://localhost:11434)

Default provider / model:
  AI_DEFAULT_PROVIDER=openrouter
  AI_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
"""
from __future__ import annotations

import os
import json
import re
from typing import Any, Dict, List, Optional

import httpx


class ProviderError(RuntimeError):
    pass


class ProviderManager:
    ACTIVE = {
        "openrouter": [
            "anthropic/claude-sonnet-4.5",
            "anthropic/claude-3.5-sonnet",
            "anthropic/claude-3.5-haiku",
            "openai/gpt-4o",
            "openai/gpt-4o-mini",
            "google/gemini-2.0-flash-exp",
            "meta-llama/llama-3.3-70b-instruct",
        ],
        "gemini": [
            "gemini-2.0-flash-exp",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
        ],
        "groq": [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
        "huggingface": [
            "meta-llama/Meta-Llama-3-8B-Instruct",
            "mistralai/Mistral-7B-Instruct-v0.3",
        ],
        "ollama": [
            "llama3",
            "codellama",
            "mistral",
            "qwen2.5-coder",
        ],
    }

    def __init__(self):
        self.default_provider = os.environ.get("AI_DEFAULT_PROVIDER", "openrouter").lower()
        self.default_model = os.environ.get(
            "AI_DEFAULT_MODEL", "anthropic/claude-sonnet-4.5"
        )
        self.timeout = float(os.environ.get("AI_HTTP_TIMEOUT", "120"))
        self.ollama_base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

    # ------------------------------------------------------------------
    def list_providers(self):
        return {
            "active": [
                {
                    "provider": p,
                    "id": p,
                    "models": models,
                    "requires_key": p != "ollama",
                    "key_env": {
                        "openrouter": "OPENROUTER_API_KEY",
                        "gemini": "GEMINI_API_KEY",
                        "groq": "GROQ_API_KEY",
                        "huggingface": "HUGGINGFACE_API_KEY",
                        "ollama": "OLLAMA_BASE_URL",
                    }.get(p),
                    "has_key": bool(self._key_for(p)),
                }
                for p, models in self.ACTIVE.items()
            ],
            "default": {"provider": self.default_provider, "model": self.default_model},
        }

    # ------------------------------------------------------------------
    def _key_for(self, provider: str) -> str:
        return {
            "openrouter": os.environ.get("OPENROUTER_API_KEY", ""),
            "gemini": os.environ.get("GEMINI_API_KEY", ""),
            "groq": os.environ.get("GROQ_API_KEY", ""),
            "huggingface": os.environ.get("HUGGINGFACE_API_KEY", ""),
            "ollama": self.ollama_base,
        }.get(provider, "")

    def _resolve(self, provider: Optional[str], model: Optional[str]):
        provider = (provider or self.default_provider).lower()
        if provider not in self.ACTIVE:
            provider = self.default_provider
        if not model:
            model = self.default_model if provider == self.default_provider else self.ACTIVE[provider][0]
        if model not in self.ACTIVE[provider]:
            # Allow unlisted models (users may pass any valid provider model id)
            pass
        return provider, model

    # ------------------------------------------------------------------
    async def complete(
        self,
        *,
        system_message: str,
        user_message: str,
        session_id: str = "",  # kept for API compatibility, unused
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        provider, model = self._resolve(provider, model)
        key = self._key_for(provider)
        if provider != "ollama" and not key:
            raise ProviderError(
                f"Missing API key for provider '{provider}'. "
                f"Set the corresponding environment variable."
            )

        handlers = {
            "openrouter": self._call_openai_compatible,
            "groq": self._call_openai_compatible,
            "ollama": self._call_ollama,
            "gemini": self._call_gemini,
            "huggingface": self._call_huggingface,
        }
        try:
            return await handlers[provider](
                system_message=system_message,
                user_message=user_message,
                model=model,
                provider=provider,
                api_key=key,
            )
        except httpx.HTTPStatusError as e:
            body = e.response.text if e.response is not None else ""
            raise ProviderError(
                f"{provider} HTTP {e.response.status_code}: {body[:300]}"
            )
        except httpx.HTTPError as e:
            raise ProviderError(f"{provider} transport error: {e}")

    # ------------------------------------------------------------------
    # OpenAI-compatible endpoints (OpenRouter, Groq)
    # ------------------------------------------------------------------
    _OAI_BASE = {
        "openrouter": "https://openrouter.ai/api/v1/chat/completions",
        "groq": "https://api.groq.com/openai/v1/chat/completions",
    }

    async def _call_openai_compatible(
        self, *, system_message, user_message, model, provider, api_key
    ) -> str:
        url = self._OAI_BASE[provider]
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        if provider == "openrouter":
            headers.update({
                "HTTP-Referer": os.environ.get("APP_PUBLIC_URL", "https://forge.myhrl.in"),
                "X-Title": "HRL Forge AI",
            })
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.2,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        return data["choices"][0]["message"]["content"]

    # ------------------------------------------------------------------
    # Ollama (local server, OpenAI-compatible /api/chat)
    # ------------------------------------------------------------------
    async def _call_ollama(
        self, *, system_message, user_message, model, provider, api_key
    ) -> str:
        url = f"{self.ollama_base.rstrip('/')}/api/chat"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            "stream": False,
            "options": {"temperature": 0.2},
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
        return data.get("message", {}).get("content", "")

    # ------------------------------------------------------------------
    # Google Gemini
    # ------------------------------------------------------------------
    async def _call_gemini(
        self, *, system_message, user_message, model, provider, api_key
    ) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={api_key}"
        )
        payload = {
            "systemInstruction": {"parts": [{"text": system_message}]},
            "contents": [{"role": "user", "parts": [{"text": user_message}]}],
            "generationConfig": {"temperature": 0.2},
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)

    # ------------------------------------------------------------------
    # HuggingFace Inference API (text-generation)
    # ------------------------------------------------------------------
    async def _call_huggingface(
        self, *, system_message, user_message, model, provider, api_key
    ) -> str:
        url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        # Use chat-completions-style envelope where supported; fall back to plain inputs
        prompt = f"<s>[INST] <<SYS>>\n{system_message}\n<</SYS>>\n\n{user_message} [/INST]"
        payload = {
            "inputs": prompt,
            "parameters": {"temperature": 0.2, "max_new_tokens": 2048, "return_full_text": False},
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            return data[0]["generated_text"]
        return json.dumps(data)


# ----------------------------------------------------------------------
# Prompt builder & response formatter (unchanged public interface)
# ----------------------------------------------------------------------
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


class ResponseFormatter:
    @staticmethod
    def parse(raw: str) -> Dict[str, Any]:
        cleaned = raw.strip()
        fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, re.DOTALL)
        if fence:
            cleaned = fence.group(1)
        try:
            data = json.loads(cleaned)
        except Exception:
            m = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if m:
                try:
                    data = json.loads(m.group(0))
                except Exception:
                    data = None
            else:
                data = None
        if not isinstance(data, dict):
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
