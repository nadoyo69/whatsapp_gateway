<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">System Administrators & Users</h2>
        <p class="text-xs text-slate-400">Manage dashboard users, operators, and access permissions</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add User
      </button>
    </div>

    <!-- Users Table -->
    <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
            <tr>
              <th class="px-6 py-4">ID</th>
              <th class="px-6 py-4">Username</th>
              <th class="px-6 py-4">Email</th>
              <th class="px-6 py-4">Role</th>
              <th class="px-6 py-4">Created At</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2a3942]/60">
            <tr v-for="u in users" :key="u.id" class="hover:bg-[#202c33]/40 transition">
              <td class="px-6 py-4 font-mono text-slate-400">#{{ u.id }}</td>
              <td class="px-6 py-4 font-bold text-white">{{ u.username }}</td>
              <td class="px-6 py-4 text-slate-300">{{ u.email || '-' }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                  {{ u.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-400 font-mono text-[11px]">{{ formatDate(u.created_at) }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="openEdit(u)" class="text-xs text-blue-400 hover:underline">Edit</button>
                <button @click="deleteUser(u.id)" class="text-xs text-rose-400 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Create New User</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleCreateUser" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input v-model="userForm.username" type="text" required class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Email (Optional)</label>
            <input v-model="userForm.email" type="email" class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input v-model="userForm.password" type="password" required class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Role</label>
            <select v-model="userForm.role" class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none">
              <option value="admin">Administrator</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
            Save User
          </button>
        </form>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Edit User ({{ editUserForm.username }})</h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleUpdateUser" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input v-model="editUserForm.email" type="email" class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">New Password (Leave blank to keep current)</label>
            <input v-model="editUserForm.password" type="password" placeholder="••••••••" class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Role</label>
            <select v-model="editUserForm.role" class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none">
              <option value="admin">Administrator</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
            Update User
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { showSuccess, showError, confirmDialog, toastSuccess } from '../utils/alert';

const users = ref([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);

const userForm = ref({ username: '', email: '', password: '', role: 'admin' });
const editUserForm = ref({ id: null, username: '', email: '', password: '', role: 'admin' });

const fetchUsers = async () => {
  try {
    const res = await api.get('/users');
    if (res.data.success) {
      users.value = res.data.data;
    }
  } catch (err) {}
};

const handleCreateUser = async () => {
  try {
    await api.post('/users', userForm.value);
    showCreateModal.value = false;
    const name = userForm.value.username;
    userForm.value = { username: '', email: '', password: '', role: 'admin' };
    toastSuccess(`User "${name}" created successfully.`);
    fetchUsers();
  } catch (err) {
    showError('Create User Failed', err.response?.data?.message || 'Failed to create user.');
  }
};

const openEdit = (user) => {
  editUserForm.value = {
    id: user.id,
    username: user.username,
    email: user.email || '',
    password: '',
    role: user.role
  };
  showEditModal.value = true;
};

const handleUpdateUser = async () => {
  try {
    await api.put(`/users/${editUserForm.value.id}`, editUserForm.value);
    showEditModal.value = false;
    toastSuccess(`User updated successfully.`);
    fetchUsers();
  } catch (err) {
    showError('Update User Failed', err.response?.data?.message || 'Failed to update user.');
  }
};

const deleteUser = async (id) => {
  const confirmed = await confirmDialog(
    'Delete User Account?',
    'Are you sure you want to permanently delete this user account?',
    'Yes, Delete User',
    true
  );

  if (confirmed) {
    try {
      await api.delete(`/users/${id}`);
      toastSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Failed to delete user.');
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

onMounted(() => {
  fetchUsers();
});
</script>
