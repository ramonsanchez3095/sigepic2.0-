import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  CalendarDays,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  Briefcase,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { licenciaService } from '../services/licencia.service';
import { personalService } from '../services/personal.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectItem } from '../components/ui/select';
import { DatePicker } from '../components/ui/date-picker';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';

const TIPOS_LICENCIA = [
  { value: 'LICENCIA_ORDINARIA', label: 'Licencia Ordinaria' },
  { value: 'LICENCIA_EXTRAORDINARIA', label: 'Licencia Extraordinaria' },
  { value: 'LICENCIA_POR_ENFERMEDAD', label: 'Licencia por Enfermedad' },
];

const PersonalLicencias = () => {
  const { id: personalId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Estado general
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [personal, setPersonal] = useState(null);

  // Estado de licencias (historial)
  const [licencias, setLicencias] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Resumen anual
  const [resumen, setResumen] = useState(null);
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: '',
    fechaInicio: null,
    fechaFin: null,
    dias: '',
    anioLicencia: new Date().getFullYear(),
    motivo: '',
    observaciones: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Eliminar
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edición inline de días anuales
  const [editingDias, setEditingDias] = useState(false);
  const [diasInput, setDiasInput] = useState('');
  const [savingDias, setSavingDias] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, [personalId, anioFiltro]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [licenciasRes, resumenRes] = await Promise.all([
        licenciaService.listar(personalId, { anio: anioFiltro, limit: 50 }),
        licenciaService.resumenAnual(personalId, anioFiltro),
      ]);

      setLicencias(licenciasRes.data.data);
      setPersonal(licenciasRes.data.personal);
      setPagination(licenciasRes.data.pagination);
      setResumen(resumenRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los datos');
      // Si falla la carga de licencias, igual intentar obtener datos básicos del personal
      try {
        const personalRes = await personalService.obtenerPorId(personalId);
        setPersonal({
          id: personalRes.data.id,
          apellidos: personalRes.data.apellidos,
          nombres: personalRes.data.nombres,
          diasLicenciaAnuales: personalRes.data.diasLicenciaAnuales,
        });
      } catch (_) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  // Guardar días anuales editados inline
  const saveDiasAnuales = async () => {
    const valor = parseInt(diasInput);
    if (isNaN(valor) || valor < 0) return;
    try {
      setSavingDias(true);
      await personalService.actualizar(personalId, {
        diasLicenciaAnuales: valor,
      });
      setEditingDias(false);
      await fetchData();
      setSuccess('Días anuales actualizados correctamente');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Error al actualizar los días anuales');
    } finally {
      setSavingDias(false);
    }
  };

  // Calcular días entre fechas
  const calcularDias = useCallback((fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = fin.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, []);

  // Preview de días restantes
  const diasRestantesPreview = useCallback(() => {
    if (!resumen) return null;
    const diasForm = parseInt(formData.dias) || 0;
    const anioForm = parseInt(formData.anioLicencia);

    if (anioForm !== anioFiltro) return null; // No aplicable si es otro año

    const diasUsados = editingId
      ? resumen.diasUsados -
        (licencias.find(l => l.id === editingId)?.dias || 0)
      : resumen.diasUsados;

    return resumen.diasLicenciaAnuales - diasUsados - diasForm;
  }, [
    resumen,
    formData.dias,
    formData.anioLicencia,
    anioFiltro,
    editingId,
    licencias,
  ]);

  // Manejar cambios de fecha con auto-cálculo de días
  const handleFechaChange = (campo, value) => {
    const newFormData = { ...formData, [campo]: value };

    if (newFormData.fechaInicio && newFormData.fechaFin) {
      const dias = calcularDias(newFormData.fechaInicio, newFormData.fechaFin);
      newFormData.dias = dias.toString();
    }

    setFormData(newFormData);
    setFormErrors(prev => ({ ...prev, [campo]: null, dias: null }));
  };

  // Validar formulario
  const validarFormulario = () => {
    const errors = {};
    if (!formData.tipo) errors.tipo = 'Seleccione un tipo de licencia';
    if (!formData.fechaInicio)
      errors.fechaInicio = 'La fecha de salida es requerida';
    if (!formData.fechaFin)
      errors.fechaFin = 'La fecha de regreso es requerida';
    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.fechaFin <= formData.fechaInicio
    ) {
      errors.fechaFin = 'La fecha de regreso debe ser posterior a la de salida';
    }
    if (!formData.dias || parseInt(formData.dias) < 1)
      errors.dias = 'Los días deben ser al menos 1';
    if (!formData.anioLicencia || parseInt(formData.anioLicencia) < 2000) {
      errors.anioLicencia = 'Ingrese un año válido';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar licencia
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      setSaving(true);
      setError('');

      const datos = {
        tipo: formData.tipo,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin.toISOString(),
        dias: parseInt(formData.dias),
        anioLicencia: parseInt(formData.anioLicencia),
        motivo: formData.motivo || undefined,
        observaciones: formData.observaciones || undefined,
      };

      if (editingId) {
        await licenciaService.actualizar(personalId, editingId, datos);
        setSuccess('Licencia actualizada correctamente');
      } else {
        const response = await licenciaService.crear(personalId, datos);
        if (response.data.advertencia) {
          setSuccess(`Licencia registrada. ⚠️ ${response.data.advertencia}`);
        } else {
          setSuccess('Licencia registrada correctamente');
        }
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errores?.map(e => e.mensaje).join(', ') ||
          'Error al guardar la licencia'
      );
    } finally {
      setSaving(false);
    }
  };

  // Editar licencia
  const handleEditar = licencia => {
    setEditingId(licencia.id);
    setFormData({
      tipo: licencia.tipo,
      fechaInicio: new Date(licencia.fechaInicio),
      fechaFin: new Date(licencia.fechaFin),
      dias: licencia.dias.toString(),
      anioLicencia: licencia.anioLicencia,
      motivo: licencia.motivo || '',
      observaciones: licencia.observaciones || '',
    });
    setShowForm(true);
    setFormErrors({});
  };

  // Eliminar licencia
  const handleEliminar = async () => {
    try {
      setDeleting(true);
      await licenciaService.eliminar(personalId, deletingId);
      setSuccess('Licencia eliminada correctamente');
      setShowDeleteDialog(false);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la licencia');
    } finally {
      setDeleting(false);
    }
  };

  // Reset formulario
  const resetForm = () => {
    setFormData({
      tipo: '',
      fechaInicio: null,
      fechaFin: null,
      dias: '',
      anioLicencia: new Date().getFullYear(),
      motivo: '',
      observaciones: '',
    });
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  // Formatear fecha
  const formatDate = date => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-AR');
  };

  // Obtener label del tipo
  const getTipoLabel = tipo => {
    return TIPOS_LICENCIA.find(t => t.value === tipo)?.label || tipo;
  };

  // Obtener color del badge por tipo
  const getTipoBadgeClass = tipo => {
    switch (tipo) {
      case 'LICENCIA_ORDINARIA':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'LICENCIA_EXTRAORDINARIA':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'LICENCIA_POR_ENFERMEDAD':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Generar opciones de años
  const anioActual = new Date().getFullYear();
  const aniosOptions = Array.from({ length: 10 }, (_, i) => anioActual - 5 + i);

  // Auto-clear de mensajes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return <Loading />;
  }

  // Porcentaje de uso para la barra de progreso
  const usagePercent = resumen
    ? Math.min(
        100,
        Math.round(
          (resumen.diasUsados / (resumen.diasLicenciaAnuales || 1)) * 100
        )
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Header */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Volver
              </Button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    Gestión de Licencias
                  </h1>
                  {personal && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {personal.nombres} {personal.apellidos}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {hasPermission('create') && (
              <Button
                onClick={() => {
                  if (showForm && !editingId) {
                    resetForm();
                  } else {
                    resetForm();
                    setShowForm(true);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Licencia
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Mensajes */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Resumen Anual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Resumen Anual
                  </CardTitle>
                  <CardDescription>Balance de días de licencia</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={anioFiltro}
                    onChange={e => setAnioFiltro(parseInt(e.target.value))}
                    className="w-28 text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  >
                    {aniosOptions.map(anio => (
                      <SelectItem key={anio} value={anio}>
                        {anio}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {resumen ? (
                <>
                  {/* Barra de progreso visual */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        {resumen.diasUsados} de{' '}
                        {resumen.diasLicenciaAnuales ?? 0} días utilizados
                      </span>
                      <span
                        className={`font-semibold ${
                          usagePercent > 90
                            ? 'text-red-600 dark:text-red-400'
                            : usagePercent > 70
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {usagePercent}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full transition-colors ${
                          usagePercent > 90
                            ? 'bg-gradient-to-r from-red-400 to-red-500'
                            : usagePercent > 70
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Tarjetas de métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Días Anuales */}
                    <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-5 border border-blue-100 dark:border-blue-800/50 transition-all duration-200 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-3">
                          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {hasPermission('update') && !editingDias && (
                          <button
                            type="button"
                            onClick={() => {
                              setDiasInput(
                                String(resumen.diasLicenciaAnuales ?? '')
                              );
                              setEditingDias(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200"
                            title="Editar días anuales"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-1">
                        Días Anuales
                      </p>
                      {editingDias ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="number"
                            min="0"
                            value={diasInput}
                            onChange={e => setDiasInput(e.target.value)}
                            className="w-20 h-9 rounded-lg border border-blue-300 dark:border-blue-600 px-2.5 text-sm text-blue-800 dark:text-blue-200 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Escape') setEditingDias(false);
                              if (e.key === 'Enter') saveDiasAnuales();
                            }}
                          />
                          <button
                            type="button"
                            disabled={savingDias}
                            onClick={saveDiasAnuales}
                            className="h-9 px-3 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {savingDias ? '...' : 'OK'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDias(false)}
                            className="h-9 px-2.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {resumen.diasLicenciaAnuales ?? 0}
                        </p>
                      )}
                    </div>

                    {/* Días Usados */}
                    <div className="relative bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-5 border border-amber-100 dark:border-amber-800/50 transition-all duration-200 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mb-1">
                        Días Usados
                      </p>
                      <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                        {resumen.diasUsados}
                      </p>
                    </div>

                    {/* Días Restantes */}
                    <div
                      className={`relative rounded-xl p-5 border transition-all duration-200 hover:shadow-md ${
                        resumen.diasRestantes >= 0
                          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-200 dark:hover:border-emerald-700'
                          : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-100 dark:border-red-800/50 hover:border-red-200 dark:hover:border-red-700'
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                          resumen.diasRestantes >= 0
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
                            : 'bg-red-500/10 dark:bg-red-500/20'
                        }`}
                      >
                        {resumen.diasRestantes >= 0 ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <p
                        className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                          resumen.diasRestantes >= 0
                            ? 'text-emerald-600/70 dark:text-emerald-400/70'
                            : 'text-red-600/70 dark:text-red-400/70'
                        }`}
                      >
                        Días Restantes
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          resumen.diasRestantes >= 0
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {resumen.diasRestantes}
                      </p>
                      {resumen.diasRestantes < 0 && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Excedido en {Math.abs(resumen.diasRestantes)} día(s)
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 dark:text-slate-400 text-center py-4">
                  No se pudo cargar el resumen
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Formulario */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden border-t-4 border-t-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    {editingId ? (
                      <Edit className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Plus className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  {editingId ? 'Editar Licencia' : 'Nueva Licencia'}
                </CardTitle>
                <CardDescription>
                  Complete los campos requeridos para{' '}
                  {editingId ? 'actualizar' : 'registrar'} la licencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Licencia */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="dark:text-slate-300">
                        Tipo de Licencia *
                      </Label>
                      <Select
                        id="tipo"
                        value={formData.tipo}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            tipo: e.target.value,
                          }));
                          setFormErrors(prev => ({ ...prev, tipo: null }));
                        }}
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.tipo ? 'border-red-500' : ''}`}
                      >
                        <SelectItem value="">Seleccionar tipo...</SelectItem>
                        {TIPOS_LICENCIA.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </Select>
                      {formErrors.tipo && (
                        <p className="text-sm text-red-500">
                          {formErrors.tipo}
                        </p>
                      )}
                    </div>

                    {/* Año de Licencia */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="anioLicencia"
                        className="dark:text-slate-300"
                      >
                        Año de Licencia *
                      </Label>
                      <Input
                        id="anioLicencia"
                        type="number"
                        min="2000"
                        max="2100"
                        value={formData.anioLicencia}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            anioLicencia: parseInt(e.target.value) || '',
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            anioLicencia: null,
                          }));
                        }}
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.anioLicencia ? 'border-red-500' : ''}`}
                      />
                      {formErrors.anioLicencia && (
                        <p className="text-sm text-red-500">
                          {formErrors.anioLicencia}
                        </p>
                      )}
                    </div>

                    {/* Fecha de Salida */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">
                        Fecha de Salida *
                      </Label>
                      <DatePicker
                        date={formData.fechaInicio}
                        onSelect={date =>
                          handleFechaChange('fechaInicio', date)
                        }
                        placeholder="Seleccionar fecha de salida"
                      />
                      {formErrors.fechaInicio && (
                        <p className="text-sm text-red-500">
                          {formErrors.fechaInicio}
                        </p>
                      )}
                    </div>

                    {/* Fecha de Regreso */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">
                        Fecha de Regreso *
                      </Label>
                      <DatePicker
                        date={formData.fechaFin}
                        onSelect={date => handleFechaChange('fechaFin', date)}
                        placeholder="Seleccionar fecha de regreso"
                      />
                      {formErrors.fechaFin && (
                        <p className="text-sm text-red-500">
                          {formErrors.fechaFin}
                        </p>
                      )}
                    </div>

                    {/* Días */}
                    <div className="space-y-2">
                      <Label htmlFor="dias" className="dark:text-slate-300">
                        Días de Licencia *
                      </Label>
                      <Input
                        id="dias"
                        type="number"
                        min="1"
                        value={formData.dias}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            dias: e.target.value,
                          }));
                          setFormErrors(prev => ({ ...prev, dias: null }));
                        }}
                        placeholder="Se calcula automáticamente"
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.dias ? 'border-red-500' : ''}`}
                      />
                      {formErrors.dias && (
                        <p className="text-sm text-red-500">
                          {formErrors.dias}
                        </p>
                      )}
                    </div>

                    {/* Días Restantes (preview) */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">
                        Días Restantes del Año
                      </Label>
                      {(() => {
                        const preview = diasRestantesPreview();
                        if (preview === null) {
                          return (
                            <div className="h-10 flex items-center px-3 bg-gray-100 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
                              <span className="text-gray-400 dark:text-slate-500 text-sm">
                                Seleccione el mismo año del filtro para ver
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div
                            className={`h-10 flex items-center px-3 rounded-md border font-bold text-lg ${
                              preview >= 0
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {preview} día(s)
                            {preview < 0 && (
                              <AlertCircle className="w-4 h-4 ml-2" />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="space-y-2">
                    <Label htmlFor="motivo" className="dark:text-slate-300">
                      Motivo
                    </Label>
                    <Input
                      id="motivo"
                      value={formData.motivo}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          motivo: e.target.value,
                        }))
                      }
                      placeholder="Motivo de la licencia (opcional)"
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="observaciones"
                      className="dark:text-slate-300"
                    >
                      Observaciones
                    </Label>
                    <Input
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          observaciones: e.target.value,
                        }))
                      }
                      placeholder="Observaciones adicionales (opcional)"
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="min-w-[100px]"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white min-w-[140px] shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Guardando...
                        </>
                      ) : editingId ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Registrar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Historial de Licencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Historial de Licencias — {anioFiltro}
                  </CardTitle>
                  <CardDescription>
                    {pagination.total} licencia(s) registrada(s)
                  </CardDescription>
                </div>
                {licencias.length > 0 && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {licencias.length} registro
                    {licencias.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {licencias.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                    <CalendarDays className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-base font-medium mb-1">
                    Sin licencias registradas
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">
                    No se encontraron licencias para el año {anioFiltro}
                  </p>
                  {hasPermission('create') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                      className="border-dashed border-2 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar primera licencia
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Vista desktop: tabla */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Tipo
                          </TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Período
                          </TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Días
                          </TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Restantes
                          </TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Estado
                          </TableHead>
                          {(hasPermission('update') ||
                            hasPermission('delete')) && (
                            <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right pr-6">
                              Acciones
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {licencias.map((licencia, index) => (
                          <motion.tr
                            key={licencia.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-150"
                          >
                            <TableCell className="py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTipoBadgeClass(licencia.tipo)}`}
                              >
                                {getTipoLabel(licencia.tipo)}
                              </span>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {formatDate(licencia.fechaInicio)} →{' '}
                                  {formatDate(licencia.fechaFin)}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  Año {licencia.anioLicencia}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-3.5">
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                                {licencia.dias}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-3.5">
                              <span
                                className={`inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-lg text-sm font-bold ${
                                  licencia.diasRestantes >= 0
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                }`}
                              >
                                {licencia.diasRestantes}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-3.5">
                              <Badge
                                variant={
                                  licencia.estado === 'APROBADA'
                                    ? 'success'
                                    : licencia.estado === 'PENDIENTE'
                                      ? 'warning'
                                      : 'danger'
                                }
                              >
                                {licencia.estado}
                              </Badge>
                            </TableCell>
                            {(hasPermission('update') ||
                              hasPermission('delete')) && (
                              <TableCell className="text-right pr-4 py-3.5">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                  {hasPermission('update') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditar(licencia)}
                                      className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600"
                                      title="Editar licencia"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {hasPermission('delete') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setDeletingId(licencia.id);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600"
                                      title="Eliminar licencia"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vista mobile: tarjetas */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {licencias.map((licencia, index) => (
                      <motion.div
                        key={licencia.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTipoBadgeClass(licencia.tipo)}`}
                          >
                            {getTipoLabel(licencia.tipo)}
                          </span>
                          <Badge
                            variant={
                              licencia.estado === 'APROBADA'
                                ? 'success'
                                : licencia.estado === 'PENDIENTE'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {licencia.estado}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                              Período
                            </p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                              {formatDate(licencia.fechaInicio)} —{' '}
                              {formatDate(licencia.fechaFin)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                              Días
                            </p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {licencia.dias}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                              Restantes
                            </p>
                            <p
                              className={`font-bold ${
                                licencia.diasRestantes >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {licencia.diasRestantes}
                            </p>
                          </div>
                        </div>
                        {(hasPermission('update') ||
                          hasPermission('delete')) && (
                          <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {hasPermission('update') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditar(licencia)}
                                className="h-8 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                              </Button>
                            )}
                            {hasPermission('delete') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeletingId(licencia.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="h-8 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />{' '}
                                Eliminar
                              </Button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-center">
                Eliminar Licencia
              </DialogTitle>
              <DialogDescription className="text-center">
                Esta acción no se puede deshacer. La licencia será eliminada
                permanentemente del registro.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 sm:justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleEliminar}
                disabled={deleting}
                className="flex-1 sm:flex-none"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PersonalLicencias;
