"""merge_heads

Revision ID: decf52653843
Revises: 20260817_0001, a5a0ffe9a306
Create Date: 2026-09-02 09:46:54.468778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'decf52653843'
down_revision: Union[str, None] = ('20260817_0001', 'a5a0ffe9a306')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Aplica los cambios a la base de datos."""
    pass


def downgrade() -> None:
    """Revierte los cambios (rollback)."""
    pass
