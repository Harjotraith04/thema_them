"""add_text_range_fields_to_annotation

Revision ID: 27e4efaa2d3b
Revises: 2bb375977226
Create Date: 2025-06-17 15:27:33.493935

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27e4efaa2d3b'
down_revision: Union[str, None] = '2bb375977226'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotations', sa.Column('start_char', sa.Integer(), nullable=True))
    op.add_column('annotations', sa.Column('end_char', sa.Integer(), nullable=True))
    op.add_column('annotations', sa.Column('text_snapshot', sa.Text(), nullable=True))
    op.drop_constraint('annotations_quote_id_fkey', 'annotations', type_='foreignkey')
    op.drop_constraint('annotations_segment_id_fkey', 'annotations', type_='foreignkey')
    op.drop_column('annotations', 'quote_id')
    op.drop_column('annotations', 'segment_id')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotations', sa.Column('segment_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('annotations', sa.Column('quote_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.create_foreign_key('annotations_segment_id_fkey', 'annotations', 'document_segments', ['segment_id'], ['id'])
    op.create_foreign_key('annotations_quote_id_fkey', 'annotations', 'quotes', ['quote_id'], ['id'])
    op.drop_column('annotations', 'text_snapshot')
    op.drop_column('annotations', 'end_char')
    op.drop_column('annotations', 'start_char')
    # ### end Alembic commands ###
