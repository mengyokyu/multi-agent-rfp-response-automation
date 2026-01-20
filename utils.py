# ============================================================
# UTILITY FUNCTIONS
# ============================================================

import os
import json
from fastapi_backend import oem_catalog_db, test_pricing_db

def save_catalog():
    """Save catalog to file"""
    os.makedirs('data', exist_ok=True)
    with open('data/oem_catalog.json', 'w') as f:
        json.dump(oem_catalog_db, f, indent=2)

def save_test_pricing():
    """Save test pricing to file"""
    os.makedirs('data', exist_ok=True)
    with open('data/test_pricing.json', 'w') as f:
        json.dump(test_pricing_db, f, indent=2)