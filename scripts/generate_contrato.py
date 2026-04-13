#!/usr/bin/env python3
"""
generate_contrato.py
Genera contratos de trabajo profesionales para Chile.
Lee JSON desde stdin, escribe bytes PDF a stdout.
Tipos soportados: indefinido, plazo_fijo, proyecto, honorarios, part_time
"""

import sys
import json
import base64
import io
from datetime import datetime

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

# ── Colores Unabase ───────────────────────────────────────────────────────────
TEAL      = colors.HexColor("#2a9d8f")
TEAL_DARK = colors.HexColor("#1f7a6e")
GRAY_DARK = colors.HexColor("#1e2a35")
GRAY_MID  = colors.HexColor("#4a5568")
GRAY_LIGHT= colors.HexColor("#e2e8f0")
WHITE     = colors.white
BLACK     = colors.black

# ── Estilos ───────────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["title"] = ParagraphStyle(
        "title", parent=base["Normal"],
        fontSize=15, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_CENTER,
        spaceAfter=4,
    )
    styles["subtitle"] = ParagraphStyle(
        "subtitle", parent=base["Normal"],
        fontSize=11, fontName="Helvetica-Bold",
        textColor=TEAL, alignment=TA_CENTER,
        spaceAfter=2,
    )
    styles["partes"] = ParagraphStyle(
        "partes", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=14, spaceAfter=10,
    )
    styles["clause_title"] = ParagraphStyle(
        "clause_title", parent=base["Normal"],
        fontSize=10, fontName="Helvetica-Bold",
        textColor=TEAL_DARK,
        spaceBefore=10, spaceAfter=4,
        underlineWidth=0.5,
    )
    styles["clause_body"] = ParagraphStyle(
        "clause_body", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=14, spaceAfter=6,
    )
    styles["clause_num"] = ParagraphStyle(
        "clause_num", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=14, spaceAfter=4,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=13, leftIndent=18, spaceAfter=3,
    )
    styles["footer"] = ParagraphStyle(
        "footer", parent=base["Normal"],
        fontSize=8, fontName="Helvetica",
        textColor=GRAY_MID, alignment=TA_CENTER,
    )
    styles["sign_name"] = ParagraphStyle(
        "sign_name", parent=base["Normal"],
        fontSize=9, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_CENTER,
    )
    styles["sign_role"] = ParagraphStyle(
        "sign_role", parent=base["Normal"],
        fontSize=8.5, fontName="Helvetica",
        textColor=GRAY_MID, alignment=TA_CENTER,
    )
    return styles


# ── Utilidades ────────────────────────────────────────────────────────────────
MESES_ES = [
    "", "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
]

def fmt_date(d):
    """'2025-10-01' → '1 de octubre de 2025'"""
    if not d: return "—"
    try:
        dt = datetime.strptime(str(d)[:10], "%Y-%m-%d")
        return f"{dt.day} de {MESES_ES[dt.month]} de {dt.year}"
    except:
        return str(d)

def fmt_clp(n):
    if not n: return "$0"
    try:
        return f"${int(n):,}".replace(",", ".")
    except:
        return str(n)

def p(text, style):
    return Paragraph(text, style)

def sp(h=0.3):
    return Spacer(1, h * cm)

