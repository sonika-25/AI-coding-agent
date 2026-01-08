from dotenv import load_dotenv
#from langchain.globals import set_verbose, set_debug
from langchain_groq.chat_models import ChatGroq
from langgraph.constants import END
from langgraph.graph import StateGraph
#from langgraph.prebuilt import create_react_agent

from agents.prompts import *
from agents.states import *
#from agent.tools import write_file, read_file, get_current_directory, list_files

load_dotenv()


llm = ChatGroq(model="openai/gpt-oss-120b")
user_prompt = "Build a web application for a basic calculator"


def planner_agent(state: dict) -> dict:
    """Converts user prompt into a structured Plan."""
    user_prompt = state["user_prompt"]
    resp = llm.with_structured_output(Plan).invoke(
        planner_prompt(user_prompt)
    )
    if resp is None:
        raise ValueError("Planner did not return a valid response.")
    return {"plan": resp}


def architect_agent(state: dict) -> dict:
    """Creates TaskPlan from Plan."""
    plan: Plan = state["plan"]
    resp = llm.with_structured_output(TaskPlan).invoke(
        architect_prompt(plan=plan.model_dump_json())
    )
    if resp is None:
        raise ValueError("Planner did not return a valid response.")

    resp.plan = plan
    print(resp.model_dump_json())
    return {"task_plan": resp}

resp = llm.with_structured_output(Plan).invoke(planner_prompt(user_prompt))
print(resp)

graph = StateGraph(dict)
graph.add_node("planner", planner_agent)
graph.add_node("architect", architect_agent)
graph.add_node("coder",coder_agent)
graph.add_edge("planner", "architect")

graph.set_entry_point("planner")

agent=graph.compile()

result = agent.invoke({"user_prompt": user_prompt})
print (result)