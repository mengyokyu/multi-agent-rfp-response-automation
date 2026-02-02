"""
Drizzle ORM database client for RFP Automation System
Type-safe database operations with Supabase PostgreSQL
"""
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

try:
    from drizzle import Drizzle
    from drizzle.orm import sessionmaker
    from postgresql import insert, select, update, delete
    from .schema import (
        users_table, rfps_table, rfp_files_table,
        chat_sessions_table, chat_messages_table, agent_interactions_table
    )
    DRIZZLE_AVAILABLE = True
except ImportError:
    DRIZZLE_AVAILABLE = False
    logging.warning("Drizzle ORM not available, falling back to basic operations")

logger = logging.getLogger(__name__)


class DrizzleClient:
    """Drizzle ORM client for type-safe database operations"""
    
    def __init__(self):
        if not DRIZZLE_AVAILABLE:
            self.db = None
            self.session_factory = None
            logger.warning("Drizzle ORM not installed")
            return
        
        database_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_URL")
        if not database_url:
            logger.warning("No database URL configured")
            self.db = None
            self.session_factory = None
            return
        
        try:
            # Initialize Drizzle with PostgreSQL
            self.db = Drizzle(
                database_url,
                schema={
                    "users": users_table,
                    "rfps": rfps_table,
                    "rfp_files": rfp_files_table,
                    "chat_sessions": chat_sessions_table,
                    "chat_messages": chat_messages_table,
                    "agent_interactions": agent_interactions_table,
                }
            )
            
            self.session_factory = sessionmaker(self.db)
            logger.info("Drizzle ORM client initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Drizzle: {e}")
            self.db = None
            self.session_factory = None
    
    def is_available(self) -> bool:
        """Check if Drizzle client is available"""
        return DRIZZLE_AVAILABLE and self.db is not None
    
    async def save_chat_session(self, session_id: str, state: Dict[str, Any]) -> bool:
        """Save chat session state using Drizzle ORM"""
        if not self.is_available():
            return False
        
        try:
            with self.session_factory() as session:
                # Prepare session data
                session_data = {
                    "session_id": session_id,
                    "current_step": state.get("current_step", "IDLE"),
                    "next_node": state.get("next_node", "main_agent"),
                    "rfps_identified": state.get("rfps_identified", []),
                    "selected_rfp": state.get("selected_rfp"),
                    "user_selected_rfp_id": state.get("user_selected_rfp_id"),
                    "technical_analysis": state.get("technical_analysis"),
                    "pricing_analysis": state.get("pricing_analysis"),
                    "final_response": state.get("final_response"),
                    "report_path": state.get("report_path"),
                    "product_summary": state.get("product_summary"),
                    "test_summary": state.get("test_summary"),
                    "waiting_for_user": state.get("waiting_for_user", False),
                    "user_prompt": state.get("user_prompt"),
                    "error": state.get("error"),
                    "updated_at": datetime.utcnow()
                }
                
                # Upsert session
                stmt = insert(chat_sessions_table).values(session_data)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["session_id"],
                    set_=session_data
                )
                
                session.execute(stmt)
                session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error saving chat session with Drizzle: {e}")
            return False
    
    async def load_chat_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load chat session state using Drizzle ORM"""
        if not self.is_available():
            return None
        
        try:
            with self.session_factory() as session:
                stmt = select(chat_sessions_table).where(
                    chat_sessions_table.c.session_id == session_id
                )
                result = session.execute(stmt).first()
                
                if result:
                    # Convert to agent state format
                    return {
                        "messages": [],  # Messages loaded separately
                        "current_step": result.current_step or "IDLE",
                        "next_node": result.next_node or "main_agent",
                        "rfps_identified": result.rfps_identified or [],
                        "selected_rfp": result.selected_rfp,
                        "user_selected_rfp_id": result.user_selected_rfp_id,
                        "technical_analysis": result.technical_analysis,
                        "pricing_analysis": result.pricing_analysis,
                        "final_response": result.final_response,
                        "report_path": result.report_path,
                        "product_summary": result.product_summary,
                        "test_summary": result.test_summary,
                        "waiting_for_user": result.waiting_for_user or False,
                        "user_prompt": result.user_prompt,
                        "agent_reasoning": [],
                        "tool_calls_made": [],
                        "session_id": session_id,
                        "error": result.error
                    }
                
        except Exception as e:
            logger.error(f"Error loading chat session with Drizzle: {e}")
        
        return None
    
    async def save_chat_message(self, session_id: str, message_type: str, 
                              content: str, metadata: Dict[str, Any] = None) -> bool:
        """Save chat message using Drizzle ORM"""
        if not self.is_available():
            return False
        
        try:
            with self.session_factory() as session:
                message_data = {
                    "session_id": session_id,
                    "message_type": message_type,
                    "content": content,
                    "metadata": metadata or {},
                    "created_at": datetime.utcnow()
                }
                
                stmt = insert(chat_messages_table).values(message_data)
                session.execute(stmt)
                session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error saving chat message with Drizzle: {e}")
            return False
    
    async def get_chat_messages(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat messages using Drizzle ORM"""
        if not self.is_available():
            return []
        
        try:
            with self.session_factory() as session:
                stmt = (
                    select(chat_messages_table)
                    .where(chat_messages_table.c.session_id == session_id)
                    .order_by(chat_messages_table.c.created_at.desc())
                    .limit(limit)
                )
                results = session.execute(stmt).all()
                
                return [
                    {
                        "id": str(result.id),
                        "session_id": result.session_id,
                        "message_type": result.message_type,
                        "content": result.content,
                        "metadata": result.metadata or {},
                        "created_at": result.created_at.isoformat()
                    }
                    for result in results
                ]
                
        except Exception as e:
            logger.error(f"Error getting chat messages with Drizzle: {e}")
            return []
    
    async def save_agent_interaction(self, session_id: str, agent_name: str, 
                                   interaction_data: Dict[str, Any]) -> bool:
        """Save agent interaction using Drizzle ORM"""
        if not self.is_available():
            return False
        
        try:
            with self.session_factory() as session:
                interaction = {
                    "session_id": session_id,
                    "agent_name": agent_name,
                    "interaction_type": interaction_data.get("type", "response"),
                    "input_data": interaction_data.get("input", {}),
                    "output_data": interaction_data.get("output", {}),
                    "reasoning": interaction_data.get("reasoning", ""),
                    "tool_calls": interaction_data.get("tool_calls", []),
                    "created_at": datetime.utcnow()
                }
                
                stmt = insert(agent_interactions_table).values(interaction)
                session.execute(stmt)
                session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error saving agent interaction with Drizzle: {e}")
            return False
    
    async def create_rfp_record(self, rfp_data: Dict[str, Any]) -> Optional[str]:
        """Create RFP record using Drizzle ORM"""
        if not self.is_available():
            return None
        
        try:
            with self.session_factory() as session:
                rfp_record = {
                    "title": rfp_data.get("title"),
                    "client_name": rfp_data.get("client_name"),
                    "description": rfp_data.get("description"),
                    "submission_date": rfp_data.get("submission_date"),
                    "status": "identified",
                    "priority_score": rfp_data.get("priority_score", 0),
                    "budget_range": rfp_data.get("budget_range"),
                    "technical_requirements": rfp_data.get("technical_requirements", []),
                    "created_at": datetime.utcnow()
                }
                
                stmt = insert(rfps_table).values(rfp_record)
                result = session.execute(stmt)
                session.commit()
                
                if result.inserted_primary_key:
                    return str(result.inserted_primary_key[0])
                
        except Exception as e:
            logger.error(f"Error creating RFP record with Drizzle: {e}")
        
        return None
    
    def health_check(self) -> Dict[str, Any]:
        """Check Drizzle database connection"""
        if not self.is_available():
            return {
                "status": "disabled",
                "message": "Drizzle ORM not available"
            }
        
        try:
            with self.session_factory() as session:
                # Simple query to test connection
                stmt = select(chat_sessions_table).limit(1)
                session.execute(stmt)
                
                return {
                    "status": "healthy",
                    "message": "Drizzle ORM connection successful"
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Drizzle connection failed: {str(e)}"
            }


# Global Drizzle client instance
drizzle_client = DrizzleClient()
