import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Upload,
  X,
  ChevronLeft,
  User,
  Briefcase,
  FileText,
  Phone,
  Shield,
  Camera,
  Check,
  MapPin,
  Car,
  Hash,
  Calendar,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { personalService } from '../services/personal.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';

// Schema de validación Zod
const personalSchema = z.object({
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  nombres: z.string().min(2, 'Nombres requeridos'),
  numeroAsignacion: z.string().optional().or(z.literal('')),
  tipoPersonal: z.enum(['SUPERIOR', 'SUBALTERNO']),
  jerarquiaId: z.string().min(1, 'Jerarquía requerida'),
  numeroCargo: z.string().optional().or(z.literal('')),
  seccionId: z.string().min(1, 'Sección requerida'),
  funcionDepto: z.string().optional(),
  horarioLaboral: z.string().optional(),
  profesion: z.string().optional(),
  celular: z.string().optional(),
  dni: z.string().min(4, 'DNI/CI requerido'),
  cuil: z.string().optional(),
  subsidioSalud: z.string().optional(),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  prontuario: z.string().optional(),
  estadoCivil: z
    .enum(['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'CONCUBINO'])
    .optional(),
  sexo: z.enum(['M', 'F']),
  grupoSanguineo: z.string().optional(),
  nacionalidad: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  domicilio: z.string().optional(),
  localidad: z.string().optional(),
  jurisdiccion: z.string().optional(),
  regional: z.string().optional(),
  armaTipo: z.string().optional(),
  nroArma: z.string().optional(),
  poseeCarnetManejo: z.string().optional(),
  conduceAutos: z.boolean().optional(),
  conduceMotos: z.boolean().optional(),
  conduceOtros: z.boolean().optional(),
  poseeCredencialPolicial: z.string().optional(),
  altaReparticion: z.string().optional(),
  altaDepartamental: z.string().optional(),
  poseeChalecoAsignado: z.string().optional(),
  nroSerieChalecoAsignado: z.string().optional(),
});

const PersonalNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [poseeCarnet, setPoseeCarnet] = useState(false);
  const [poseeCredencial, setPoseeCredencial] = useState(false);
  const [poseeChalecoState, setPoseeChalecoState] = useState(false);
  const [contactosAdicionales, setContactosAdicionales] = useState([]);

  // Jerarquías estáticas
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

  // Secciones estáticas
  const seccionesDisponibles = [
    'Delitos Generales y Especiales',
    'Cibercrimen',
    'Of. Central',
    'Análisis Informática Forense',
    'Explotación de Prensa',
    'Análisis Delictual',
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      tipoPersonal: 'SUBALTERNO',
      sexo: 'M',
      estadoCivil: 'SOLTERO',
      nacionalidad: 'Argentina',
    },
  });

  const tipoPersonal = watch('tipoPersonal');

  // Dropzone para foto
  const { getRootProps: getFotoRootProps, getInputProps: getFotoInputProps } =
    useDropzone({
      accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
      maxFiles: 1,
      onDrop: acceptedFiles => {
        const file = acceptedFiles[0];
        setFoto(file);
        setFotoPreview(URL.createObjectURL(file));
      },
    });

  // Dropzone para archivos adjuntos
  const {
    getRootProps: getArchivosRootProps,
    getInputProps: getArchivosInputProps,
  } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    onDrop: acceptedFiles => {
      setArchivos(prev => [...prev, ...acceptedFiles]);
    },
  });

  const onSubmit = async data => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      // Convertir y agregar datos al FormData
      Object.keys(data).forEach(key => {
        const value = data[key];

        // Saltar valores vacíos excepto booleanos
        if (value === null || value === undefined || value === '') {
          return;
        }

        // Convertir "SI"/"NO" a boolean para campos específicos
        if (
          [
            'poseeCarnetManejo',
            'poseeCredencialPolicial',
            'poseeChalecoAsignado',
          ].includes(key)
        ) {
          formData.append(key, value === 'SI' ? 'true' : 'false');
        }
        // Convertir booleanos a strings para FormData
        else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      });

      // Agregar foto
      if (foto) {
        formData.append('foto', foto);
      }

      // Agregar archivos
      archivos.forEach(archivo => {
        formData.append('archivos', archivo);
      });

      // Agregar contactos adicionales
      if (contactosAdicionales.length > 0) {
        const contactosValidos = contactosAdicionales.filter(c => c.valor.trim() !== '');
        if (contactosValidos.length > 0) {
          formData.append('contactosAdicionales', JSON.stringify(contactosValidos));
        }
      }

      console.log('Datos a enviar:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      await personalService.create(formData);
      navigate('/personal');
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Respuesta del servidor:', err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al crear el personal';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Determinar jerarquías a mostrar según tipo de personal
  const jerarquiasAMostrar =
    tipoPersonal === 'SUPERIOR' ? jerarquiasSuperiores : jerarquiasSubalternas;

  // Secciones del stepper
  const sections = [
    { id: 'foto', icon: Camera, label: 'Foto' },
    { id: 'personal', icon: User, label: 'Personales' },
    { id: 'laboral', icon: Briefcase, label: 'Laborales' },
    { id: 'contacto', icon: Phone, label: 'Contacto' },
    { id: 'armamento', icon: Shield, label: 'Armamento' },
    { id: 'otros', icon: FileText, label: 'Otros' },
    { id: 'archivos', icon: Paperclip, label: 'Archivos' },
  ];
  const sectionRefs = useRef({});
  const [activeSection, setActiveSection] = useState('foto');

  // Observer para detectar sección visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.dataset.section);
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = id => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Helper para select styling
  const selectClass = (hasError) =>
    `w-full h-10 px-3 py-2 rounded-md border text-sm bg-background ring-offset-background focus:outline-none focus:ring-2 focus:ring-police-cyan/40 focus:border-police-cyan transition-colors ${
      hasError ? 'border-red-400 focus:ring-red-400/40' : 'border-input hover:border-slate-400'
    }`;

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 -ml-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                    Agregar Personal
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Departamento D-2</p>
                </div>
              </div>
            </div>
            <Badge variant="info" className="text-xs">
              <Hash className="w-3 h-3 mr-1" />
              Nuevo registro
            </Badge>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {sections.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-police-cyan/10 text-police-cyan dark:bg-police-cyan/20 dark:text-cyan-300 ring-1 ring-police-cyan/30'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Form Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Error al registrar</p>
                <p className="text-sm text-red-600 dark:text-red-400/80 mt-0.5">{error}</p>
              </div>
              <button type="button" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ═══ 1. Fotografía ═══ */}
          <div ref={el => (sectionRefs.current.foto = el)} data-section="foto">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Fotografía</CardTitle>
                    <CardDescription className="text-xs">Foto del personal (opcional)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Preview circle */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 border-white dark:border-slate-600 shadow-lg overflow-hidden flex items-center justify-center">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-slate-300 dark:text-slate-500" />
                      )}
                    </div>
                    {foto && (
                      <button
                        type="button"
                        onClick={() => { setFoto(null); setFotoPreview(null); }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload zone */}
                  <div className="flex-1 w-full">
                    <div
                      {...getFotoRootProps()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-police-cyan hover:bg-police-cyan/5 transition-all group"
                    >
                      <input {...getFotoInputProps()} />
                      <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 group-hover:text-police-cyan transition-colors" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Click o arrastre una foto
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG — Máx 5MB</p>
                    </div>
                    {foto && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3.5 h-3.5" />
                        <span className="font-medium truncate">{foto.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ 2. Datos Personales ═══ */}
          <div ref={el => (sectionRefs.current.personal = el)} data-section="personal">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Datos Personales</CardTitle>
                    <CardDescription className="text-xs">Información personal básica del efectivo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row: Apellidos, Nombres, DNI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="apellidos" className="text-xs font-semibold">
                      Apellidos <span className="text-red-400">*</span>
                    </Label>
                    <Input id="apellidos" {...register('apellidos')} className={errors.apellidos ? 'border-red-400' : ''} />
                    {errors.apellidos && <p className="text-xs text-red-500">{errors.apellidos.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nombres" className="text-xs font-semibold">
                      Nombres <span className="text-red-400">*</span>
                    </Label>
                    <Input id="nombres" {...register('nombres')} className={errors.nombres ? 'border-red-400' : ''} />
                    {errors.nombres && <p className="text-xs text-red-500">{errors.nombres.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dni" className="text-xs font-semibold">
                      DNI / CI <span className="text-red-400">*</span>
                    </Label>
                    <Input id="dni" {...register('dni')} placeholder="12345678" className={errors.dni ? 'border-red-400' : ''} />
                    {errors.dni && <p className="text-xs text-red-500">{errors.dni.message}</p>}
                  </div>
                </div>

                {/* Row: CUIL, Sexo, Fecha Nac */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cuil" className="text-xs font-semibold">CUIL</Label>
                    <Input id="cuil" {...register('cuil')} placeholder="20-12345678-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sexo" className="text-xs font-semibold">
                      Sexo <span className="text-red-400">*</span>
                    </Label>
                    <select id="sexo" {...register('sexo')} className={selectClass(false)}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fechaNacimiento" className="text-xs font-semibold">
                      Fecha de Nacimiento <span className="text-red-400">*</span>
                    </Label>
                    <Input id="fechaNacimiento" type="date" {...register('fechaNacimiento')} className={errors.fechaNacimiento ? 'border-red-400' : ''} />
                    {errors.fechaNacimiento && <p className="text-xs text-red-500">{errors.fechaNacimiento.message}</p>}
                  </div>
                </div>

                {/* Row: Estado Civil, Profesión, Prontuario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="estadoCivil" className="text-xs font-semibold">Estado Civil</Label>
                    <select id="estadoCivil" {...register('estadoCivil')} className={selectClass(false)}>
                      <option value="SOLTERO">Soltero/a</option>
                      <option value="CASADO">Casado/a</option>
                      <option value="DIVORCIADO">Divorciado/a</option>
                      <option value="VIUDO">Viudo/a</option>
                      <option value="CONCUBINO">Concubino/a</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profesion" className="text-xs font-semibold">Profesión</Label>
                    <Input id="profesion" {...register('profesion')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prontuario" className="text-xs font-semibold">Prontuario</Label>
                    <Input id="prontuario" {...register('prontuario')} />
                  </div>
                </div>

                {/* Row: Grupo Sanguíneo, Nacionalidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="grupoSanguineo" className="text-xs font-semibold">Grupo Sanguíneo</Label>
                    <select id="grupoSanguineo" {...register('grupoSanguineo')} className={selectClass(false)}>
                      <option value="">Seleccionar...</option>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="nacionalidad" className="text-xs font-semibold">Nacionalidad</Label>
                    <Input id="nacionalidad" {...register('nacionalidad')} placeholder="Argentina" />
                  </div>
                </div>

                {/* Domicilio + Localidad */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-medium uppercase tracking-wider">Dirección</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="domicilio" className="text-xs font-semibold">Domicilio</Label>
                    <Input id="domicilio" {...register('domicilio')} placeholder="Calle, número, localidad" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="localidad" className="text-xs font-semibold">Localidad</Label>
                    <Input id="localidad" {...register('localidad')} placeholder="Ciudad o localidad" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ 3. Datos Laborales ═══ */}
          <div ref={el => (sectionRefs.current.laboral = el)} data-section="laboral">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Datos Laborales</CardTitle>
                    <CardDescription className="text-xs">Información del cargo y dependencia</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row: N° Asignación, Tipo Personal, Jerarquía */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="numeroAsignacion" className="text-xs font-semibold">N° de Asignación</Label>
                    <Input id="numeroAsignacion" {...register('numeroAsignacion')} placeholder="A-12345" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tipoPersonal" className="text-xs font-semibold">
                      Tipo de Personal <span className="text-red-400">*</span>
                    </Label>
                    <select id="tipoPersonal" {...register('tipoPersonal')} className={selectClass(false)}>
                      <option value="SUPERIOR">Superior</option>
                      <option value="SUBALTERNO">Subalterno</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jerarquiaId" className="text-xs font-semibold">
                      Jerarquía <span className="text-red-400">*</span>
                    </Label>
                    <select id="jerarquiaId" {...register('jerarquiaId')} className={selectClass(!!errors.jerarquiaId)}>
                      <option value="">Seleccionar...</option>
                      {jerarquiasAMostrar.map((jerarquia, index) => (
                        <option key={index} value={jerarquia}>{jerarquia}</option>
                      ))}
                    </select>
                    {errors.jerarquiaId && <p className="text-xs text-red-500">{errors.jerarquiaId.message}</p>}
                  </div>
                </div>

                {/* Row: N° Cargo, Sección, Función */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="numeroCargo" className="text-xs font-semibold">N° de Cargo</Label>
                    <Input id="numeroCargo" {...register('numeroCargo')} placeholder="Número de cargo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="seccionId" className="text-xs font-semibold">
                      Sección <span className="text-red-400">*</span>
                    </Label>
                    <select id="seccionId" {...register('seccionId')} className={selectClass(!!errors.seccionId)}>
                      <option value="">Seleccione una sección...</option>
                      {seccionesDisponibles.map((seccion, index) => (
                        <option key={index} value={seccion}>{seccion}</option>
                      ))}
                    </select>
                    {errors.seccionId && <p className="text-xs text-red-500">{errors.seccionId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="funcionDepto" className="text-xs font-semibold">Función en Departamento</Label>
                    <Input id="funcionDepto" {...register('funcionDepto')} />
                  </div>
                </div>

                {/* Row: Horario, Jurisdicción, Regional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="horarioLaboral" className="text-xs font-semibold">Horario Laboral</Label>
                    <Input id="horarioLaboral" {...register('horarioLaboral')} placeholder="08:00 - 16:00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jurisdiccion" className="text-xs font-semibold">Jurisdicción</Label>
                    <Input id="jurisdiccion" {...register('jurisdiccion')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="regional" className="text-xs font-semibold">Regional</Label>
                    <select id="regional" {...register('regional')} className={selectClass(false)}>
                      <option value="">Seleccionar...</option>
                      <option value="CAPITAL">Capital</option>
                      <option value="NORTE">Norte</option>
                      <option value="SUR">Sur</option>
                      <option value="ESTE">Este</option>
                      <option value="OESTE">Oeste</option>
                    </select>
                  </div>
                </div>

                {/* Subsidio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subsidioSalud" className="text-xs font-semibold">Subsidio de Salud</Label>
                    <Input id="subsidioSalud" {...register('subsidioSalud')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ 4. Información de Contacto ═══ */}
          <div ref={el => (sectionRefs.current.contacto = el)} data-section="contacto">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Información de Contacto</CardTitle>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContactosAdicionales([...contactosAdicionales, { tipo: 'celular', valor: '' }])}
                    className="text-xs h-8 hover:bg-police-cyan/10 hover:border-police-cyan hover:text-police-cyan"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Contacto
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="celular" className="text-xs font-semibold">Celular Principal</Label>
                    <Input id="celular" {...register('celular')} placeholder="+549 11 1234-5678" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Email Principal</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="usuario@ejemplo.com" className={errors.email ? 'border-red-400' : ''} />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Contactos Adicionales */}
                <AnimatePresence>
                  {contactosAdicionales.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800"
                    >
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Contactos Adicionales
                      </p>
                      {contactosAdicionales.map((contacto, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex items-center gap-2"
                        >
                          <select
                            value={contacto.tipo}
                            onChange={(e) => {
                              const nuevosContactos = [...contactosAdicionales];
                              nuevosContactos[index].tipo = e.target.value;
                              setContactosAdicionales(nuevosContactos);
                            }}
                            className={`${selectClass(false)} w-32 flex-shrink-0`}
                          >
                            <option value="celular">Celular</option>
                            <option value="telefono">Teléfono</option>
                            <option value="email">Email</option>
                            <option value="emergencia">Emergencia</option>
                          </select>
                          <Input
                            value={contacto.valor}
                            onChange={(e) => {
                              const nuevosContactos = [...contactosAdicionales];
                              nuevosContactos[index].valor = e.target.value;
                              setContactosAdicionales(nuevosContactos);
                            }}
                            placeholder={contacto.tipo === 'email' ? 'correo@ejemplo.com' : 'Número de teléfono'}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setContactosAdicionales(contactosAdicionales.filter((_, i) => i !== index))}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* ═══ 5. Armamento ═══ */}
          <div ref={el => (sectionRefs.current.armamento = el)} data-section="armamento">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Armamento Asignado</CardTitle>
                    <CardDescription className="text-xs">Información sobre el armamento (opcional)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="armaTipo" className="text-xs font-semibold">Tipo de Arma</Label>
                    <Input id="armaTipo" {...register('armaTipo')} placeholder="Pistola 9mm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nroArma" className="text-xs font-semibold">N° de Arma</Label>
                    <Input id="nroArma" {...register('nroArma')} placeholder="Número de serie" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="poseeChalecoAsignado" className="text-xs font-semibold">Chaleco Asignado</Label>
                    <select
                      id="poseeChalecoAsignado"
                      {...register('poseeChalecoAsignado')}
                      className={selectClass(false)}
                      onChange={e => setPoseeChalecoState(e.target.value === 'SI')}
                    >
                      <option value="NO">No</option>
                      <option value="SI">Sí</option>
                    </select>
                  </div>
                  {poseeChalecoState && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-1.5"
                    >
                      <Label htmlFor="nroSerieChalecoAsignado" className="text-xs font-semibold">N° de Serie Chaleco</Label>
                      <Input id="nroSerieChalecoAsignado" {...register('nroSerieChalecoAsignado')} placeholder="Número de serie" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ 6. Otros ═══ */}
          <div ref={el => (sectionRefs.current.otros = el)} data-section="otros">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Otros</CardTitle>
                    <CardDescription className="text-xs">Información adicional del personal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="poseeCarnetManejo" className="text-xs font-semibold">Posee Carnet de Manejo</Label>
                    <select
                      id="poseeCarnetManejo"
                      {...register('poseeCarnetManejo')}
                      className={selectClass(false)}
                      onChange={e => setPoseeCarnet(e.target.value === 'SI')}
                    >
                      <option value="NO">No</option>
                      <option value="SI">Sí</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="poseeCredencialPolicial" className="text-xs font-semibold">Posee Credencial Policial</Label>
                    <select id="poseeCredencialPolicial" {...register('poseeCredencialPolicial')} className={selectClass(false)}>
                      <option value="NO">No</option>
                      <option value="SI">Sí</option>
                    </select>
                  </div>
                </div>

                {/* Conduce checkboxes */}
                <AnimatePresence>
                  {poseeCarnet && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conduce</span>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { id: 'conduceAutos', label: 'Autos', reg: 'conduceAutos' },
                          { id: 'conduceMotos', label: 'Motos', reg: 'conduceMotos' },
                          { id: 'conduceOtros', label: 'Otros', reg: 'conduceOtros' },
                        ].map(item => (
                          <label key={item.id} htmlFor={item.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              id={item.id}
                              {...register(item.reg)}
                              className="w-4 h-4 text-police-cyan border-slate-300 rounded focus:ring-police-cyan"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fechas de alta */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium uppercase tracking-wider">Fechas de Alta</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="altaReparticion" className="text-xs font-semibold">Alta en la Repartición</Label>
                      <Input id="altaReparticion" type="date" {...register('altaReparticion')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="altaDepartamental" className="text-xs font-semibold">Alta Departamental</Label>
                      <Input id="altaDepartamental" type="date" {...register('altaDepartamental')} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ 7. Archivos Adjuntos ═══ */}
          <div ref={el => (sectionRefs.current.archivos = el)} data-section="archivos">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan flex items-center justify-center">
                    <Paperclip className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Archivos Adjuntos</CardTitle>
                    <CardDescription className="text-xs">Documentos relacionados (opcional)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  {...getArchivosRootProps()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-police-cyan hover:bg-police-cyan/5 transition-all group"
                >
                  <input {...getArchivosInputProps()} />
                  <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 group-hover:text-police-cyan transition-colors" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Click o arrastre archivos aquí
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, PNG, JPG — Máx 10MB c/u</p>
                </div>

                {archivos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="font-semibold">{archivos.length} archivo{archivos.length > 1 ? 's' : ''}</span>
                    </div>
                    {archivos.map((archivo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 group/file hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-police-cyan/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-police-cyan" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{archivo.name}</p>
                            <p className="text-xs text-slate-400">{(archivo.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setArchivos(prev => prev.filter((_, i) => i !== index))}
                          className="h-7 w-7 p-0 opacity-0 group-hover/file:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      {/* ── Sticky Footer ── */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
            Los campos marcados con <span className="text-red-400 font-bold">*</span> son obligatorios
          </p>
          <div className="flex gap-3 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              className="h-10 px-5 text-sm font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
              className="h-10 px-6 text-sm font-semibold bg-gradient-to-r from-police-navy to-police-cyan hover:from-police-navy-dark hover:to-police-cyan shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Registrar Personal
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalNew;
