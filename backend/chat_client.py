"""Chat client construction, exactly as the docs build it.

Every Python sample on the Microsoft Agent Framework pages repeats this same
helper — Azure OpenAI when `AZURE_OPENAI_ENDPOINT` is set, otherwise OpenAI,
and a hard failure when neither is configured. It is factored out here so the
three agents can share one copy instead of three.

The Azure branch uses `OpenAIChatClient(..., azure_endpoint=...)`, the form the
Quickstart and Shared State pages use. Some other pages import
`AzureOpenAIChatClient` from `agent_framework.azure`; that symbol is not present
in the shipped packages, so this repo follows the form that is.
"""

from __future__ import annotations

import os

from agent_framework import SupportsChatGetResponse
from agent_framework.openai import OpenAIChatClient


def build_chat_client() -> SupportsChatGetResponse:
    # [1] quickstart: chat client
    # [!code highlight]
    if os.getenv("AZURE_OPENAI_ENDPOINT"):
        return OpenAIChatClient(
            model=os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME", "gpt-4o-mini"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        )
    if os.getenv("OPENAI_API_KEY"):
        return OpenAIChatClient(
            model=os.getenv("OPENAI_CHAT_MODEL_ID", "gpt-4o-mini"),
            api_key=os.getenv("OPENAI_API_KEY"),
        )
    raise RuntimeError(
        "Set either AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY, or OPENAI_API_KEY."
    )
