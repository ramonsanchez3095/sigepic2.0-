import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  ArrowLeft,
  Filter,
  X,
  FileDown,
  Users,
  SortAsc,
  SortDesc,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { personalService } from '../services/personal.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const PersonalSearch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [sortField, setSortField] = useState('apellidos');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Jerarquías y secciones estáticas
  const jerarquiasSuperiores = [
    'Comisario General',
    'Comisario Mayor',
    'Comisario Inspector',
    'Comisario Principal',
    'Comisario',
    'Subcomisario',
    'Oficial Principal',
    'Oficial Auxiliar',
    'Oficial Ayudante',
    'Oficial Subayudante',
  ];

  const jerarquiasSubalternas = [
    'Suboficial Mayor',
    'Suboficial Principal',
    'Sargento Ayudante',
    'Sargento 1°',
    'Sargento',
    'Cabo 1°',
    'Cabo',
    'Agente',
    'PTP',
  ];

  const secciones = [
    'Delitos Generales y Especiales',
    'Cibercrimen',
    'Of. Central',
    'Análisis Informática Forense',
    'Explotación de Prensa',
    'Análisis Delictual',
  ];

  const [filtros, setFiltros] = useState({
    search: '',
    tipoPersonal: '',
    jerarquia: '',
    seccion: '',
    estadoServicio: '',
    jurisdiccion: '',
    regional: '',
    sexo: '',
    estadoCivil: '',
    grupoSanguineo: '',
  });

  const handleBuscar = async (resetPage = true) => {
    setSearching(true);
    try {
      const params = {
        ...filtros,
        page: resetPage ? 1 : page,
        limit: 20,
        sortBy: sortField,
        sortOrder: sortOrder,
      };

      // Remover valores vacíos
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await personalService.buscar(params);

      setResultados(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 0);
      if (resetPage) setPage(1);
      setSeleccionados([]);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResultados([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLimpiar = () => {
    setFiltros({
      search: '',
      tipoPersonal: '',
      jerarquia: '',
      seccion: '',
      estadoServicio: '',
      jurisdiccion: '',
      regional: '',
      sexo: '',
      estadoCivil: '',
      grupoSanguineo: '',
    });
    setResultados([]);
    setSeleccionados([]);
    setPage(1);
  };

  const handleToggleSeleccion = id => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSeleccionarTodos = () => {
    if (seleccionados.length === resultados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(resultados.map(p => p.id));
    }
  };

  const handleSort = field => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleEstadoChange = async (personalId, nuevoEstado) => {
    try {
      await personalService.actualizar(personalId, { estadoServicio: nuevoEstado });
      setResultados(prev =>
        prev.map(p => p.id === personalId ? { ...p, estadoServicio: nuevoEstado } : p)
      );
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  const handleDescargarPlanillas = async () => {
    if (seleccionados.length === 0) {
      alert('Seleccione al menos un personal');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/personal/planillas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ids: seleccionados }),
      });

      if (!response.ok) throw new Error('Error al generar planillas');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planillas-personal-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar planillas:', error);
      alert('Error al generar las planillas');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  // --- Helpers de UI ---
  const filterLabels = {
    search: 'Búsqueda',
    tipoPersonal: 'Tipo',
    jerarquia: 'Jerarquía',
    seccion: 'Sección',
    estadoServicio: 'Estado',
    jurisdiccion: 'Jurisdicción',
    regional: 'Regional',
    sexo: 'Sexo',
    estadoCivil: 'Estado Civil',
    grupoSanguineo: 'Grupo Sang.',
  };

  const activeFilterCount = Object.values(filtros).filter(v => v !== '').length;

  const estadoSelectClass = estado => {
    const base =
      'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1';
    const colors = {
      ACTIVO:
        'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      INACTIVO:
        'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      LICENCIA:
        'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-400 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
      SUSPENSION:
        'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-400 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
      RETIRADO:
        'bg-slate-100 text-slate-600 border-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      BAJA: 'bg-red-50 text-red-700 border-red-200 focus:ring-red-400 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    };
    return `${base} ${colors[estado] || 'bg-slate-100 text-slate-600 border-slate-200'}`;
  };

  const selectClass =
    'w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors';

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => {
    if (sortField || sortOrder) {
      handleBuscar(false);
    }
  }, [sortField, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header compacto sticky */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-8 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Dashboard
            </Button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Búsqueda Avanzada
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta integral del padrón policial
              </p>
            </div>
          </div>
          {seleccionados.length > 0 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Button
                onClick={handleDescargarPlanillas}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar ({seleccionados.length})
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Panel de Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                    <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Criterios de Búsqueda
                  </CardTitle>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {activeFilterCount} activo{activeFilterCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-7 text-xs text-slate-500 dark:text-slate-400"
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </CardHeader>

            {showFilters && (
              <CardContent className="p-4 space-y-4">
                {/* Búsqueda General */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    name="search"
                    value={filtros.search}
                    onChange={handleChange}
                    placeholder="Buscar por apellido, nombre, DNI, legajo..."
                    className="pl-10 h-10 text-sm"
                    onKeyPress={e => e.key === 'Enter' && handleBuscar()}
                  />
                </div>

                {/* Filtros Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Tipo de Personal
                    </Label>
                    <select
                      name="tipoPersonal"
                      value={filtros.tipoPersonal}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Todos</option>
                      <option value="SUPERIOR">Superior</option>
                      <option value="SUBALTERNO">Subalterno</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Jerarquía
                    </Label>
                    <select
                      name="jerarquia"
                      value={filtros.jerarquia}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Todas</option>
                      <optgroup label="Superiores">
                        {jerarquiasSuperiores.map(j => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Subalternos">
                        {jerarquiasSubalternas.map(j => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Sección
                    </Label>
                    <select
                      name="seccion"
                      value={filtros.seccion}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Todas</option>
                      {secciones.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Estado de Servicio
                    </Label>
                    <select
                      name="estadoServicio"
                      value={filtros.estadoServicio}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Todos</option>
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                      <option value="LICENCIA">Licencia</option>
                      <option value="SUSPENSION">Suspensión</option>
                      <option value="RETIRADO">Retirado</option>
                      <option value="BAJA">Baja</option>
                    </select>
                  </div>
                </div>

                {/* Filtros Adicionales */}
                <details className="group">
                  <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                    Filtros Adicionales
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-3 pl-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Jurisdicción
                      </Label>
                      <Input
                        name="jurisdiccion"
                        value={filtros.jurisdiccion}
                        onChange={handleChange}
                        placeholder="Ej: CRIA 1ra"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Regional
                      </Label>
                      <select
                        name="regional"
                        value={filtros.regional}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Todas</option>
                        <option value="CAPITAL">Capital</option>
                        <option value="NORTE">Norte</option>
                        <option value="SUR">Sur</option>
                        <option value="ESTE">Este</option>
                        <option value="OESTE">Oeste</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Sexo
                      </Label>
                      <select
                        name="sexo"
                        value={filtros.sexo}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Todos</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Estado Civil
                      </Label>
                      <select
                        name="estadoCivil"
                        value={filtros.estadoCivil}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Todos</option>
                        <option value="SOLTERO">Soltero/a</option>
                        <option value="CASADO">Casado/a</option>
                        <option value="DIVORCIADO">Divorciado/a</option>
                        <option value="VIUDO">Viudo/a</option>
                        <option value="CONCUBINO">Concubinato</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Grupo Sanguíneo
                      </Label>
                      <select
                        name="grupoSanguineo"
                        value={filtros.grupoSanguineo}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Todos</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </details>

                {/* Chips de filtros activos */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(filtros)
                      .filter(([, v]) => v !== '')
                      .map(([key, value]) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="gap-1 text-xs cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          onClick={() => setFiltros(f => ({ ...f, [key]: '' }))}
                        >
                          {filterLabels[key]}: {value}
                          <X className="w-3 h-3" />
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLimpiar}
                    className="h-8 text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Limpiar
                  </Button>
                  <Button
                    onClick={() => handleBuscar(true)}
                    disabled={searching}
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                  >
                    {searching ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 mr-1.5" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-md">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Resultados
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {total} registro{total !== 1 ? 's' : ''}
                        {seleccionados.length > 0 &&
                          ` · ${seleccionados.length} seleccionado${
                            seleccionados.length !== 1 ? 's' : ''
                          }`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSeleccionarTodos}
                    className="h-7 text-xs text-slate-500 dark:text-slate-400"
                  >
                    {seleccionados.length === resultados.length
                      ? 'Deseleccionar'
                      : 'Seleccionar todos'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              seleccionados.length === resultados.length &&
                              resultados.length > 0
                            }
                            onChange={handleSeleccionarTodos}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <button
                            onClick={() => handleSort('apellidos')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            Apellido y Nombre
                            {sortField === 'apellidos' &&
                              (sortOrder === 'asc' ? (
                                <SortAsc className="w-3.5 h-3.5" />
                              ) : (
                                <SortDesc className="w-3.5 h-3.5" />
                              ))}
                          </button>
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <button
                            onClick={() => handleSort('dni')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            Identificación
                            {sortField === 'dni' &&
                              (sortOrder === 'asc' ? (
                                <SortAsc className="w-3.5 h-3.5" />
                              ) : (
                                <SortDesc className="w-3.5 h-3.5" />
                              ))}
                          </button>
                        </th>
                        <th className="px-3 py-2.5 text-left">
                          <button
                            onClick={() => handleSort('jerarquia')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            Jerarquía
                            {sortField === 'jerarquia' &&
                              (sortOrder === 'asc' ? (
                                <SortAsc className="w-3.5 h-3.5" />
                              ) : (
                                <SortDesc className="w-3.5 h-3.5" />
                              ))}
                          </button>
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Sección
                        </th>
                        <th className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => handleSort('estadoServicio')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            Estado
                            {sortField === 'estadoServicio' &&
                              (sortOrder === 'asc' ? (
                                <SortAsc className="w-3.5 h-3.5" />
                              ) : (
                                <SortDesc className="w-3.5 h-3.5" />
                              ))}
                          </button>
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {resultados.map((personal, index) => (
                        <motion.tr
                          key={personal.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.015 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={seleccionados.includes(personal.id)}
                              onChange={() =>
                                handleToggleSeleccion(personal.id)
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                {personal.fotoUrl ? (
                                  <img
                                    src={personal.fotoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Users className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                                  {personal.apellidos}, {personal.nombres}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-600 dark:text-slate-400">
                                    {personal.tipoPersonal}
                                  </span>
                                  {personal.sexo && (
                                    <span className="text-slate-400 dark:text-slate-500">
                                      ·{' '}
                                      {personal.sexo === 'M'
                                        ? 'Masculino'
                                        : 'Femenino'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">
                                  DNI
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs">
                                  {personal.dni}
                                </span>
                              </div>
                              {personal.numeroAsignacion && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">
                                    Leg
                                  </span>
                                  <span className="text-xs text-slate-600 dark:text-slate-300">
                                    {personal.numeroAsignacion}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-slate-900 dark:text-slate-200 text-xs">
                              {personal.jerarquia || '-'}
                            </div>
                            {personal.cargo && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {personal.cargo}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              {personal.seccion || '-'}
                            </div>
                            {personal.jurisdiccion && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {personal.jurisdiccion}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <select
                              value={personal.estadoServicio || ''}
                              onChange={e =>
                                handleEstadoChange(
                                  personal.id,
                                  e.target.value
                                )
                              }
                              onClick={e => e.stopPropagation()}
                              className={estadoSelectClass(
                                personal.estadoServicio
                              )}
                            >
                              <option value="ACTIVO">ACTIVO</option>
                              <option value="INACTIVO">INACTIVO</option>
                              <option value="LICENCIA">LICENCIA</option>
                              <option value="SUSPENSION">SUSPENSIÓN</option>
                              <option value="RETIRADO">RETIRADO</option>
                              <option value="BAJA">BAJA</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    personal.archivosAdjuntos &&
                                    personal.archivosAdjuntos.length > 0
                                  ) {
                                    const ultimoArchivo =
                                      personal.archivosAdjuntos[
                                        personal.archivosAdjuntos.length - 1
                                      ];
                                    window.open(ultimoArchivo.url, '_blank');
                                  } else {
                                    alert(
                                      'Este personal no tiene archivos adjuntos.'
                                    );
                                  }
                                }}
                                className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                                title="Descargar Adjunto"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(
                                      '/api/personal/planillas',
                                      {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${localStorage.getItem(
                                            'token'
                                          )}`,
                                        },
                                        body: JSON.stringify({
                                          ids: [personal.id],
                                        }),
                                      }
                                    );

                                    if (!response.ok)
                                      throw new Error(
                                        'Error al generar planilla'
                                      );

                                    const blob = await response.blob();
                                    const url =
                                      window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `planilla-${personal.apellidos}-${personal.nombres}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  } catch (error) {
                                    console.error(
                                      'Error al descargar planilla:',
                                      error
                                    );
                                    alert('Error al generar la planilla');
                                  }
                                }}
                                className="h-7 w-7 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600"
                                title="Generar Planilla"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/personal/${personal.id}/licencias`)
                                }
                                className="h-7 w-7 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600"
                                title="Licencias"
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación numerada */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Página {page} de {totalPages} · {total} registros
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(p => Math.max(1, p - 1));
                          handleBuscar(false);
                        }}
                        disabled={page === 1}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        ‹
                      </Button>
                      {getPageNumbers().map((p, i) =>
                        p === '...' ? (
                          <span
                            key={`dots-${i}`}
                            className="px-1 text-xs text-slate-400"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            variant={page === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setPage(p);
                              handleBuscar(false);
                            }}
                            className={`h-7 w-7 p-0 text-xs ${
                              page === p
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : ''
                            }`}
                          >
                            {p}
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(p => Math.min(totalPages, p + 1));
                          handleBuscar(false);
                        }}
                        disabled={page === totalPages}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        ›
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Estado vacío */}
        {resultados.length === 0 && !searching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {Object.values(filtros).some(v => v !== '')
                ? 'Sin resultados'
                : 'Inicie una búsqueda'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {Object.values(filtros).some(v => v !== '')
                ? 'No se encontraron registros con los criterios especificados.'
                : 'Utilice los filtros para buscar personal en el sistema.'}
            </p>
            {Object.values(filtros).some(v => v !== '') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLimpiar}
                className="mt-4 h-8 text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </motion.div>
        )}

        {searching && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Buscando personal...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalSearch;
