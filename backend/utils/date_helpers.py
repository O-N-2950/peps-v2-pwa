"""
Helpers pour formater les dates compatibles JavaScript
"""

from datetime import datetime


def format_datetime_for_js(dt):
    """
    Formate un datetime Python en ISO string compatible JavaScript
    
    Args:
        dt: datetime object ou None
        
    Returns:
        str: Format "2026-01-29T17:30:00Z" ou None
    """
    if not dt:
        return None
    
    # Si c'est déjà une string, parser d'abord
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except:
            return None
    
    # Format ISO sans microsecondes, UTC avec Z
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


def format_date_for_js(dt):
    """
    Formate un datetime Python en date simple YYYY-MM-DD
    
    Args:
        dt: datetime object ou None
        
    Returns:
        str: Format "2026-01-29" ou None
    """
    if not dt:
        return None
    
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except:
            return None
    
    return dt.strftime('%Y-%m-%d')
