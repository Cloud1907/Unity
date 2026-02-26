import os
import sys

# Try to import the client
try:
    from letta_client import Letta
    def create_client():
        # Connect to our custom Letta server on the specified port
        return Letta(base_url="http://localhost:8283")
except ImportError as e:
    print(f"❌ Critical Import Error: {e}")
    print("   Please ensure 'letta-client' is installed.")
    sys.exit(1)

def main():
    print("🚀 Initializing Letta Memory Bridge (v3)...")
    
    # 1. Connect to Letta Server
    try:
        client = create_client()
        # Verify connection by listing agents
        client.agents.list()
        print("✅ Connected to Letta Server")
    except Exception as e:
        print(f"❌ Failed to connect to Letta Server: {e}")
        print("Tip: Make sure 'python run_letta_custom_cli.py' is running.")
        sys.exit(1)

    # 2. Load Project Context
    memory_file = "PROJECT_CONTEXT_MEMORY.md"
    if not os.path.exists(memory_file):
        print(f"❌ Error: {memory_file} not found!")
        sys.exit(1)

    with open(memory_file, 'r') as f:
        memory_content = f.read()
    print(f"✅ Loaded {len(memory_content)} bytes of context from {memory_file}")

    # 3. Create or Get Agent
    agent_name = "UnityCoreGemini"
    model_handle = "google_ai/gemini-2.0-flash" 
    existing_agent = None
    
    try:
        # List agents to check for existing one
        agents_response = client.agents.list()
        for agent in agents_response:
            if agent.name == agent_name:
                existing_agent = agent
                break
        
        if existing_agent:
            print(f"ℹ️  Agent '{agent_name}' already exists (ID: {existing_agent.id}). Updating memory...")
            agent_id = existing_agent.id
            print("   Sending message via 'input' parameter...")
            client.agents.messages.create(
                agent_id=agent_id,
                input=f"[SYSTEM NOTIFICATION: UPDATING PROJECT CONTEXT]\n\n{memory_content}"
            )
            print(f"✅ Injected project context into '{agent_name}'.")
        else:
            print(f"🆕 Creating new agent '{agent_name}' with model '{model_handle}'...")
            new_agent = client.agents.create(
                name=agent_name,
                model=model_handle
            )
            print(f"   Agent created (ID: {new_agent.id}). Sending initial context...")
            client.agents.messages.create(
                agent_id=new_agent.id,
                input=f"[INITIAL PROJECT CONTEXT]\n\n{memory_content}"
            )
            print(f"✅ Created agent '{agent_name}' and injected project context.")

    except Exception as e:
        print(f"❌ Error managing agent: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print("\n🎉 Memory Bridge Setup Complete!")
    print(f"The agent '{agent_name}' is now aware of the project context.")

if __name__ == "__main__":
    main()
