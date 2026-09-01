import os
import random
import hashlib
import bcrypt
import jwt
import urllib.parse
from datetime import datetime, timedelta, timezone
import asyncio
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import concurrent.futures
from fastapi import HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from config.database import get_db
import models
from validators.auth import (
    UsuarioRegistro, UsuarioLogin, RecuperarPassword, ResetearPassword,
    CambiarPasswordPerfil, ForgotPasswordRequest, ResetPasswordRequest,
    CambiarRol, CambiarEstado, VerificarEmailRequest, GoogleLoginRequest,
    AsignarRolInicial
)

from google.oauth2 import id_token
from google.auth.transport import requests

load_dotenv()

FECHA_LIMITE_MATRICULACION = "2026-06-30"
recovery_tokens = {}

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY no está definida en las variables de entorno. Configúrala en el archivo .env")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# --- UTILIDADES DE SEGURIDAD ---

def get_password_hash(password: str) -> str:
    password_truncated = password[:72]
    pre_hashed = hashlib.sha256(password_truncated.encode("utf-8")).hexdigest()
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pre_hashed.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_truncated = plain_password[:72]
    try:
        pre_hashed = hashlib.sha256(plain_truncated.encode("utf-8")).hexdigest()
        if bcrypt.checkpw(pre_hashed.encode("utf-8"), hashed_password.encode("utf-8")):
            return True
    except Exception:
        pass
    try:
        if bcrypt.checkpw(plain_truncated.encode("utf-8"), hashed_password.encode("utf-8")):
            return True
    except Exception:
        pass
    return plain_password == hashed_password

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": email, "exp": expire, "purpose": "password_reset"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "password_reset":
            return None
        return payload.get("sub")
    except jwt.PyJWTError:
        return None

# Los middlewares get_current_user y require_role se han movido a middlewares/auth.py

# --- LÓGICA DE CORREOS SMTP ---
def _send_email_sync(to_email: str, subject: str, html_content: str, logo_path: str = None):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not sender_email or not sender_password:
        print("Falta configuración SMTP en .env")
        return False

    msg = MIMEMultipart('related')
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg_alt = MIMEMultipart('alternative')
    msg.attach(msg_alt)
    msg_alt.attach(MIMEText(html_content, 'html'))
    
    if logo_path and os.path.exists(logo_path):
        try:
            with open(logo_path, 'rb') as f:
                img_data = f.read()
            
            ext = os.path.splitext(logo_path)[1].lower()
            if ext == '.svg':
                img = MIMEImage(img_data, _subtype='svg+xml')
            else:
                img = MIMEImage(img_data)
                
            img.add_header('Content-ID', '<logo_carrera>')
            img.add_header('Content-Disposition', 'inline')
            msg.attach(img)
        except Exception as e:
            print(f"Error adjuntando logo: {e}")

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando correo SMTP: {e}")
        return False

async def send_email_async(to_email: str, subject: str, html_content: str, logo_path: str = None):
    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, _send_email_sync, to_email, subject, html_content, logo_path)
    return result

# --- LÓGICA DE CONTROLADORES ---

async def verificar_email_logic(req: VerificarEmailRequest, db: AsyncSession):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == req.email))
    usuario_existente = result.scalars().first()
    return {"existe": True} if usuario_existente else {"existe": False}

