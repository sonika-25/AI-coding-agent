from dotenv import load_dotenv
from langchain_groq.chat_models import ChatGroq
from langgraph.constants import END
from langgraph.graph import StateGraph
from langgraph.prebuilt import create_react_agent
import shutil
import pathlib
import uuid
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import FileResponse
import os
import uvicorn

from agents.prompts import *
from agents.states import *
from agents.tools import write_file, read_file, get_current_directory, list_files, set_project_root

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
BASE_WORKSPACES = pathlib.Path.cwd() / "workspaces"
BASE_WORKSPACES.mkdir(parents=True, exist_ok=True)

origins = [
    "http://localhost:3000",
    "https://ai-coding-agent-1-2cac.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"]
    allow_headers=["*"]
    expose_headers = ["Content-Disposition"],

)
llm = ChatGroq(model="openai/gpt-oss-120b")

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


def coder_agent(state: dict) -> dict:
    """LangGraph tool-using coder agent."""
    coder_state: CoderState = state.get("coder_state")
    if coder_state is None:
        coder_state = CoderState(task_plan=state["task_plan"], current_step_idx=0)

    steps = coder_state.task_plan.implementation_steps
    if coder_state.current_step_idx >= len(steps):
        return {"coder_state": coder_state, "status": "DONE"}

    current_task = steps[coder_state.current_step_idx]
    existing_content = read_file.run(current_task.filepath)

    system_prompt = coder_system_prompt()
    user_prompt = (
        f"Task: {current_task.task_description}\n"
        f"File: {current_task.filepath}\n"
        f"Existing content:\n{existing_content}\n"
        "Use write_file(path, content) to save your changes."
    )

    coder_tools = [read_file, write_file, list_files, get_current_directory]
    react_agent = create_react_agent(llm, coder_tools)

    react_agent.invoke({"messages": [{"role": "system", "content": system_prompt},
                                     {"role": "user", "content": user_prompt}]})

    coder_state.current_step_idx += 1
    return {"coder_state": coder_state}


#Graph construction
graph = StateGraph(dict)
graph.add_node("planner", planner_agent)
graph.add_node("architect", architect_agent)
graph.add_node("coder",coder_agent)
graph.add_edge("planner", "architect")
graph.add_edge("architect", "coder")
graph.add_conditional_edges(
    "coder",
    lambda s: "END" if s.get("status") == "DONE" else "coder",
    {"END": END, "coder": "coder"}
)

graph.set_entry_point("planner")

agent=graph.compile()
PROJECT_ROOT = pathlib.Path.cwd() / "generated_project"

def zip_generated_project(zip_name: str = "generated_project") -> pathlib.Path:
    """  Zips the entire generated_project folder and returns the path to the zip file."""
    if not PROJECT_ROOT.exists():
        raise FileNotFoundError("generated_project does not exist")

    # make_archive wants the path WITHOUT ".zip"
    zip_base_path = PROJECT_ROOT.parent / zip_name

    zip_path = shutil.make_archive(
        base_name=str(zip_base_path),
        format="zip",
        root_dir=str(PROJECT_ROOT),
    )

    return pathlib.Path(zip_path)

@app.get("/ping")
async def ping():
    return "HELLO!"

@app.post("/ask")
async def prompter(user_prompt: UserPrompt, background_tasks: BackgroundTasks):
    workspace_id = str(uuid.uuid4())
    workspace_root = BASE_WORKSPACES / workspace_id
    project_root = workspace_root / "generated_project"
    project_root.mkdir(parents=True, exist_ok=True)
    set_project_root(str(project_root))

    result = agent.invoke({"user_prompt": user_prompt},
                         {"recursion_limit": 100})
    print("Final State:", result)
    zip_base = workspace_root / "generated_project"  # no .zip
    zip_path = shutil.make_archive(str(zip_base), "zip", root_dir=str(project_root))
    background_tasks.add_task(shutil.rmtree, workspace_root, True)

    print("ZIP CREATED AT:", zip_path)
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename="generated_project.zip",
    )
if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port = 8000)

    #result = agent.invoke({"user_prompt": "Build a colourful modern todo app in html css and js"},
     #                     {"recursion_limit": 100})
    #print("Final State:", result)