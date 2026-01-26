from langchain.tools import tool
from langchain_classic.agents import create_react_agent, AgentExecutor
from langchain_cerebras import ChatCerebras
from dotenv import load_dotenv
import os

from prompt import sales_prompt, technical_prompt, pricing_prompt, orchestrator_prompt
from tools import (
    # Sales Agent Tools
    scan_rfp_websites,
    get_rfp_details,
    extract_rfp_summary_for_technical,
    extract_rfp_summary_for_pricing,
    # Technical Agent Tools
    search_product_catalog,
    get_product_details,
    match_rfp_requirement_to_products,
    generate_product_comparison_table,
    list_all_products,
    # Pricing Agent Tools
    get_product_price,
    get_test_pricing,
    calculate_total_quote,
    list_all_tests,
)

# Load environment variables BEFORE using them
load_dotenv()

# Initialize the LLM
llm = ChatCerebras(
    model="llama-3.3-70b",
    api_key=os.getenv("CEREBRAS_API_KEY"),
    temperature=0.7,
    max_tokens=8192,
)

# ========================= AGENT TOOLS ========================= #

# Sales Agent Tools
sales_tools = [
    scan_rfp_websites,
    get_rfp_details,
    extract_rfp_summary_for_technical,
    extract_rfp_summary_for_pricing,
]

# Technical Agent Tools
technical_tools = [
    search_product_catalog,
    get_product_details,
    match_rfp_requirement_to_products,
    generate_product_comparison_table,
    list_all_products,
]

# Pricing Agent Tools
pricing_tools = [
    get_product_price,
    get_test_pricing,
    calculate_total_quote,
    list_all_tests,
]

# ========================= AGENT DEFINITIONS ========================= #

# Sales Agent - Scans and identifies RFPs, summarizes requirements
sales_agent_runnable = create_react_agent(
    llm=llm,
    tools=sales_tools,
    prompt=sales_prompt
)
sales_agent = AgentExecutor(
    agent=sales_agent_runnable,
    tools=sales_tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=10,
)

# Technical Agent - Matches RFP requirements with product SKUs
technical_agent_runnable = create_react_agent(
    llm=llm,
    tools=technical_tools,
    prompt=technical_prompt
)
technical_agent = AgentExecutor(
    agent=technical_agent_runnable,
    tools=technical_tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=15,
)

# Pricing Agent - Calculates pricing based on products and requirements
pricing_agent_runnable = create_react_agent(
    llm=llm,
    tools=pricing_tools,
    prompt=pricing_prompt
)
pricing_agent = AgentExecutor(
    agent=pricing_agent_runnable,
    tools=pricing_tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=10,
)


# ========================= TOOLS ========================= #

# Wrap agents as tools for orchestration
@tool("sales", description="Identify and extract RFP requirements from documents")
def call_sales_agent(query: str):
    result = sales_agent.invoke({"input": query})
    return result["output"]


@tool("technical", description="Match RFP requirements with product SKUs using technical specifications")
def call_technical_agent(query: str):
    result = technical_agent.invoke({"input": query})
    return result["output"]


@tool("pricing", description="Calculate pricing and generate quotes based on matched products")
def call_pricing_agent(query: str):
    result = pricing_agent.invoke({"input": query})
    return result["output"]


# ========================= ORCHESTRATOR AGENT ========================= #

# Main orchestrator agent with all subagents as tools
orchestrator_tools = [call_sales_agent, call_technical_agent, call_pricing_agent]
orchestrator_agent_runnable = create_react_agent(
    llm=llm,
    tools=orchestrator_tools,
    prompt=orchestrator_prompt
)
orchestrator_agent = AgentExecutor(agent=orchestrator_agent_runnable, tools=orchestrator_tools, verbose=True)


# ========================= MAIN EXECUTION ========================= #

def main():
    query = "Process this RFP for power cables supply for metro rail project"
    response = orchestrator_agent.invoke({"input": query})
    print(response["output"])

if __name__ == "__main__":
    main()