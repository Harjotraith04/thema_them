"""add_research_details_to_project

Revision ID: beeba770515e
Revises: 6f0d5756ed99
Create Date: 2025-06-29 20:32:25.902753

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = 'beeba770515e'
down_revision: Union[str, None] = '6f0d5756ed99'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add research_details column to projects table
    op.add_column('projects', sa.Column(
        'research_details', JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove research_details column from projects table
    op.drop_column('projects', 'research_details')