# ── Header con logo ───────────────────────────────────────────────────────────
def build_header(data, styles):
    org  = data.get("organizacion", {})
    logo = data.get("logo_base64")
    tipo = data.get("tipo_contrato", "indefinido")

    TIPO_LABELS = {
        "indefinido":  "CONTRATO DE TRABAJO\nDuración Indefinida",
        "plazo_fijo":  "CONTRATO DE TRABAJO\nPlazo Fijo",
        "proyecto":    "CONTRATO DE TRABAJO\nPor Proyecto / Obra",
        "honorarios":  "CONTRATO DE PRESTACIÓN\nDE SERVICIOS A HONORARIOS",
        "part_time":   "CONTRATO DE TRABAJO\nJornada Parcial (Part Time)",
    }
    titulo_label = TIPO_LABELS.get(tipo, "CONTRATO DE TRABAJO")

    elements = []

    # Barra superior teal
    bar_data = [[""]]
    bar = Table(bar_data, colWidths=[17.5*cm], rowHeights=[0.5*cm])
    bar.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), TEAL)]))
    elements.append(bar)
    elements.append(sp(0.4))

    # Logo + título
    if logo:
        try:
            img_data = base64.b64decode(logo)
            from reportlab.platypus import Image
            img_io = io.BytesIO(img_data)
            logo_img = Image(img_io, width=3.5*cm, height=1.4*cm, kind="proportional")
            header_row = [[logo_img, p(titulo_label.replace("\n","<br/>"), styles["title"])]]
            header_table = Table(header_row, colWidths=[4*cm, 13.5*cm])
            header_table.setStyle(TableStyle([
                ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                ("ALIGN",  (1,0), (1,0),   "CENTER"),
            ]))
            elements.append(header_table)
        except:
            elements.append(p(titulo_label.replace("\n","<br/>"), styles["title"]))
    else:
        elements.append(p("<b>" + titulo_label.replace("\n","</b><br/><b>") + "</b>", styles["title"]))

    elements.append(sp(0.2))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(sp(0.4))

    # Datos empresa
    org_text = (
        f"<b>{org.get('nombre','')}</b> · RUT: {org.get('rut','')} · "
        f"{org.get('direccion','')} · {org.get('ciudad','Santiago')}"
    )
    elements.append(p(org_text, styles["footer"]))
    elements.append(sp(0.5))

    return elements


# ── Cláusulas por tipo de contrato ────────────────────────────────────────────