async def registrar_usuario_logic(usuario: UsuarioRegistro, db: AsyncSession):
    try:
        password_plana = usuario.password[:72]
        result = await db.execute(select(models.Usuario).filter(models.Usuario.email == usuario.email))
        usuario_existente = result.scalars().first()
        
        if usuario_existente:
            return JSONResponse(status_code=400, content={"error": "Este correo electrónico ya está registrado."})
        
        password_hasheada = get_password_hash(password_plana)
        rol_final = "Docente" if usuario.rol and usuario.rol.strip().lower() == "docente" else "Estudiante"
        nuevo_usuario = models.Usuario(
            email=usuario.email, nombre=usuario.nombre, password=password_hasheada,
            rol=rol_final, perfil=rol_final, institucion=""
        )
        
        db.add(nuevo_usuario)
        await db.commit()
        await db.refresh(nuevo_usuario)
        
        # Crear notificación en el sistema
        notif_activacion = models.Notificacion(
            tipo="sistema",
            mensaje="Se ha enviado un mensaje de confirmación a tu correo electrónico. Por favor, revísalo para asegurar que podrás recuperar tu contraseña en el futuro.",
            usuario_id=nuevo_usuario.id,
            leido=False
        )
        db.add(notif_activacion)
        await db.commit()

        # Enviar correo de activación en segundo plano (no bloqueante)
        asunto = "Activación de cuenta - Simulador Empresarial"
        logo_path = os.path.join(os.path.dirname(__file__), "..", "public", "images", "Logo-Adm.svg")
        
        cuerpo = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="text-align: center; margin-bottom: 20px; background-color: #FF7000; padding: 20px; border-radius: 8px;">
                    <img src="cid:logo_carrera" alt="Administración de Empresas" style="max-width: 250px; height: auto;" />
                </div>
                <h2>¡Bienvenido al Simulador Empresarial, {usuario.nombre}!</h2>
                <p>Tu cuenta ha sido registrada exitosamente con el correo <strong>{usuario.email}</strong>.</p>
                <p>Te enviamos este mensaje para confirmar que tu correo está activo. A partir de ahora podrás usar este correo para recuperar tu contraseña si la olvidas.</p>
                <p>Saludos,<br>El equipo del Simulador Empresarial</p>
            </body>
        </html>
        """
        
        # Función auxiliar segura para enviar correo en background
        async def _enviar_correo_background():
            try:
                await send_email_async(usuario.email, asunto, cuerpo, logo_path)
            except Exception as email_err:
                print(f"Advertencia: No se pudo enviar correo de bienvenida a {usuario.email}: {email_err}")

        asyncio.create_task(_enviar_correo_background())
        
        return {"message": "Usuario registrado con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al registrar usuario: {str(e)}")

async def login_local_logic(credentials: UsuarioLogin, db: AsyncSession):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == credentials.email))
    user_info = result.scalars().first()
    
    if not user_info or not verify_password(credentials.password, user_info.password):
        return JSONResponse(status_code=401, content={"error": "Correo o contraseña incorrectos"})
    
    if not getattr(user_info, "activo", True):
        return JSONResponse(status_code=403, content={"error": "Cuenta suspendida"})
        
    access_token = create_access_token(data={"id": user_info.id, "email": user_info.email, "rol": user_info.rol})
    
    requiere_rol = (not user_info.rol or user_info.rol == "Pendiente")
    return {
        "token": access_token, "id": user_info.email, "nombre": user_info.nombre,
        "rol": user_info.rol, "email": user_info.email, "perfil": user_info.perfil,
        "institucion": user_info.institucion, "requiere_rol": requiere_rol
    }

async def login_google_logic(req: GoogleLoginRequest, db: AsyncSession):
    try:
        # Client ID desde el entorno
        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not CLIENT_ID:
            raise ValueError("GOOGLE_CLIENT_ID no configurado en el servidor")
        
        # Validar el token (id_token) con Google
        idinfo = id_token.verify_oauth2_token(req.token, requests.Request(), CLIENT_ID)
        
        email = idinfo['email']
        nombre = idinfo.get('name', 'Usuario Google')
        result = await db.execute(select(models.Usuario).filter(models.Usuario.email == email))
        user_info = result.scalars().first()

        es_nuevo = False
        # Si no existe, lo creamos con rol Pendiente para que elija su rol
        if not user_info:
            es_nuevo = True
            password_hasheada = get_password_hash(os.urandom(24).hex()) # Contraseña aleatoria (login con google)
            user_info = models.Usuario(
                email=email,
                nombre=nombre,
                password=password_hasheada,
                rol="Pendiente",
                perfil="Pendiente",
                institucion=""
            )
            db.add(user_info)
            await db.commit()
            await db.refresh(user_info)
        
        if not getattr(user_info, "activo", True):
            return JSONResponse(status_code=403, content={"error": "Cuenta suspendida"})
            
        access_token = create_access_token(data={"id": user_info.id, "email": user_info.email, "rol": user_info.rol})
        requiere_rol = (not user_info.rol or user_info.rol == "Pendiente" or es_nuevo)
        
        return {
            "token": access_token, "id": user_info.email, "nombre": user_info.nombre,
            "rol": user_info.rol, "email": user_info.email, "perfil": user_info.perfil,
            "institucion": user_info.institucion, "requiere_rol": requiere_rol, "es_nuevo": es_nuevo
        }

    except ValueError as e:
        # Invalid token
        return JSONResponse(status_code=401, content={"error": f"Token de Google inválido: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error interno en login de Google: {str(e)}"})

async def forgot_password_logic(data: ForgotPasswordRequest, db: AsyncSession):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == data.email))
    usuario = result.scalars().first()
    
    if usuario:
        token = create_reset_token(usuario.email)
        # Se añade /#/ porque el frontend usa HashRouter
        reset_link = f"{FRONTEND_URL}/#/reset-password?token={token}"
        
        asunto = "Recuperacion de Contrasena - Software Estadistico"
        logo_path = os.path.join(os.path.dirname(__file__), "..", "public", "images", "Logo-Adm.svg")
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; padding: 30px; background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 20px; background-color: #FF7000; padding: 20px; border-radius: 8px;">
                <img src="cid:logo_carrera" alt="Administración de Empresas" style="max-width: 250px; height: auto;" />
              </div>
              <h2 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 15px; margin-top: 0;">Restablecer Contraseña</h2>
              <p>Hola, <strong>{usuario.nombre}</strong>:</p>
              <p>Has solicitado restablecer tu contraseña para acceder a nuestro Simulador Empresarial.</p>
              <p>Por favor, haz clic en el botón de abajo para restablecer tus credenciales. Este enlace expirará en <strong>15 minutos</strong> por tu seguridad.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="{reset_link}" style="background-color: #3498db; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(52,152,219,0.2);">Restablecer Contraseña</a>
              </div>
              <p>Si el botón de arriba no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #3498db;"><a href="{reset_link}" style="color: #3498db; text-decoration: none;">{reset_link}</a></p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
              <p style="font-size: 0.85em; color: #7f8c8d; text-align: center; margin-bottom: 0;">Si tú no has solicitado este cambio, por favor ignora este correo electrónico de forma segura.</p>
            </div>
          </body>
        </html>
        """
        success = await send_email_async(usuario.email, asunto, html, logo_path)
        if not success:
            raise HTTPException(status_code=500, detail="Error interno al enviar el correo de recuperación.")

                
    return {"message": "Si el correo está registrado, recibirás un enlace en tu bandeja de entrada"}

