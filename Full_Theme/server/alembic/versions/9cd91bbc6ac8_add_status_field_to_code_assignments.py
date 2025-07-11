"""Add status field to code assignments

Revision ID: 9cd91bbc6ac8
Revises: 716aae6bba4a
Create Date: 2025-07-02 14:51:46.710442

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9cd91bbc6ac8'
down_revision: Union[str, None] = '716aae6bba4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add status column as nullable first
    op.add_column('code_assignments', sa.Column(
        'status', sa.String(length=20), nullable=True))

    # Update existing records to have 'pending' status
    op.execute(
        "UPDATE code_assignments SET status = 'pending' WHERE status IS NULL")

    # Make the column non-nullable
    op.alter_column('code_assignments', 'status', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('code_assignments', 'status')
    # ### end Alembic commands ###
