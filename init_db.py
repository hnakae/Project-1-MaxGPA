"""
Database initialization entry point.

Usage:
    python init_db.py                     # use default data/raw/ directory
    python init_db.py path/to/grade/csvs  # use a custom grade CSV directory

Drop grade CSVs into data/raw/ before running. All *.csv files in that
directory are ingested automatically. Major requirements are loaded from
data/meta/major_requirements/*.csv and reconciliation from
data/meta/Reconciliation.csv.
"""

import sys
from db.database import initialize_database

if __name__ == '__main__':
    initialize_database(sys.argv[1] if len(sys.argv) > 1 else None)
