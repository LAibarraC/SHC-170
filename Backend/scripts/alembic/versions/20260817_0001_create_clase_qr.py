"""Crear tabla clase_qr y restricción única en inscripciones

Revision ID: 20260817_0001
Revises:
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260817_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea la tabla `clase_qr` y añade la restricción única en `inscripciones`."""
    # 1) Tabla de QRs temporales generados por docentes
    op.create_table(
        "clase_qr",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("clase_id", sa.Integer(), nullable=False),
        sa.Column("docente_id", sa.Integer(), nullable=False),
        sa.Column("fecha_creacion", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("fecha_expiracion", sa.DateTime(), nullable=False),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.ForeignKeyConstraint(["clase_id"], ["clases.id"], name="fk_clase_qr_clase_id_clases"),
        sa.ForeignKeyConstraint(["docente_id"], ["usuarios.id"], name="fk_clase_qr_docente_id_usuarios"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_clase_qr_token"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_clase_qr_token", "clase_qr", ["token"], unique=True)
    op.create_index("ix_clase_qr_clase_id", "clase_qr", ["clase_id"])
    op.create_index("ix_clase_qr_docente_id", "clase_qr", ["docente_id"])

    # 2) Defensa a nivel de base de datos para evitar matrículas duplicadas
    #    (un mismo estudiante no puede inscribirse dos veces a la misma clase).
    #    La restricción se nombra `uq_inscripcion_clase_estudiante` y debe
    #    coincidir con la declarada en el modelo Inscripcion.
    op.create_unique_constraint(
        "uq_inscripcion_clase_estudiante",
        "inscripciones",
        ["clase_id", "estudiante_id"],
    )


def downgrade() -> None:
    """Revierte los cambios: elimina la restricción única y la tabla clase_qr."""
    op.drop_constraint("uq_inscripcion_clase_estudiante", "inscripciones", type_="unique")
    op.drop_index("ix_clase_qr_docente_id", table_name="clase_qr")
    op.drop_index("ix_clase_qr_clase_id", table_name="clase_qr")
    op.drop_index("ix_clase_qr_token", table_name="clase_qr")
    op.drop_table("clase_qr")
