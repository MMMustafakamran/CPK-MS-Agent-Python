"""The three agents this harness serves.

Each one is lifted from a documentation page rather than designed here. No tool,
instruction, or state schema in this file was invented — if it is not in a doc
sample, it is not here.

Why three agents instead of one: `state_schema` and `predict_state_config` are
properties of an `AgentFrameworkAgent`, and the docs define two *different*
schemas — `language` on the Shared State pages and `searches` on State
Rendering. One agent cannot carry both without departing from what the docs
show, so each keeps its own endpoint.

  main_agent    →  Quickstart + Tool Rendering  (get_weather)
  sample_agent  →  Shared State read/write, Readables  (update_language)
  search_agent  →  State Rendering  (update_searches)
"""

from __future__ import annotations

from typing import Annotated

from agent_framework import Agent, SupportsChatGetResponse, tool
from agent_framework.ag_ui import AgentFrameworkAgent
from pydantic import BaseModel, Field

# --------------------------------------------------------------------------
# Tool Rendering — docs.copilotkit.ai/ms-agent-python/generative-ui/tool-rendering
# --------------------------------------------------------------------------


# [1] tool rendering: get_weather
# [!code highlight]
@tool
def get_weather(
    location: Annotated[str, Field(description="The location to get weather for")],
) -> str:
    normalized = location.strip() or "the requested location"
    return f"The weather for {normalized} is 70 degrees."
# endregion


def create_main_agent(chat_client: SupportsChatGetResponse) -> Agent:
    """Quickstart's agent, plus the one tool the Tool Rendering page adds."""
    return Agent(
        name="MyAgent",
        instructions="You are a helpful assistant.",
        client=chat_client,
        tools=[get_weather],
    )


# --------------------------------------------------------------------------
# Shared State — .../shared-state/in-app-agent-read and in-app-agent-write
# --------------------------------------------------------------------------

LANGUAGE_STATE_SCHEMA: dict[str, object] = {
    "language": {
        "type": "string",
        "enum": ["english", "spanish"],
        "description": "Preferred language.",
    }
}

LANGUAGE_PREDICT_STATE_CONFIG: dict[str, dict[str, str]] = {
    "language": {"tool": "update_language", "tool_argument": "language"}
}


# [2] shared state: update_language
# [!code highlight]
@tool

def update_language(
    language: Annotated[str, Field(description="Preferred language: 'english' or 'spanish'")],
) -> str:
    normalized = (language or "").strip().lower()
    if normalized not in ("english", "spanish"):
        return "Language unchanged. Use 'english' or 'spanish'."
    return f"Language updated to {normalized}."
# endregion


def create_sample_agent(chat_client: SupportsChatGetResponse) -> AgentFrameworkAgent:
    base_agent = Agent(
        name="sample_agent",
        instructions="You are a helpful assistant.",
        client=chat_client,
        tools=[update_language],
    )
    return AgentFrameworkAgent(
        agent=base_agent,
        name="CopilotKitMicrosoftAgentFrameworkAgent",
        description="Assistant that tracks a simple language state.",
        state_schema=LANGUAGE_STATE_SCHEMA,
        predict_state_config=LANGUAGE_PREDICT_STATE_CONFIG,
        require_confirmation=False,
    )


# --------------------------------------------------------------------------
# State Rendering — .../generative-ui/state-rendering
# --------------------------------------------------------------------------


class SearchItem(BaseModel):
    query: str
    done: bool


SEARCHES_STATE_SCHEMA: dict[str, object] = {
    "searches": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "done": {"type": "boolean"},
            },
            "required": ["query", "done"],
            "additionalProperties": False,
        },
        "description": "List of searches and whether each is done.",
    }
}

SEARCHES_PREDICT_STATE_CONFIG: dict[str, dict[str, str]] = {
    "searches": {
        "tool": "update_searches",
        "tool_argument": "searches",
    }
}


# [3] state rendering: update_searches
# [!code highlight]
# region update-searches
@tool
def update_searches(
    searches: Annotated[
        list[SearchItem],
        Field(
            description=(
                "The complete source of truth for the user's searches. Maintain "
                "ordering and include the full list on each call."
            )
        ),
    ],
) -> str:
    return f"Searches updated. Tracking {len(searches)} item(s)."
# endregion


def create_search_agent(chat_client: SupportsChatGetResponse) -> AgentFrameworkAgent:
    base_agent = Agent(
        name="search_agent",
        instructions=(
            "You help users create and run searches.\n\n"
            "State sync rules:\n"
            "- Maintain a list of searches: each item has { query, done }.\n"
            "- When adding a new search, call `update_searches` with the FULL list, "
            "including the new item with done=true.\n"
            "- All searches in the list should have done=true unless explicitly in progress.\n"
            "- Never send partial updates. Always include the full list on each call.\n"
        ),
        client=chat_client,
        tools=[update_searches],
    )
    return AgentFrameworkAgent(
        agent=base_agent,
        name="CopilotKitMicrosoftAgentFrameworkAgent",
        description="Maintains a list of searches and streams state to the UI.",
        state_schema=SEARCHES_STATE_SCHEMA,
        predict_state_config=SEARCHES_PREDICT_STATE_CONFIG,
        require_confirmation=False,
    )
