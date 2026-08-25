from .usuarios import Usuario
from .asignatura import Clase
from .inscripcion import Inscripcion
from .archivo import Archivo
from .historial_calculo import HistorialCalculo
from .notificacion import Notificacion
from config.database import Base
from .clase_qr import ClaseQR

# De esta manera, cuando hagas 'from models import Usuario' en tu aplicación,
# Python sabrá dónde encontrar la clase.
