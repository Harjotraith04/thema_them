"""dev schema changes

Revision ID: bed53bfa3797
Revises: 539e86b185ee
Create Date: 2025-06-17 13:08:58.156639

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bed53bfa3797'
down_revision: Union[str, None] = '539e86b185ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
