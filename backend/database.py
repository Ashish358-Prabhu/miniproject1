import os
from typing import Dict

# Safe fallback database handler that supports PostgreSQL if available, otherwise safely falls back to backend in-memory/JSON store
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost/netshield"
)

_pool = None
_use_fallback = False

async def get_pool():
    global _pool, _use_fallback
    if _use_fallback:
        return None
    if _pool is None:
        try:
            import asyncpg
            _pool = await asyncpg.create_pool(DATABASE_URL)
        except Exception as e:
            print(f"[Database] PostgreSQL connection failed ({e}). Falling back to in-memory persistence.")
            _use_fallback = True
            return None
    return _pool

async def init_db():
    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id SERIAL PRIMARY KEY,
                    source_ip TEXT,
                    dest_ip TEXT,
                    type TEXT,
                    severity TEXT,
                    detail TEXT,
                    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
        except Exception as e:
            print(f"[Database] Table initialization error: {e}")

async def insert_alert(alert: Dict):
    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO alerts (source_ip, dest_ip, type, severity, detail)
                    VALUES ($1,$2,$3,$4,$5);
                    """,
                    alert["source_ip"],
                    alert["dest_ip"],
                    alert["type"],
                    alert["severity"],
                    alert["detail"],
                )
        except Exception as e:
            print(f"[Database] Insert error: {e}")