async def reset_password_logic(data: ResetPasswordRequest, db: AsyncSession):
    email = verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="El token de recuperacion es invalido o ha expirado.")
        
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == email))
    usuario = result.scalars().first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    usuario.password = get_password_hash(data.nueva_contrasena)
    await db.commit()
    return {"message": "Contrasena restablecida exitosamente."}

async def recuperar_password_logic(data: RecuperarPassword, db: AsyncSession):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == data.email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "No existe ningún usuario registrado con este correo."})
    
    token = str(random.randint(100000, 999999))
    expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
    recovery_tokens[data.email] = (token, expiry)  # Guardamos el token con su fecha de expiración
    return {"message": "Token de recuperación generado con éxito.", "token": token}

async def resetear_password_logic(data: ResetearPassword, db: AsyncSession):
    entry = recovery_tokens.get(data.email)
    if not entry:
        return JSONResponse(status_code=400, content={"error": "Token de recuperación inválido o vencido."})
    token_valido, expiry = entry
    if token_valido != data.token or datetime.now(timezone.utc) > expiry:
        recovery_tokens.pop(data.email, None)  # Limpiar token inválido/expirado
        return JSONResponse(status_code=400, content={"error": "Token de recuperación inválido o vencido."})
    
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == data.email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado."})
    
    usuario.password = get_password_hash(data.nuevo_password)
    await db.commit()
    recovery_tokens.pop(data.email, None)
    return {"message": "Contraseña restablecida correctamente."}

