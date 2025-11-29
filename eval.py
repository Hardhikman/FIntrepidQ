import asyncio
import os
import shutil
from dataclasses import dataclass
from typing import List, Optional

# --- Import your existing Agent Runner ---
# Ensure equity_research_sqlite.py is in the same folder
from equity_research_sqlite import runner, APP_NAME

# --- Google GenAI Imports for the "Judge" ---
from google.genai import types
from google.adk.models.google_llm import Gemini

# --- CONFIGURATION ---
EVAL_MODEL_NAME = "gemini-2.5-flash"  # The model that grades the agent
DB_FILE = "equity_memory.db"          # The DB file used by the agent

@dataclass
class TestCase:
    name: str
    query: str
    expected_outcome: str
    session_id: str
    user_id: str = "eval_user_01"

# ==============================================================================
# 1. THE JUDGE (LLM-as-a-Judge)
# ==============================================================================

class AgentEvaluator:
    def __init__(self):
        self.model = Gemini(model=EVAL_MODEL_NAME)

    async def evaluate(self, query: str, actual_response: str, expected_outcome: str) -> dict:
        """
        Asks the LLM to grade the response based on the expectation.
        """
        prompt = f"""
        You are an impartial judge evaluating an AI Agent's performance.
        
        ### INPUT DATA
        - **User Query:** "{query}"
        - **Expected Behavior/Fact:** "{expected_outcome}"
        - **Agent's Actual Response:** "{actual_response}"
        
        ### TASK
        1. Compare the Agent's response to the Expected Behavior.
        2. Assign a **Score (1-5)**:
           - 1: Completely wrong or hallucinated.
           - 3: Partially correct but missing key context.
           - 5: Perfect accuracy and follows instructions.
        3. Provide a brief **Reason** for your score.
        
        ### OUTPUT FORMAT (JSON)
        {{
            "score": <int>,
            "reason": "<string>"
        }}
        """
        
        # Call the model (using a simple generation call)
        # Note: We wrap the prompt in a standard ADK message structure or use the raw client if available.
        # Here we use the ADK model wrapper's internal client for simplicity if accessible, 
        # or we treat the prompt as a standard query.
        
        response = await self.model.generate_content(
            prompt, 
            generation_config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        try:
            # Parse the JSON response
            import json
            return json.loads(response.text)
        except Exception as e:
            return {"score": 0, "reason": f"Failed to parse judge output: {e}"}

# ==============================================================================
# 2. TEST CASES
# ==============================================================================

TEST_SUITE = [
    # --- TEST 1: Financial Data Accuracy ---
    TestCase(
        name="Quant Data Check",
        query="Get me the financial stats for Apple (AAPL). What is the PE ratio?",
        expected_outcome="The agent should call the 'get_deep_financials' tool and output a numerical P/E ratio (Trailing or Forward).",
        session_id="eval_session_1"
    ),
    
    # --- TEST 2: Memory Injection (Teaching) ---
    TestCase(
        name="Memory Storage (Teaching)",
        query="I want to teach you my investment thesis: I hate debt. Never recommend high debt companies.",
        expected_outcome="The agent should acknowledge the preference and save it. It should NOT hallucinate a recommendation yet.",
        session_id="eval_session_2"
    ),
    
    # --- TEST 3: Memory Recall (Testing Persistence) ---
    # Note: We use a NEW session ID to force the agent to look into the DB/Memory Service.
    TestCase(
        name="Memory Recall (Testing)",
        query="Should I buy a company with a 3.5 debt-to-equity ratio?",
        expected_outcome="The agent should reference the user's previous 'I hate debt' rule and flag this as a Red Flag/Bad Investment.",
        session_id="eval_session_3" # New session, must rely on DB
    )
]

# ==============================================================================
# 3. EVALUATION RUNNER
# ==============================================================================

async def run_evaluation():
    print(f"\n⚖️  STARTING EVALUATION: {APP_NAME}")
    print("=" * 60)

    # 1. SETUP: Reset Database for a clean test
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"🧹 Cleared old database: {DB_FILE}")
    
    # Initialize the judge
    judge = AgentEvaluator()
    results = []

    # 2. RUN LOOP
    for test in TEST_SUITE:
        print(f"\n▶️  Running Test: {test.name}")
        print(f"   Query: {test.query}")
        
        # Execute the Agent
        # We use run_async here (not stream) to get the full text easily
        try:
            response = await runner.run_async(
                query=test.query,
                user_id=test.user_id,
                session_id=test.session_id
            )
            actual_text = response.text
            print(f"   ✅ Agent Finished. (Response length: {len(actual_text)})")
            
        except Exception as e:
            actual_text = f"CRITICAL ERROR: {str(e)}"
            print(f"   ❌ Agent Failed: {e}")

        # Evaluate (Judge)
        print("   ⚖️  Judging...")
        eval_result = await judge.evaluate(test.query, actual_text, test.expected_outcome)
        
        # Store Result
        results.append({
            "test": test.name,
            "score": eval_result.get("score"),
            "reason": eval_result.get("reason"),
            "agent_response_snippet": actual_text[:100] + "..."
        })
        print(f"   🏁 Score: {eval_result.get('score')}/5 | Reason: {eval_result.get('reason')}")

    # 3. FINAL REPORT
    print("\n\n📊 EVALUATION REPORT")
    print("=" * 60)
    total_score = 0
    for res in results:
        status = "✅ PASS" if res['score'] >= 4 else "⚠️  WARN" if res['score'] == 3 else "❌ FAIL"
        print(f"{status} | [{res['score']}/5] {res['test']}")
        print(f"   Reason: {res['reason']}\n")
        total_score += res['score']
    
    avg_score = total_score / len(results)
    print(f"🏆 Average Score: {avg_score:.1f} / 5.0")

if __name__ == "__main__":
    asyncio.run(run_evaluation())