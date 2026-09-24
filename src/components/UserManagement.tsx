import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Role } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  X,
  Building2,
  Mail,
  Hash,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserActive, changeUserRole, currentUser } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State for Add User
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [legajo, setLegajo] = useState('');
  const [role, setRole] = useState<Role>('USUARIO');
  const [department, setDepartment] = useState('Operaciones');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateUserForm = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio.';
    if (!lastName.trim()) errs.lastName = 'El apellido es obligatorio.';
    if (!email.trim() || !email.includes('@')) errs.email = 'Ingrese un email válido corporativo.';
    if (!legajo.trim()) errs.legajo = 'El legajo es obligatorio.';
    if (!department.trim()) errs.department = 'El departamento es obligatorio.';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    const res = addUser({
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      legajo: legajo.trim(),
      role,
      department: department.trim(),
      active: true,
    });

    if (res.success) {
      setName('');
      setLastName('');
      setEmail('');
      setLegajo('');
      setRole('USUARIO');
      setDepartment('Operaciones');
      setIsAddModalOpen(false);
      setFormErrors({});
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: editingUser.name,
      lastName: editingUser.lastName,
      email: editingUser.email,
      department: editingUser.department,
      role: editingUser.role,
    });
    setEditingUser(null);
  };

  const activeCount = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const employeeCount = users.filter((u) => u.role === 'USUARIO').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestión de Usuarios y Permisos (RBAC)
            </h1>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Vista Exclusiva Administrador
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administración de colaboradores, asignación de roles (Admin / Usuario) y control de estado de cuentas.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Dar de Alta Colaborador</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total de Usuarios</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{users.length}</div>
            <span className="text-[11px] text-emerald-600">{activeCount} activos actualmente</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Administradores</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{adminCount}</div>
            <span className="text-[11px] text-amber-600">Acceso total a la plataforma</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Empleados Operativos</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{employeeCount}</div>
            <span className="text-[11px] text-blue-600">Registro de eventos y bitácora propia</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            Nómina de Colaboradores Registrados
          </h3>
          <span className="text-xs text-slate-500">
            {users.length} usuarios en el sistema
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Legajo</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isMe = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Colaborador */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.name[0]}
                          {u.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name} {u.lastName}</span>
                            {isMe && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded">
                                Tú
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Legajo */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {u.legajo}
                    </td>

                    {/* Departamento */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {u.department}
                    </td>

                    {/* Rol Asignado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => changeUserRole(u.id, u.role === 'ADMIN' ? 'USUARIO' : 'ADMIN')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Haz clic para cambiar el rol del usuario"
                        >
                          {u.role === 'ADMIN' ? (
                            <>
                              <Shield className="w-3 h-3 text-amber-600" />
                              <span>Admin</span>
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3 text-slate-500" />
                              <span>Usuario</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                          u.active
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-slate-500 bg-slate-100 line-through'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {u.active ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingUser({ ...u })}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar colaborador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleUserActive(u.id)}
                          className={`p-1.5 rounded transition-colors ${
                            u.active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        {!isMe && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar a ${u.name} ${u.lastName}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Alta de Nuevo Usuario */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Dar de Alta Colaborador</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Marcelo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  {formErrors.name && (
                    <span className="text-rose-500 text-[10px] mt-0.5 block">{formErrors.name}</span>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Apellido <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej: Rossi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  {formErrors.lastName && (
                    <span className="text-rose-500 text-[10px] mt-0.5 block">{formErrors.lastName}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Corporativo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcelo.rossi@empresa.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                {formErrors.email && (
                  <span className="text-rose-500 text-[10px] mt-0.5 block">{formErrors.email}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Número de Legajo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={legajo}
                    onChange={(e) => setLegajo(e.target.value)}
                    placeholder="LEG-3015"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  {formErrors.legajo && (
                    <span className="text-rose-500 text-[10px] mt-0.5 block">{formErrors.legajo}</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rol Inicial <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  >
                    <option value="USUARIO">Empleado (Usuario)</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Departamento / Área <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ej: Operaciones, Soporte, Logística..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                {formErrors.department && (
                  <span className="text-rose-500 text-[10px] mt-0.5 block">{formErrors.department}</span>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  Guardar y Habilitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edición de Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Editar Colaborador</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Legajo</label>
                  <input
                    type="text"
                    value={editingUser.legajo}
                    onChange={(e) => setEditingUser({ ...editingUser, legajo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol / Permisos</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg cursor-pointer"
                  >
                    <option value="USUARIO">Empleado</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