def clausulas_indefinido(data, styles, plazo_fijo=False, part_time=False):
    d = data
    emp  = d.get("empleador",  {})
    trab = d.get("trabajador", {})
    org  = d.get("organizacion", {})
    s    = styles

    nombre_emp    = org.get("nombre", emp.get("nombre", ""))
    rut_emp       = org.get("rut", emp.get("rut", ""))
    rep_nombre    = emp.get("representante", "")
    rep_rut       = emp.get("rut_representante", "")
    domicilio_emp = org.get("direccion", emp.get("domicilio", ""))
    ciudad_emp    = org.get("ciudad", "Santiago")

    nombre_trab   = trab.get("nombre", "")
    rut_trab      = trab.get("rut", "")
    fn_trab       = fmt_date(trab.get("fecha_nacimiento", ""))
    dom_trab      = trab.get("domicilio", "")
    email_trab    = trab.get("email", "")

    cargo         = d.get("cargo", "")
    funciones     = d.get("funciones", [])
    modalidad     = d.get("modalidad", "presencial")
    lugar_trabajo    = d.get("lugar_trabajo", domicilio_emp)
    direccion_trabajo = d.get("direccion_trabajo", lugar_trabajo)
    jornada_horas = d.get("jornada_horas", 44 if not part_time else 22)
    horario       = d.get("horario", "Lunes a jueves de 08:30 a 18:30 horas y viernes de 08:30 a 17:30 horas")
    sueldo_base   = d.get("sueldo_base", 0)
    fecha_inicio  = fmt_date(d.get("fecha_inicio", ""))
    fecha_termino = fmt_date(d.get("fecha_termino", "")) if plazo_fijo else None
    afp           = trab.get("afp", "")
    salud         = trab.get("sistema_salud", "FONASA")
    fecha_doc     = fmt_date(d.get("fecha_documento", datetime.today().strftime("%Y-%m-%d")))

    modalidad_texto = {
        "teletrabajo": f"en la modalidad de teletrabajo desde su domicilio particular ubicado en {direccion_trabajo}",
        "presencial":  f"en las dependencias del Empleador ubicadas en {direccion_trabajo}",
        "hibrido":     f"en modalidad híbrida, combinando trabajo presencial en {direccion_trabajo} y teletrabajo según acuerdo de las Partes",
    }.get(modalidad, f"en {direccion_trabajo}")

    elems = []

    # Intro
    intro = (
        f"En {ciudad_emp}, a {fecha_doc}, entre: por una parte, <b>{nombre_emp}</b>, "
        f"rol \u00fanico tributario n\u00famero {rut_emp}, representada por don/\u00f1a <b>{rep_nombre}</b>, "
        f"c\u00e9dula de identidad n\u00famero {rep_rut}, ambos domiciliados para estos efectos en "
        f"{domicilio_emp} (en adelante, el &ldquo;<b>Empleador</b>&rdquo;); y don/\u00f1a <b>{nombre_trab}</b>, "
        f"c\u00e9dula de identidad n\u00famero {rut_trab}, nacido/a el {fn_trab}, "
        f"domiciliado/a en {dom_trab} (en adelante el &ldquo;<b>Trabajador</b>&rdquo; y junto con el Empleador, "
        f"como las &ldquo;<b>Partes</b>&rdquo;), han convenido la suscripci\u00f3n del siguiente contrato de trabajo "
        f"(en adelante, el &ldquo;<b>Contrato</b>&rdquo;):"
    )
    elems.append(p(intro, s["partes"]))
    elems.append(sp(0.3))

    # PRIMERO
    elems.append(p("<u><b>PRIMERO: Naturaleza y Prestación de los Servicios.</b></u>", s["clause_title"]))
    elems.append(p(
        f"<b>Uno.</b> El Trabajador se compromete y obliga a prestar servicios bajo el cargo de &ldquo;<b><i>{cargo}</i></b>&rdquo;. "
        f"En el ejercicio de su cargo, deberá cumplir con todas las obligaciones y funciones inherentes a su cargo "
        f"y que directa o indirectamente se relacionen con dicha labor{', en especial:' if funciones else '.'}",
        s["clause_body"]
    ))
    for i, fn in enumerate(funciones, 1):
        elems.append(p(f"{i}. {fn}", s["bullet"]))
    if not funciones:
        pass
    elems.append(p(
        f"<b>Dos.</b> El Trabajador desempeñará sus funciones {modalidad_texto}. "
        f"Sin perjuicio de lo anterior, el Empleador podrá requerir la presencia del Trabajador en sus instalaciones "
        f"cuando las necesidades del servicio así lo ameriten, previa coordinación.",
        s["clause_body"]
    ))
    elems.append(p(
        "<b>Tres.</b> El Trabajador se obliga a ejecutar los trabajos de la manera más eficaz posible, "
        "empleando la mayor responsabilidad, eficiencia, dedicación y diligencia, evitando comprometer "
        "la seguridad y prestigio del Empleador, ciñéndose a las directrices e instrucciones impartidas.",
        s["clause_body"]
    ))

    # SEGUNDO
    elems.append(p("<u><b>SEGUNDO: Jornada de Trabajo.</b></u>", s["clause_title"]))
    if part_time:
        elems.append(p(
            f"<b>Uno.</b> El Trabajador estará sujeto a una jornada parcial de trabajo de {jornada_horas} horas semanales, "
            f"distribuidas conforme al siguiente horario: {horario}. "
            f"Dentro de la jornada diaria, el Trabajador tendrá derecho a colación en los términos del artículo 34 del Código del Trabajo.",
            s["clause_body"]
        ))
    else:
        elems.append(p(
            f"<b>Uno.</b> El Trabajador estará sujeto a una jornada ordinaria de trabajo de {jornada_horas} horas semanales, "
            f"distribuidas de la siguiente manera: {horario}. "
            f"Dentro de la jornada diaria el Trabajador tendrá derecho a 1 hora destinada a colación, "
            f"tiempo que no se considerará trabajado conforme lo dispone el artículo 34 del Código del Trabajo.",
            s["clause_body"]
        ))
    elems.append(p(
        "<b>Dos.</b> El Trabajador deberá registrar el cumplimiento de jornada en la plataforma que designe el Empleador. "
        "Todo trabajo en horas extraordinarias deberá pactarse previamente por escrito.",
        s["clause_body"]
    ))

    # TERCERO
    elems.append(p("<u><b>TERCERO: Remuneración.</b></u>", s["clause_title"]))
    elems.append(p(
        f"<b>Uno.</b> La remuneración base del Trabajador será de <b>{fmt_clp(sueldo_base)}.-</b> mensuales, "
        f"de la cual el Empleador deducirá los montos legalmente correspondientes.",
        s["clause_body"]
    ))
    elems.append(p(
        "<b>Dos.</b> El Empleador pagará anualmente una gratificación equivalente al 25% de lo devengado "
        "por concepto de remuneraciones, con un tope de 4,75 ingresos mínimos mensuales (artículo 50 del Código del Trabajo). "
        "Mensualmente se anticipará un doceavo de dicha gratificación.",
        s["clause_body"]
    ))
    elems.append(p(
        "<b>Tres.</b> Las remuneraciones serán pagadas en moneda nacional, por mes calendario vencido, "
        "el último día hábil de cada mes, mediante transferencia electrónica bancaria a la cuenta que el Trabajador informe.",
        s["clause_body"]
    ))
    elems.append(p(
        f"<b>Cuatro.</b> El Trabajador declara encontrarse afiliado a {salud} y a {afp} "
        f"para efectos de las deducciones legales. Es responsabilidad del Trabajador notificar al Empleador "
        f"cualquier cambio en sus instituciones previsionales.",
        s["clause_body"]
    ))

    # CUARTO
    elems.append(p("<u><b>CUARTO: Obligaciones del Trabajador.</b></u>", s["clause_title"]))
    obs = [
        "Cuidar y mantener en perfecto estado de conservación los bienes e instalaciones del Empleador.",
        "Cumplir con las instrucciones y órdenes impartidas por sus superiores.",
        "En caso de inasistencia por enfermedad, justificarla con certificado médico dentro de las 24 horas.",
        "Mantener estricta reserva sobre los antecedentes, negocios y asuntos del Empleador.",
        "Respetar el Reglamento Interno de Orden, Higiene y Seguridad, que se entiende parte integrante de este contrato.",
        "Registrar correctamente el control de asistencia al ingreso y salida.",
        "Acusar recibo de todas las comunicaciones escritas que el Empleador le entregue.",
    ]
    for i, o in enumerate(obs, 1):
        elems.append(p(f"{i}. {o}", s["bullet"]))

    # QUINTO
    elems.append(p("<u><b>QUINTO: Prohibiciones del Trabajador.</b></u>", s["clause_title"]))
    proh = [
        "Entregar información falsa en el desempeño de su actividad.",
        "Utilizar en beneficio propio o de terceros los contratos, bases de datos, know-how y cualquier información del Empleador.",
        "Atender asuntos profesionales particulares dentro del horario de trabajo sin autorización expresa.",
        "Realizar actividades que signifiquen competencia desleal para el Empleador.",
    ]
    for i, pr in enumerate(proh, 1):
        elems.append(p(f"{i}. {pr}", s["bullet"]))

    # SEXTO
    elems.append(p("<u><b>SEXTO: Vigencia.</b></u>", s["clause_title"]))
    if plazo_fijo and fecha_termino:
        elems.append(p(
            f"<b>Uno.</b> El presente contrato tendrá una vigencia de plazo fijo, iniciando el {fecha_inicio} "
            f"y terminando el día <b>{fecha_termino}</b>, fecha en que operará su extinción automática conforme "
            f"al artículo 159 Nº 4 del Código del Trabajo.",
            s["clause_body"]
        ))
    elif part_time:
        elems.append(p(
            f"<b>Uno.</b> El presente contrato de trabajo a jornada parcial será de duración indefinida, "
            f"iniciando la relación laboral el <b>{fecha_inicio}</b>.",
            s["clause_body"]
        ))
    else:
        elems.append(p(
            f"<b>Uno.</b> El presente contrato de trabajo será de duración indefinida.",
            s["clause_body"]
        ))
        elems.append(p(
            "<b>Dos.</b> Cualquiera de las partes podrá ponerle término cuando concurran causales "
            "establecidas en los artículos 159, 160 o 161 del Código del Trabajo.",
            s["clause_body"]
        ))
    elems.append(p(
        f"Las Partes dejan constancia que la relación laboral comienza el <b>{fecha_inicio}</b>.",
        s["clause_body"]
    ))

    # SÉPTIMO
    elems.append(p("<u><b>SÉPTIMO: Sanción por Incumplimiento.</b></u>", s["clause_title"]))
    elems.append(p(
        "La infracción o incumplimiento de cualquiera de las obligaciones de este Contrato "
        "se estimará como incumplimiento grave, facultando al Empleador para poner término al Contrato "
        "sin derecho a indemnización, conforme a las normas laborales vigentes.",
        s["clause_body"]
    ))

    # OCTAVO
    elems.append(p("<u><b>OCTAVO: Modificaciones.</b></u>", s["clause_title"]))
    elems.append(p(
        "Toda modificación acordada deberá constar por escrito en un anexo firmado por ambas Partes. "
        "Se entienden incorporadas al presente instrumento las disposiciones legales que se dicten con "
        "posterioridad a su suscripción.",
        s["clause_body"]
    ))

    # NOVENO
    elems.append(p("<u><b>NOVENO: Comunicaciones Electrónicas.</b></u>", s["clause_title"]))
    elems.append(p(
        f"De conformidad con el artículo 54 inciso 3º del Código del Trabajo, el Trabajador autoriza "
        f"al Empleador para remitir liquidaciones de remuneraciones y demás documentos laborales a su "
        f"correo electrónico personal: <b>{email_trab}</b>. "
        f"Las Partes se autorizan recíprocamente a firmar mediante firma electrónica simple o avanzada "
        f"todos los documentos de naturaleza laboral, conforme a la Ley 19.799.",
        s["clause_body"]
    ))

    # DÉCIMO
    elems.append(p("<u><b>DÉCIMO: Ejemplares.</b></u>", s["clause_title"]))
    elems.append(p(
        "El presente Contrato se firma en 2 ejemplares, quedando uno en poder del Empleador y uno en poder del Trabajador.",
        s["clause_body"]
    ))

    return elems


