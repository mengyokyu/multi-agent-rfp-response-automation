
"""
FastAPI Backend for RFP Automation System
Provides REST APIs for:
- OEM Catalog Management
- Chat Interface
- RFP Workflow Management
- Dashboard Data
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from datetime import datetime
import os

from models import AnalyzeRFPRequest, ChatMessage, ChatResponse, OEMProduct, RFPScanRequest, ChatOrchestrator
from utils import save_catalog, save_test_pricing

# Initialize FastAPI app
app = FastAPI(
    title="RFP Automation System",
    description="AI-powered B2B RFP Response Automation",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# IN-MEMORY STORAGE (Replace with database in production)
# ============================================================

# Storage
oem_catalog_db = []
chat_sessions = {}
test_pricing_db = {}

# Initialize agents (global instances)
sales_agent = None
technical_agent = None
pricing_agent = None
orchestrators = {}  # Session-based orchestrators

# ============================================================
# STARTUP EVENT
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize system on startup"""
    global sales_agent, technical_agent, pricing_agent, oem_catalog_db, test_pricing_db

    # Load initial data
    if os.path.exists('data/oem_catalog.json'):
        with open('data/oem_catalog.json', 'r') as f:
            oem_catalog_db = json.load(f)

    if os.path.exists('data/test_pricing.json'):
        with open('data/test_pricing.json', 'r') as f:
            test_pricing_db = json.load(f)

    # Initialize agents
    sales_agent = SalesAgent()
    technical_agent = TechnicalAgent()
    technical_agent.product_catalog = oem_catalog_db
    pricing_agent = PricingAgent()
    pricing_agent.test_pricing = test_pricing_db

    print("✅ RFP Automation System initialized")

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "RFP Automation System",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agents": {
            "sales_agent": sales_agent is not None,
            "technical_agent": technical_agent is not None,
            "pricing_agent": pricing_agent is not None
        },
        "catalog_items": len(oem_catalog_db),
        "test_types": len(test_pricing_db)
    }

# ============================================================
# OEM CATALOG MANAGEMENT APIs
# ============================================================

@app.get("/api/catalog", response_model=List[OEMProduct])
async def get_catalog():
    """Get all OEM products from catalog"""
    return oem_catalog_db

@app.post("/api/catalog", response_model=OEMProduct)
async def add_product(product: OEMProduct):
    """Add new product to catalog"""
    # Check if SKU already exists
    if any(p['sku'] == product.sku for p in oem_catalog_db):
        raise HTTPException(status_code=400, detail="SKU already exists")

    product_dict = product.dict()
    product_dict['created_at'] = datetime.now().isoformat()
    product_dict['updated_at'] = datetime.now().isoformat()

    oem_catalog_db.append(product_dict)

    # Update technical agent's catalog
    if technical_agent:
        technical_agent.product_catalog = oem_catalog_db

    # Save to file
    save_catalog()

    return product_dict

@app.put("/api/catalog/{sku}", response_model=OEMProduct)
async def update_product(sku: str, product: OEMProduct):
    """Update existing product"""
    for i, p in enumerate(oem_catalog_db):
        if p['sku'] == sku:
            product_dict = product.dict()
            product_dict['updated_at'] = datetime.now().isoformat()
            product_dict['created_at'] = p.get('created_at', datetime.now().isoformat())
            oem_catalog_db[i] = product_dict

            # Update technical agent
            if technical_agent:
                technical_agent.product_catalog = oem_catalog_db

            save_catalog()
            return product_dict

    raise HTTPException(status_code=404, detail="Product not found")

@app.delete("/api/catalog/{sku}")
async def delete_product(sku: str):
    """Delete product from catalog"""
    for i, p in enumerate(oem_catalog_db):
        if p['sku'] == sku:
            oem_catalog_db.pop(i)

            # Update technical agent
            if technical_agent:
                technical_agent.product_catalog = oem_catalog_db

            save_catalog()
            return {"message": "Product deleted successfully"}

    raise HTTPException(status_code=404, detail="Product not found")

@app.post("/api/catalog/upload")
async def upload_catalog(file: UploadFile = File(...)):
    """Upload catalog from Excel/CSV file"""
    try:
        contents = await file.read()

        # Parse based on file type
        if file.filename.endswith('.json'):
            new_products = json.loads(contents)
        elif file.filename.endswith('.csv'):
            # Parse CSV (implement CSV parsing)
            raise HTTPException(status_code=400, detail="CSV parsing not implemented yet")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Add to catalog
        for product in new_products:
            if not any(p['sku'] == product['sku'] for p in oem_catalog_db):
                product['created_at'] = datetime.now().isoformat()
                product['updated_at'] = datetime.now().isoformat()
                oem_catalog_db.append(product)

        # Update technical agent
        if technical_agent:
            technical_agent.product_catalog = oem_catalog_db

        save_catalog()

        return {
            "message": f"Successfully uploaded {len(new_products)} products",
            "total_products": len(oem_catalog_db)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# CHAT APIs
# ============================================================

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Process chat message"""
    session_id = message.session_id

    # Get or create orchestrator for this session
    if session_id not in orchestrators:
        orchestrators[session_id] = ChatOrchestrator(
            sales_agent, technical_agent, pricing_agent
        )

    orchestrator = orchestrators[session_id]

    # Process message
    response = orchestrator.chat(message.message)

    return ChatResponse(
        response=response,
        session_id=session_id,
        timestamp=datetime.now().isoformat(),
        workflow_state=orchestrator.get_state()
    )

@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id in orchestrators:
        return orchestrators[session_id].state['conversation_history']
    return []

@app.get("/api/chat/state/{session_id}")
async def get_workflow_state(session_id: str):
    """Get current workflow state"""
    if session_id in orchestrators:
        return orchestrators[session_id].get_state()
    raise HTTPException(status_code=404, detail="Session not found")

@app.delete("/api/chat/{session_id}")
async def clear_session(session_id: str):
    """Clear chat session"""
    if session_id in orchestrators:
        del orchestrators[session_id]
    return {"message": "Session cleared"}

# ============================================================
# RFP WORKFLOW APIs
# ============================================================

@app.post("/api/rfp/scan")
async def scan_rfps(request: RFPScanRequest):
    """Scan for RFPs"""
    rfps = sales_agent.scan_tenders_online(request.keywords, request.days_ahead)

    criteria = {
        'min_tender_value': request.min_value,
        'preferred_locations': ['Delhi', 'Mumbai', 'Pune', 'Ahmedabad']
    }

    qualifications = [sales_agent.qualify_rfp(rfp, criteria) for rfp in rfps]
    prioritized_rfps = sales_agent.prioritize_rfps(rfps, qualifications)

    return {
        "total_found": len(prioritized_rfps),
        "rfps": prioritized_rfps
    }

@app.post("/api/rfp/analyze")
async def analyze_rfp(request: AnalyzeRFPRequest):
    """Analyze a specific RFP"""
    # This would typically fetch from database
    # For now, return mock analysis
    return {
        "rfp_id": request.rfp_id,
        "status": "analyzed",
        "message": "Use chat interface for full workflow"
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return {
        "total_products": len(oem_catalog_db),
        "active_sessions": len(orchestrators),
        "test_types": len(test_pricing_db),
        "system_status": "operational",
        "last_updated": datetime.now().isoformat()
    }