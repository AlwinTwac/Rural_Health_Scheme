"""
AI-Powered Trip Optimization Algorithm
Uses priority-based scheduling and distance optimization
"""
import numpy as np
from typing import List, Dict
from datetime import datetime, timedelta

class TripOptimizer:
    def __init__(self):
        self.severity_weights = {
            'critical': 100,
            'high': 50,
            'medium': 25,
            'low': 10
        }
    
    def calculate_priority_score(self, request: Dict) -> float:
        """
        Calculate priority score based on severity, time waiting, and distance
        """
        severity_score = self.severity_weights.get(request['severity'], 10)
        
        # Time waiting factor (increases priority over time)
        time_waiting = (datetime.now() - datetime.fromisoformat(request['timestamp'])).seconds / 60
        time_factor = min(time_waiting / 30, 2.0)  # Max 2x multiplier after 30 min
        
        # Distance factor (closer is slightly better)
        distance_factor = 1 / (1 + request['distance'] / 10)
        
        return severity_score * (1 + time_factor) * distance_factor
    
    def optimize_route(self, requests: List[Dict]) -> Dict:
        """
        Optimize route using greedy algorithm with priority scoring
        """
        if not requests:
            return {'stops': [], 'totalDistance': 0, 'totalTime': 0}
        
        # Calculate priority scores
        for req in requests:
            req['priorityScore'] = self.calculate_priority_score(req)
        
        # Sort by priority score (highest first)
        sorted_requests = sorted(requests, key=lambda x: x['priorityScore'], reverse=True)
        
        # Calculate route metrics
        total_distance = sum(r['distance'] for r in sorted_requests)
        total_time = sum(r.get('estimatedTime', 10) for r in sorted_requests)
        
        # Add arrival times
        current_time = datetime.now()
        for i, req in enumerate(sorted_requests):
            req['order'] = i + 1
            req['arrivalTime'] = (current_time + timedelta(minutes=total_time * i / len(sorted_requests))).isoformat()
        
        return {
            'stops': sorted_requests,
            'totalDistance': round(total_distance, 1),
            'totalTime': total_time,
            'optimizationScore': 92  # Placeholder score
        }

# Singleton instance
optimizer = TripOptimizer()
