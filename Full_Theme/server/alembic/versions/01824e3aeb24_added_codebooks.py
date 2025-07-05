"""Added codebooks

Revision ID: 01824e3aeb24
Revises: 5bb9c6aa1609
Create Date: 2025-06-19 15:31:11.261291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01824e3aeb24'
down_revision: Union[str, None] = '5bb9c6aa1609'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the codebooks table first
    op.create_table('codebooks',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('project_id', sa.Integer(), nullable=False),
                    sa.Column('is_ai_generated', sa.Boolean(), nullable=True),
                    sa.Column('description', sa.Text(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_codebooks_id'), 'codebooks', ['id'], unique=False)

    # Add codebook_id column as nullable first
    op.add_column('codes', sa.Column(
        'codebook_id', sa.Integer(), nullable=True))

    # Create default codebooks for existing codes
    connection = op.get_bind()

    # Get all unique user-project combinations from existing codes
    result = connection.execute(sa.text("""
        SELECT DISTINCT c.created_by_id, c.project_id 
        FROM codes c
        WHERE c.codebook_id IS NULL
    """))

    for row in result:
        user_id, project_id = row

        # Create default codebook for this user-project combination
        codebook_result = connection.execute(sa.text("""
            INSERT INTO codebooks (name, user_id, project_id, is_ai_generated, description, created_at)
            VALUES ('Default Codebook', :user_id, :project_id, false, 'Default codebook for user-created codes.', NOW())
            RETURNING id
        """), {"user_id": user_id, "project_id": project_id})

        codebook_row = codebook_result.fetchone()
        if codebook_row:
            codebook_id = codebook_row[0]

            # Update all codes for this user-project combination
            connection.execute(sa.text("""
                UPDATE codes 
                SET codebook_id = :codebook_id 
                WHERE created_by_id = :user_id AND project_id = :project_id AND codebook_id IS NULL
            """), {"codebook_id": codebook_id, "user_id": user_id, "project_id": project_id})

    # Now make the column NOT NULL
    op.alter_column('codes', 'codebook_id', nullable=False)

    # Add the foreign key constraint
    op.create_foreign_key(None, 'codes', 'codebooks', ['codebook_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the foreign key constraint first
    op.drop_constraint('codes_codebook_id_fkey', 'codes', type_='foreignkey')
    op.drop_column('codes', 'codebook_id')
    op.drop_index(op.f('ix_codebooks_id'), table_name='codebooks')
    op.drop_table('codebooks')