async def cambiar_password_perfil_logic(data: CambiarPasswordPerfil, db: AsyncSession):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == data.email))
    usuario = result.scalars().first()
    if not usuario or not verify_password(data.password_actual, usuario.password):
        return JSONResponse(status_code=400, content={"error": "La contraseña actual es incorrecta."})
    
    usuario.password = get_password_hash(data.password_nuevo)
    await db.commit()
    return {"message": "Contraseña cambiada exitosamente."}

async def eliminar_cuenta_logic(datos: UsuarioLogin, db: AsyncSession):
    from sqlalchemy import delete
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == datos.email))
    usuario = result.scalars().first()
    if not usuario or not verify_password(datos.password, usuario.password):
        return JSONResponse(status_code=401, content={"error": "Contraseña de confirmación incorrecta"})
    
    await db.execute(delete(models.Inscripcion).filter(models.Inscripcion.estudiante_id == usuario.id))
    await db.execute(delete(models.HistorialCalculo).filter(models.HistorialCalculo.usuario_id == usuario.id))
    await db.execute(delete(models.Archivo).filter(models.Archivo.usuario_id == usuario.id))
    
    result = await db.execute(select(models.Clase).filter(models.Clase.docente_id == usuario.id))
    clases_docente = result.scalars().all()
    for clase in clases_docente:
        await db.execute(delete(models.Inscripcion).filter(models.Inscripcion.clase_id == clase.id))
        await db.execute(delete(models.Archivo).filter(models.Archivo.clase_id == clase.id))
        await db.execute(delete(models.HistorialCalculo).filter(models.HistorialCalculo.clase_id == clase.id))
        await db.delete(clase)
        
    await db.delete(usuario)
    await db.commit()
    return {"message": "Cuenta eliminada con éxito"}

async def cambiar_rol_logic(datos: CambiarRol, db: AsyncSession):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == datos.email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})
    
    usuario.rol = datos.nuevo_rol
    usuario.perfil = datos.nuevo_rol
    
    nueva_notificacion = models.Notificacion(
        tipo="rol_update",
        mensaje=f"Tu cuenta ha sido actualizada. Tu nuevo rol en la plataforma es: {datos.nuevo_rol}.",
        usuario_id=usuario.id,
        leido=False
    )
    db.add(nueva_notificacion)
    await db.commit()
    return {"message": f"El rol del usuario ha sido actualizado a {datos.nuevo_rol}"}

async def asignar_rol_inicial_logic(datos: AsignarRolInicial, current_user: models.Usuario, db: AsyncSession):
    rol_final = "Docente" if datos.rol and datos.rol.strip().lower() == "docente" else "Estudiante"
    current_user.rol = rol_final
    current_user.perfil = rol_final
    await db.commit()
    await db.refresh(current_user)
    
    access_token = create_access_token(data={"id": current_user.id, "email": current_user.email, "rol": current_user.rol})
    return {
        "token": access_token,
        "id": current_user.email,
        "nombre": current_user.nombre,
        "rol": current_user.rol,
        "email": current_user.email,
        "perfil": current_user.perfil,
        "institucion": current_user.institucion,
        "requiere_rol": False
    }

async def cambiar_estado_logic(datos: CambiarEstado, db: AsyncSession, current_user_id: int):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == datos.email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})
        
    if usuario.id == current_user_id:
        return JSONResponse(status_code=400, content={"error": "No puedes suspender tu propia cuenta"})
        
    usuario.activo = datos.activo
    await db.commit()
    return {"message": f"El usuario ha sido {'activado' if datos.activo else 'suspendido'} con éxito"}