def clausulas_proyecto(data, styles):
    d = data
    emp  = d.get("empleador",  {})
    trab = d.get("trabajador", {})
    org  = d.get("organizacion", {})
    s    = styles

    nombre_emp    = org.get("nombre", emp.get("nombre", ""))
    rut_emp       = org.get("rut", emp.get("rut", ""))
    rep_nombre    = emp.get("representante", "")
    rep_rut       = emp.get("rut_representante", "")
    domicilio_emp = org.get("direccion", emp.get("domicilio", ""))
    ciudad_emp    = org.get("ciudad", "Santiago")

    nombre_trab  = trab.get("nombre", "")
    rut_trab     = trab.get("rut", "")
    dom_trab     = trab.get("domicilio", "")
    afp          = trab.get("afp", "")
    salud        = trab.get("sistema_salud", "FONASA")

    cargo        = d.get("cargo", "")
    proyecto     = d.get("nombre_proyecto", d.get("proyecto", ""))
    sueldo_base  = d.get("sueldo_base", 0)
    fecha_inicio = fmt_date(d.get("fecha_inicio", ""))
    fecha_term   = fmt_date(d.get("fecha_termino", ""))
    lugar            = d.get("lugar_trabajo", domicilio_emp)
    dir_trabajo      = d.get("direccion_trabajo", lugar)
    fecha_doc    = fmt_date(d.get("fecha_documento", datetime.today().strftime("%Y-%m-%d")))
    funciones    = d.get("funciones", [])

    elems = []

    intro = (
        f"En {ciudad_emp}, a {fecha_doc}, entre: <b>{nombre_emp}</b>, RUT {rut_emp}, "
        f"representada por <b>{rep_nombre}</b>, RUT {rep_rut}, domiciliado/a en {domicilio_emp} "
        f"(en adelante el &ldquo;<b>Empleador</b>&rdquo;); y <b>{nombre_trab}</b>, RUT {rut_trab}, "
        f"domiciliado/a en {dom_trab} (en adelante el &ldquo;<b>Trabajador</b>&rdquo;), acuerdan el siguiente contrato:"
    )
    elems.append(p(intro, s["partes"]))
    elems.append(sp(0.3))

    elems.append(p("<u><b>PRIMERO: Objeto y Cargo.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El Empleador contrata al Trabajador para desempeñar el cargo de <b><i>{cargo}</i></b>, "
        f"en el proyecto denominado &ldquo;<b>{proyecto}</b>&rdquo;, bajo subordinaci\u00f3n y dependencia, "
        f"prestando sus servicios en: {lugar}.",
        s["clause_body"]
    ))
    for i, fn in enumerate(funciones, 1):
        elems.append(p(f"{i}. {fn}", s["bullet"]))

    elems.append(p("<u><b>SEGUNDO: Jornada de Trabajo.</b></u>", s["clause_title"]))
    jornada = d.get("horario", "")
    elems.append(p(
        f"La jornada ordinaria diaria no excederá de 10 horas. "
        f"{'Horario: ' + jornada + '. ' if jornada else ''}"
        f"La jornada se interrumpirá 60 minutos para colación, tiempo no imputable a la jornada. "
        f"Las horas extraordinarias se pagarán conforme a la ley.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>TERCERO: Remuneración.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El Trabajador recibirá una remuneración de <b>{fmt_clp(sueldo_base)}.-</b> "
        f"correspondiente al período del proyecto desde el {fecha_inicio} hasta el {fecha_term}. "
        f"El pago se efectuará al término del contrato mediante transferencia electrónica, "
        f"deduciéndose los descuentos legales y previsionales correspondientes.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>CUARTO: Previsión Social.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El Trabajador declara estar afiliado a {salud} y a {afp}.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>QUINTO: Obligaciones y Confidencialidad.</b></u>", s["clause_title"]))
    elems.append(p(
        "El Trabajador se obliga a cumplir sus funciones con eficiencia y confidencialidad respecto del proyecto, "
        "absteniéndose de divulgar información del proyecto, del cliente y del Empleador. "
        "Tiene expresa prohibición de publicar material relacionado con el proyecto en redes sociales "
        "o cualquier medio, hasta que el Empleador lo autorice expresamente.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>SEXTO: Vigencia.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El presente contrato se pacta exclusivamente para el proyecto indicado, "
        f"iniciando el <b>{fecha_inicio}</b> y concluyendo el <b>{fecha_term}</b>. "
        f"Podrá ponérsele término anticipado cuando concurran causas justificadas conforme a la ley.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>SÉPTIMO: Ejemplares.</b></u>", s["clause_title"]))
    elems.append(p(
        "El presente contrato se firma en 2 ejemplares, quedando uno en poder de cada Parte.",
        s["clause_body"]
    ))

    return elems


