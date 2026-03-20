const prisma = require('../config/database');
const logger = require('../utils/logger');

// Listar licencias de un personal
const listar = async (req, res, next) => {
  try {
    const { personalId } = req.params;
    const {
      anio,
      page = 1,
      limit = 20,
      sortBy = 'fechaInicio',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verificar que el personal existe
    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: {
        id: true,
        apellidos: true,
        nombres: true,
        diasLicenciaAnuales: true,
      },
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    // Construir filtros
    const where = { personalId: parseInt(personalId) };
    if (anio) {
      where.anioLicencia = parseInt(anio);
    }

    const [licencias, total] = await Promise.all([
      prisma.licencia.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.licencia.count({ where }),
    ]);

    res.json({
      data: licencias,
      personal: {
        id: personal.id,
        apellidos: personal.apellidos,
        nombres: personal.nombres,
        diasLicenciaAnuales: personal.diasLicenciaAnuales,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener resumen anual de licencias
const resumenAnual = async (req, res, next) => {
  try {
    const { personalId } = req.params;
    const { anio } = req.query;

    const anioConsulta = anio ? parseInt(anio) : new Date().getFullYear();

    // Obtener datos del personal
    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: {
        id: true,
        apellidos: true,
        nombres: true,
        diasLicenciaAnuales: true,
      },
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    // Sumar días usados en el año
    const licenciasAnio = await prisma.licencia.findMany({
      where: {
        personalId: parseInt(personalId),
        anioLicencia: anioConsulta,
        estado: { not: 'RECHAZADA' },
      },
      select: { dias: true },
    });

    const diasUsados = licenciasAnio.reduce((sum, lic) => sum + lic.dias, 0);
    const diasLicenciaAnuales = personal.diasLicenciaAnuales ?? 0;
    const diasRestantes = diasLicenciaAnuales - diasUsados;

    res.json({
      anio: anioConsulta,
      diasLicenciaAnuales,
      diasUsados,
      diasRestantes,
      personal: {
        id: personal.id,
        apellidos: personal.apellidos,
        nombres: personal.nombres,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener licencia por ID
const obtenerPorId = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;

    const licencia = await prisma.licencia.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
      include: {
        personal: {
          select: {
            id: true,
            apellidos: true,
            nombres: true,
            diasLicenciaAnuales: true,
          },
        },
      },
    });

    if (!licencia) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    res.json(licencia);
  } catch (error) {
    next(error);
  }
};

// Crear licencia
const crear = async (req, res, next) => {
  try {
    const { personalId } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    // Verificar que el personal existe
    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: {
        id: true,
        apellidos: true,
        nombres: true,
        diasLicenciaAnuales: true,
      },
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    // Calcular días restantes
    const diasLicenciaAnuales = personal.diasLicenciaAnuales ?? 0;
    const licenciasAnio = await prisma.licencia.findMany({
      where: {
        personalId: parseInt(personalId),
        anioLicencia: datos.anioLicencia,
        estado: { not: 'RECHAZADA' },
      },
      select: { dias: true },
    });

    const diasUsados = licenciasAnio.reduce((sum, lic) => sum + lic.dias, 0);
    const diasRestantes = diasLicenciaAnuales - diasUsados - datos.dias;

    const licencia = await prisma.licencia.create({
      data: {
        personalId: parseInt(personalId),
        tipo: datos.tipo,
        fechaInicio: new Date(datos.fechaInicio),
        fechaFin: new Date(datos.fechaFin),
        dias: datos.dias,
        anioLicencia: datos.anioLicencia,
        diasRestantes: diasRestantes,
        motivo: datos.motivo || null,
        observaciones: datos.observaciones || null,
        estado: datos.estado || 'APROBADA',
      },
    });

    // Registrar auditoría
    await prisma.auditoria.create({
      data: {
        tabla: 'licencias',
        registroId: licencia.id,
        accion: 'CREATE',
        cambios: datos,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(
      `Licencia creada: ID ${licencia.id} para personal ${personalId}`
    );

    res.status(201).json({
      ...licencia,
      diasRestantesAnio: diasRestantes,
      advertencia:
        diasRestantes < 0
          ? `El personal ha excedido sus días de licencia anuales por ${Math.abs(diasRestantes)} día(s)`
          : null,
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar licencia
const actualizar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    // Verificar que la licencia existe
    const licenciaExistente = await prisma.licencia.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!licenciaExistente) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    // Si cambian los días o el año, recalcular días restantes
    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: { diasLicenciaAnuales: true },
    });

    const anioLicencia = datos.anioLicencia || licenciaExistente.anioLicencia;
    const dias = datos.dias || licenciaExistente.dias;
    const diasLicenciaAnuales = personal.diasLicenciaAnuales ?? 0;

    // Sumar días usados excluyendo la licencia actual
    const licenciasAnio = await prisma.licencia.findMany({
      where: {
        personalId: parseInt(personalId),
        anioLicencia: anioLicencia,
        estado: { not: 'RECHAZADA' },
        id: { not: parseInt(id) },
      },
      select: { dias: true },
    });

    const diasUsados = licenciasAnio.reduce((sum, lic) => sum + lic.dias, 0);
    const diasRestantes = diasLicenciaAnuales - diasUsados - dias;

    const updateData = {};
    if (datos.tipo) updateData.tipo = datos.tipo;
    if (datos.fechaInicio) updateData.fechaInicio = new Date(datos.fechaInicio);
    if (datos.fechaFin) updateData.fechaFin = new Date(datos.fechaFin);
    if (datos.dias) updateData.dias = datos.dias;
    if (datos.anioLicencia) updateData.anioLicencia = datos.anioLicencia;
    if (datos.motivo !== undefined) updateData.motivo = datos.motivo;
    if (datos.observaciones !== undefined)
      updateData.observaciones = datos.observaciones;
    if (datos.estado) updateData.estado = datos.estado;
    updateData.diasRestantes = diasRestantes;

    const licencia = await prisma.licencia.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Registrar auditoría
    await prisma.auditoria.create({
      data: {
        tabla: 'licencias',
        registroId: licencia.id,
        accion: 'UPDATE',
        cambios: { anterior: licenciaExistente, nuevo: datos },
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Licencia actualizada: ID ${licencia.id}`);

    res.json(licencia);
  } catch (error) {
    next(error);
  }
};

// Eliminar licencia
const eliminar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const usuarioId = req.user.id;

    const licencia = await prisma.licencia.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!licencia) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    await prisma.licencia.delete({
      where: { id: parseInt(id) },
    });

    // Registrar auditoría
    await prisma.auditoria.create({
      data: {
        tabla: 'licencias',
        registroId: parseInt(id),
        accion: 'DELETE',
        cambios: licencia,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Licencia eliminada: ID ${id}`);

    res.json({ message: 'Licencia eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  resumenAnual,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
