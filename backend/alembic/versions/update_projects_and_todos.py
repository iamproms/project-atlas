"""Update projects and todos tables

Revision ID: update_projects_todos
Revises: phase_17_finance
Create Date: 2026-02-06 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = 'update_projects_todos'
down_revision = 'phase_17_finance'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add columns to projects table
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=True, server_default='idea'))
        batch_op.add_column(sa.Column('priority', sa.String(length=20), nullable=True, server_default='medium'))
        batch_op.add_column(sa.Column('deadline', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('tags', sa.Text(), nullable=True))

    # Add column to todos table
    with op.batch_alter_table('todos', schema=None) as batch_op:
        batch_op.add_column(sa.Column('project_id', sa.UUID(), nullable=True))
        batch_op.create_foreign_key('fk_todos_projects', 'projects', ['project_id'], ['id'])

def downgrade() -> None:
    # Remove foreign key constraint and columns from todos
    with op.batch_alter_table('todos', schema=None) as batch_op:
        batch_op.drop_constraint('fk_todos_projects', type_='foreignkey')
        batch_op.drop_column('project_id')
    
    # Remove columns from projects table
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.drop_column('tags')
        batch_op.drop_column('deadline')
        batch_op.drop_column('priority')
        batch_op.drop_column('status')
