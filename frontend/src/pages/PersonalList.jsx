import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { personalService } from '@/services/personal.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Loading from '@/components/common/Loading';
import {
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  ArrowLeft,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Building2,
  Clock,
  Shield,
  UserCircle,
} from 'lucide-react';

export default function PersonalList() {
  const navigate = useNavigate();
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');

  // Filtros avanzados
  const [filters, setFilters] = useState({
    tipoPersonal: '',
    jerarquia: '',
    seccion: '',
    estadoServicio: '',
  });
  const [activeFilters, setActiveFilters] = useState({}); // Filtros aplicados realmente
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Ordenamiento
  const [sortConfig, setSortConfig] = useState({
    key: 'numeroAsignacion',
    direction: 'asc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    cargarPersonal();
  }, [pagination.page, search, activeFilters, sortConfig]);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...activeFilters,
      };

      // Limpiar params vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await personalService.buscar(params);
      setPersonal(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error('Error cargando personal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = key => {
    setSortConfig(current => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      tipoPersonal: '',
      jerarquia: '',
      seccion: '',
      estadoServicio: '',
    };
    setFilters(emptyFilters);
    setActiveFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setIsFilterOpen(false);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {
        search,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...activeFilters,
      };

      // Limpiar params vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await personalService.exportar(params);

      // Crear blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `personal_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exportando:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Optimistic update
      setPersonal(prev =>
        prev.map(p => (p.id === id ? { ...p, estadoServicio: newStatus } : p))
      );

      await personalService.actualizar(id, { estadoServicio: newStatus });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      // Revertir si falla (opcional, requeriría recargar o guardar estado previo)
      cargarPersonal();
    }
  };

  // Conteo de filtros activos
  const activeFilterCount = Object.values(activeFilters).filter(
    v => v && v !== ''
  ).length;

  // Helpers de estado
  const getEstadoBadge = estado => {
    const map = {
      ACTIVO: { variant: 'success', label: 'Activo' },
      INACTIVO: { variant: 'default', label: 'Inactivo' },
      LICENCIA: { variant: 'warning', label: 'Licencia' },
      SUSPENSION: { variant: 'danger', label: 'Suspensión' },
      RETIRADO: { variant: 'default', label: 'Retirado' },
      BAJA: { variant: 'danger', label: 'Baja' },
    };
    const info = map[estado] || { variant: 'default', label: estado };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  // Genera array de páginas para paginación
  const getPageNumbers = () => {
    const pages = [];
    const total = pagination.totalPages;
    const current = pagination.page;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (
        let i = Math.max(2, current - 1);
        i <= Math.min(total - 1, current + 1);
        i++
      ) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sticky Header */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    Personal
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {pagination.total} miembro
                    {pagination.total !== 1 ? 's' : ''} registrado
                    {pagination.total !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/personal/nuevo')}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Personal
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Barra de búsqueda y filtros */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="p-4">
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, DNI, número de asignación..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(true)}
                  className={`relative border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    activeFilterCount > 0
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting}
                  className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>

              {/* Chips de filtros activos */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Filtros:
                  </span>
                  {Object.entries(activeFilters).map(([key, value]) => {
                    if (!value) return null;
                    const labels = {
                      tipoPersonal: 'Tipo',
                      jerarquia: 'Jerarquía',
                      seccion: 'Sección',
                      estadoServicio: 'Estado',
                    };
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800/50"
                      >
                        {labels[key]}: {value}
                        <button
                          type="button"
                          onClick={() => {
                            const newFilters = { ...activeFilters, [key]: '' };
                            setActiveFilters(newFilters);
                            setFilters(prev => ({ ...prev, [key]: '' }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                          }}
                          className="ml-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 ml-1"
                  >
                    Limpiar todos
                  </button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Diálogo de filtros */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent
            className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            onClose={() => setIsFilterOpen(false)}
          >
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtros de Búsqueda
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Tipo de Personal
                </Label>
                <Select
                  value={filters.tipoPersonal}
                  onChange={e =>
                    setFilters({ ...filters, tipoPersonal: e.target.value })
                  }
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Todos</option>
                  <SelectItem value="POLICIAL">Policial</SelectItem>
                  <SelectItem value="CIVIL">Civil</SelectItem>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Jerarquía
                </Label>
                <Input
                  value={filters.jerarquia}
                  onChange={e =>
                    setFilters({ ...filters, jerarquia: e.target.value })
                  }
                  placeholder="Ej: Comisario"
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Sección
                </Label>
                <Input
                  value={filters.seccion}
                  onChange={e =>
                    setFilters({ ...filters, seccion: e.target.value })
                  }
                  placeholder="Ej: Investigaciones"
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Estado de Servicio
                </Label>
                <Select
                  value={filters.estadoServicio}
                  onChange={e =>
                    setFilters({ ...filters, estadoServicio: e.target.value })
                  }
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Todos</option>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  <SelectItem value="LICENCIA">Licencia</SelectItem>
                  <SelectItem value="SUSPENSION">Suspensión</SelectItem>
                  <SelectItem value="RETIRADO">Retirado</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Limpiar
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600"
              >
                Aplicar Filtros
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contenido principal */}
        {loading ? (
          <Loading />
        ) : personal.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="text-center py-16 px-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium mb-1">
                  No se encontró personal
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">
                  {search
                    ? `No hay resultados para "${search}"`
                    : 'Aún no hay registros de personal'}
                </p>
                {!search && (
                  <Button
                    onClick={() => navigate('/personal/nuevo')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar primer personal
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-0"
          >
            {/* Tabla Desktop */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Personal
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Jerarquía / Cargo
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Sección
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Horario
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Estado
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {personal.map((p, index) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-150"
                      >
                        {/* Personal: número + nombre */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center flex-shrink-0">
                              <UserCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {p.apellidos?.toUpperCase()}, {p.nombres}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {p.numeroAsignacion || 'Sin asignación'}
                                {p.dni ? ` · DNI ${p.dni}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Jerarquía + Cargo */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {p.jerarquia || '-'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {p.numeroCargo || '-'}
                          </p>
                        </td>
                        {/* Sección + Función */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {p.seccion || p.seccionId || '-'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                            {p.funcionDepto || '-'}
                          </p>
                        </td>
                        {/* Horario */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {p.horarioLaboral || '-'}
                          </span>
                        </td>
                        {/* Estado */}
                        <td className="px-5 py-3.5 text-center">
                          {getEstadoBadge(p.estadoServicio)}
                        </td>
                        {/* Acciones */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/personal/${p.id}`)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="Ver detalle"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/personal/editar/${p.id}`)
                              }
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{' '}
                  de {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }
                    className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers().map((pageNum, i) =>
                    pageNum === '...' ? (
                      <span
                        key={`dots-${i}`}
                        className="w-8 text-center text-sm text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={
                          pagination.page === pageNum ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() =>
                          setPagination(prev => ({ ...prev, page: pageNum }))
                        }
                        className={`h-8 w-8 p-0 rounded-lg text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }
                    className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Cards Mobile */}
            <div className="md:hidden space-y-3">
              {personal.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="p-4">
                      {/* Cabecera: nombre + estado */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {p.apellidos?.toUpperCase()}, {p.nombres}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {p.numeroAsignacion || '—'}
                            </p>
                          </div>
                        </div>
                        {getEstadoBadge(p.estadoServicio)}
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex items-start gap-2">
                          <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Jerarquía
                            </p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">
                              {p.jerarquia || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Sección
                            </p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">
                              {p.seccion || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Horario
                            </p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">
                              {p.horarioLaboral || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <UserCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Función
                            </p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">
                              {p.funcionDepto || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/personal/${p.id}`)}
                          className="h-8 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/personal/editar/${p.id}`)}
                          className="h-8 text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Paginación Mobile */}
              <div className="flex items-center justify-between py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pág. {pagination.page} de {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }
                    className="h-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