def clausulas_honorarios(data, styles):
    d = data
    emp  = d.get("empleador",  {})
    trab = d.get("trabajador", {})
    org  = d.get("organizacion", {})
    s    = styles

    nombre_emp    = org.get("nombre", emp.get("nombre", ""))
    rut_emp       = org.get("rut", emp.get("rut", ""))
    rep_nombre    = emp.get("representante", "")
    rep_rut       = emp.get("rut_representante", "")
    domicilio_emp = org.get("direccion", emp.get("domicilio", ""))
    ciudad_emp    = org.get("ciudad", "Santiago")

    nombre_trab  = trab.get("nombre", "")
    rut_trab     = trab.get("rut", "")
    dom_trab     = trab.get("domicilio", "")

    cargo        = d.get("cargo", "")
    proyecto     = d.get("nombre_proyecto", d.get("proyecto", ""))
    valor        = d.get("sueldo_base", d.get("honorario", 0))
    fecha_inicio = fmt_date(d.get("fecha_inicio", ""))
    fecha_term   = fmt_date(d.get("fecha_termino", ""))
    servicios    = d.get("descripcion_servicios", cargo)
    fecha_doc    = fmt_date(d.get("fecha_documento", datetime.today().strftime("%Y-%m-%d")))

    elems = []

    intro = (
        f"En {ciudad_emp}, a {fecha_doc}, entre <b>{nombre_emp}</b>, RUT {rut_emp}, "
        f"domiciliada en {domicilio_emp}, representada por <b>{rep_nombre}</b>, RUT {rep_rut} "
        f"(en adelante el &ldquo;<b>Contratante</b>&rdquo;), y <b>{nombre_trab}</b>, RUT {rut_trab}, "
        f"domiciliado/a en {dom_trab} (en adelante el &ldquo;<b>Contratista</b>&rdquo;), "
        f"acuerdan celebrar el siguiente Contrato de Prestación de Servicios a Honorarios:"
    )
    elems.append(p(intro, s["partes"]))
    elems.append(sp(0.3))

    elems.append(p("<u><b>PRIMERA: Objeto.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El Contratista, en su calidad de trabajador independiente, se obliga a ejecutar los servicios de "
        f"<b><i>{servicios}</i></b>{', para el proyecto ' + proyecto if proyecto else ''}, "
        f"desde el {fecha_inicio} hasta el {fecha_term}, sin horario determinado, ni subordinación ni dependencia.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>SEGUNDA: Duración.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El plazo de ejecución comprende desde el <b>{fecha_inicio}</b> hasta el <b>{fecha_term}</b>, "
        f"prorrogable por acuerdo escrito entre las Partes.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>TERCERA: Precio y Forma de Pago.</b></u>", s["clause_title"]))
    elems.append(p(
        f"El valor del contrato es de <b>{fmt_clp(valor)}.-</b>. "
        f"El pago se efectuará previa emisión de boleta o factura por parte del Contratista, "
        f"dentro de los 5 días hábiles del mes siguiente. "
        f"El Contratista deberá retener el porcentaje de impuesto a la renta que corresponda conforme a la ley.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>CUARTA: Obligaciones.</b></u>", s["clause_title"]))
    elems.append(p(
        "El Contratante facilitará acceso a la información necesaria para la ejecución del contrato. "
        "El Contratista deberá cumplir eficientemente los servicios encomendados, guardando confidencialidad "
        "respecto de toda información a la que acceda en virtud del presente contrato.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>QUINTA: Confidencialidad.</b></u>", s["clause_title"]))
    elems.append(p(
        "El Contratista se obliga a guardar estricta reserva sobre los términos del presente contrato "
        "y toda información del Contratante a que tenga acceso, tanto durante como después de la vigencia "
        "de este instrumento. Queda prohibida la divulgación de información del proyecto en redes sociales "
        "u otros medios sin autorización expresa.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>SEXTA: Independencia.</b></u>", s["clause_title"]))
    elems.append(p(
        "El Contratista actuará con autonomía, sin que exista relación laboral ni subordinación con el Contratante. "
        "Sus derechos se limitan a exigir el pago oportuno de la remuneración pactada. "
        "El Contratista no podrá ceder el contrato a terceros sin autorización escrita del Contratante.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>SÉPTIMA: Terminación.</b></u>", s["clause_title"]))
    elems.append(p(
        "El contrato terminará por acuerdo entre las Partes o unilateralmente por incumplimiento grave "
        "de las obligaciones derivadas del mismo.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>OCTAVA: Domicilio.</b></u>", s["clause_title"]))
    elems.append(p(
        f"Para todos los efectos legales se fija como domicilio contractual la ciudad de {ciudad_emp}.",
        s["clause_body"]
    ))

    elems.append(p("<u><b>NOVENA: Ejemplares.</b></u>", s["clause_title"]))
    elems.append(p(
        "Las Partes suscriben el presente contrato en 2 ejemplares, quedando uno en poder de cada Parte.",
        s["clause_body"]
    ))

    return elems