async def admin_eliminar_usuario_logic(email: str, db: AsyncSession, current_user_id: int):
    from sqlalchemy import delete
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == email))
    usuario = result.scalars().first()
    if not usuario:
        return JSONResponse(status_code=404, content={"error": "Usuario no encontrado"})
        
    if usuario.id == current_user_id:
        return JSONResponse(status_code=400, content={"error": "No puedes eliminar tu propia cuenta"})
        
    await db.execute(delete(models.Inscripcion).filter(models.Inscripcion.estudiante_id == usuario.id))
    await db.execute(delete(models.HistorialCalculo).filter(models.HistorialCalculo.usuario_id == usuario.id))
    await db.execute(delete(models.Archivo).filter(models.Archivo.usuario_id == usuario.id))
    await db.execute(delete(models.Notificacion).filter(models.Notificacion.usuario_id == usuario.id))
    
    result = await db.execute(select(models.Clase).filter(models.Clase.docente_id == usuario.id))
    clases_docente = result.scalars().all()
    for clase in clases_docente:
        await db.execute(delete(models.Inscripcion).filter(models.Inscripcion.clase_id == clase.id))
        await db.execute(delete(models.Archivo).filter(models.Archivo.clase_id == clase.id))
        await db.execute(delete(models.HistorialCalculo).filter(models.HistorialCalculo.clase_id == clase.id))
        await db.delete(clase)
        
    await db.delete(usuario)
    await db.commit()
    return {"message": "Usuario eliminado con éxito"}

async def obtener_usuarios_logic(db: AsyncSession):
    result = await db.execute(select(models.Usuario))
    usuarios = result.scalars().all()
    return [{
        "id": u.id, "email": u.email, "nombre": u.nombre, "rol": u.rol, 
        "perfil": u.perfil, "institucion": u.institucion, "activo": u.activo,
        "fecha_creacion": u.fecha_creacion.strftime("%Y-%m-%d %H:%M:%S") if u.fecha_creacion else None
    } for u in usuarios]

