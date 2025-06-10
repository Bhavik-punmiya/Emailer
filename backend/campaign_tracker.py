"""
Campaign Tracker - Handles both temporary and permanent campaign status
"""

import asyncio
from typing import Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CampaignTracker:
    """Tracks campaign status for both temporary and permanent campaigns"""
    
    def __init__(self):
        self.temp_campaigns: Dict[str, dict] = {}
    
    def create_temp_campaign(self, campaign_id: str, total_emails: int) -> None:
        """Create a temporary campaign record"""
        self.temp_campaigns[campaign_id] = {
            "status": "pending",
            "total": total_emails,
            "sent": 0,
            "failed": 0,
            "progress": 0.0,
            "created_at": datetime.utcnow()
        }
        logger.info(f"Created temporary campaign {campaign_id} with {total_emails} emails")
    
    def update_temp_campaign(self, campaign_id: str, sent: int = None, failed: int = None, 
                           status: str = None, progress: float = None) -> None:
        """Update a temporary campaign's status"""
        if campaign_id in self.temp_campaigns:
            campaign = self.temp_campaigns[campaign_id]
            if sent is not None:
                campaign["sent"] = sent
            if failed is not None:
                campaign["failed"] = failed
            if status is not None:
                campaign["status"] = status
            if progress is not None:
                campaign["progress"] = progress
            
            logger.info(f"Updated temp campaign {campaign_id}: {campaign}")
    
    def get_temp_campaign_status(self, campaign_id: str) -> Optional[dict]:
        """Get status of a temporary campaign"""
        return self.temp_campaigns.get(campaign_id)
    
    def complete_temp_campaign(self, campaign_id: str, sent: int, failed: int) -> None:
        """Mark a temporary campaign as completed"""
        if campaign_id in self.temp_campaigns:
            self.temp_campaigns[campaign_id].update({
                "status": "completed",
                "sent": sent,
                "failed": failed,
                "progress": 100.0
            })
            logger.info(f"Completed temp campaign {campaign_id}: {sent} sent, {failed} failed")

# Global campaign tracker instance
campaign_tracker = CampaignTracker() 