# ── Sección de firmas ─────────────────────────────────────────────────────────
def build_signatures(data, styles):
    emp  = data.get("empleador",  {})
    trab = data.get("trabajador", {})
    org  = data.get("organizacion", {})
    tipo = data.get("tipo_contrato", "indefinido")

    nombre_emp  = org.get("nombre", emp.get("nombre", ""))
    rut_emp     = org.get("rut", emp.get("rut", ""))
    rep_nombre  = emp.get("representante", "")
    nombre_trab = trab.get("nombre", "")
    rut_trab    = trab.get("rut", "")

    if tipo == "honorarios":
        label_emp  = "EL CONTRATANTE"
        label_trab = "EL CONTRATISTA"
    else:
        label_emp  = "EMPLEADOR"
        label_trab = "TRABAJADOR"

    s = styles
    elems = []
    elems.append(sp(1.5))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=GRAY_LIGHT))
    elems.append(sp(0.3))

    sign_data = [
        [
            Paragraph(f"_______________________________", s["sign_name"]),
            Paragraph(f"_______________________________", s["sign_name"]),
        ],
        [
            Paragraph(f"<b>{rep_nombre or nombre_emp}</b>", s["sign_name"]),
            Paragraph(f"<b>{nombre_trab}</b>", s["sign_name"]),
        ],
        [
            Paragraph(f"{label_emp}", s["sign_role"]),
            Paragraph(f"{label_trab}", s["sign_role"]),
        ],
        [
            Paragraph(f"{nombre_emp}", s["sign_role"]),
            Paragraph(f"RUT: {rut_trab}", s["sign_role"]),
        ],
        [
            Paragraph(f"RUT: {rut_emp}", s["sign_role"]),
            Paragraph("", s["sign_role"]),
        ],
    ]

    sign_table = Table(sign_data, colWidths=[8.5*cm, 8.5*cm])
    sign_table.setStyle(TableStyle([
        ("ALIGN",   (0,0), (-1,-1), "CENTER"),
        ("VALIGN",  (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    elems.append(sign_table)
    return elems


# ── Generador principal ───────────────────────────────────────────────────────
def generate_pdf(data):
    buf    = io.BytesIO()
    styles = make_styles()
    tipo   = data.get("tipo_contrato", "indefinido")

    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
        topMargin=2.2*cm,  bottomMargin=2.2*cm,
    )

    story = []
    story += build_header(data, styles)

    if tipo == "indefinido":
        story += clausulas_indefinido(data, styles)
    elif tipo == "plazo_fijo":
        story += clausulas_indefinido(data, styles, plazo_fijo=True)
    elif tipo == "part_time":
        story += clausulas_indefinido(data, styles, part_time=True)
    elif tipo == "proyecto":
        story += clausulas_proyecto(data, styles)
    elif tipo == "honorarios":
        story += clausulas_honorarios(data, styles)
    else:
        story += clausulas_indefinido(data, styles)

    story += build_signatures(data, styles)

    # Footer con número de página
    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(GRAY_MID)
        canvas.drawCentredString(
            LETTER[0] / 2,
            1.2 * cm,
            f"Página {doc.page} — Contrato de Trabajo — {data.get('organizacion', {}).get('nombre', '')}",
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buf.getvalue()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    raw = sys.stdin.buffer.read()
    data = json.loads(raw.decode("utf-8"))
    pdf_bytes = generate_pdf(data)
    sys.stdout.buffer.write(pdf_bytes)