async def obtener_estadisticas_admin_logic(db: AsyncSession):
    from collections import defaultdict
    from datetime import datetime, timedelta
    
    ahora = datetime.now()
    hace_7d = ahora - timedelta(days=7)
    hace_30d = ahora - timedelta(days=30)
    
    # 1. Usuarios
    res_usuarios = await db.execute(select(models.Usuario))
    usuarios = res_usuarios.scalars().all()
    
    total_usuarios = len(usuarios)
    usuarios_activos = sum(1 for u in usuarios if getattr(u, 'activo', True))
    usuarios_suspendidos = total_usuarios - usuarios_activos
    
    usuarios_7d = 0
    usuarios_30d = 0
    
    roles_count = defaultdict(int)
    registros_por_mes = defaultdict(int)
    
    for u in usuarios:
        rol = u.rol or "Sin Rol"
        roles_count[rol] += 1
        if u.fecha_creacion:
            mes_str = u.fecha_creacion.strftime("%Y-%m")
            registros_por_mes[mes_str] += 1
            if u.fecha_creacion >= hace_7d:
                usuarios_7d += 1
            if u.fecha_creacion >= hace_30d:
                usuarios_30d += 1
            
    # 2. Clases e Inscripciones
    res_clases = await db.execute(select(models.Clase))
    clases = res_clases.scalars().all()
    total_clases = len(clases)
    
    res_inscripciones = await db.execute(select(models.Inscripcion))
    inscripciones = res_inscripciones.scalars().all()
    total_inscripciones = len(inscripciones)
    
    # Conteo de inscritos por clase
    inscritos_por_clase = defaultdict(int)
    for ins in inscripciones:
        inscritos_por_clase[ins.clase_id] += 1
        
    docentes_map = {u.id: u.nombre for u in usuarios}
    
    top_clases = []
    for c in clases:
        top_clases.append({
            "id": c.id,
            "nombre": c.nombre,
            "codigo": c.codigo_acceso,
            "docente": docentes_map.get(c.docente_id, "Desconocido"),
            "estudiantes_count": inscritos_por_clase.get(c.id, 0),
            "fecha_creacion": c.fecha_creacion.strftime("%Y-%m-%d") if c.fecha_creacion else None
        })
    top_clases.sort(key=lambda x: x["estudiantes_count"], reverse=True)
    
    # 3. Historial de Cálculos
    res_calculos = await db.execute(select(models.HistorialCalculo))
    calculos = res_calculos.scalars().all()
    total_calculos = len(calculos)
    
    calculos_7d = 0
    calculos_30d = 0
    usuarios_con_calculo_7d = set()
    usuarios_con_calculo_30d = set()
    
    analisis_count = defaultdict(int)
    calculos_por_mes = defaultdict(int)
    for calc in calculos:
        tipo = calc.tipo_analisis or "Otro"
        analisis_count[tipo] += 1
        if calc.fecha_creacion:
            mes_str = calc.fecha_creacion.strftime("%Y-%m")
            calculos_por_mes[mes_str] += 1
            if calc.fecha_creacion >= hace_7d:
                calculos_7d += 1
                usuarios_con_calculo_7d.add(calc.usuario_id)
            if calc.fecha_creacion >= hace_30d:
                calculos_30d += 1
                usuarios_con_calculo_30d.add(calc.usuario_id)

    # Combinamos usuarios que se registraron o que hicieron actividad en el período
    usuarios_unicos_7d = len(set(u.id for u in usuarios if u.fecha_creacion and u.fecha_creacion >= hace_7d) | usuarios_con_calculo_7d)
    usuarios_unicos_30d = len(set(u.id for u in usuarios if u.fecha_creacion and u.fecha_creacion >= hace_30d) | usuarios_con_calculo_30d)
            
    # 4. Archivos
    res_archivos = await db.execute(select(models.Archivo))
    archivos = res_archivos.scalars().all()
    total_archivos = len(archivos)
    total_bytes = sum(getattr(a, 'size_bytes', 0) or 0 for a in archivos)
    
    # Formatear series de tiempo ordenadas
    todos_meses = sorted(set(list(registros_por_mes.keys()) + list(calculos_por_mes.keys())))
    evolucion_temporal = []
    for m in todos_meses:
        evolucion_temporal.append({
            "mes": m,
            "registros": registros_por_mes.get(m, 0),
            "calculos": calculos_por_mes.get(m, 0)
        })
        
    distribucion_roles = [{"name": k, "value": v} for k, v in roles_count.items()]
    distribucion_analisis = [{"name": k, "cantidad": v} for k, v in analisis_count.items()]
    
    return {
        "kpis": {
            "total_usuarios": total_usuarios,
            "usuarios_activos": usuarios_activos,
            "usuarios_suspendidos": usuarios_suspendidos,
            "total_estudiantes": roles_count.get("Estudiante", 0),
            "total_docentes": roles_count.get("Docente", 0),
            "total_administradores": roles_count.get("Administrador", 0),
            "total_clases": total_clases,
            "total_inscripciones": total_inscripciones,
            "total_calculos": total_calculos,
            "total_archivos": total_archivos,
            "total_mb": round(total_bytes / (1024 * 1024), 2),
            "actividad_periodo": {
                "todo": {
                    "usuarios": total_usuarios,
                    "calculos": total_calculos
                },
                "30d": {
                    "usuarios": max(usuarios_unicos_30d, 1 if total_usuarios > 0 else 0),
                    "calculos": calculos_30d
                },
                "7d": {
                    "usuarios": max(usuarios_unicos_7d, 1 if total_usuarios > 0 else 0),
                    "calculos": calculos_7d
                }
            }
        },
        "distribucion_roles": distribucion_roles,
        "evolucion_temporal": evolucion_temporal,
        "distribucion_analisis": distribucion_analisis,
        "top_clases": top_clases[:10]
    }
