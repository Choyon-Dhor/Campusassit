const ROLE_PERMISSIONS = {
  student: [
    'view_announcements',
    'view_classrooms',
    'download_resources',
    'upload_resources',
    'rate_resources',
    'create_study_group',
    'join_study_group',
    'book_consultation',
    'manage_deadlines',
    'view_recommendations',
  ],
  teacher: [
    'view_announcements',
    'post_announcement',
    'view_classrooms',
    'upload_resources',
    'download_resources',
    'manage_consultation_hours',
    'manage_appointments',
    'view_students',
  ],
  admin: [
    'view_announcements',
    'post_announcement',
    'delete_announcement',
    'manage_users',
    'upload_routine',
    'manage_rooms',
    'view_classrooms',
    'upload_resources',
    'download_resources',
    'delete_resources',
    'manage_study_groups',
    'view_all_deadlines',
    'manage_consultations',
    'view_analytics',
  ],
};

function formatUser(data) {
  if (!data?.role) throw new Error('Invalid user data: role is required');
  const role = data.role.toLowerCase();
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) throw new Error(`Unknown user role: ${data.role}`);

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role,
    department: data.department,
    avatar: data.avatar,
    student_number: data.student_number || null,
    batch_number: data.batch_number || null,
    batch_section: data.batch_section || null,
    permissions: perms,
    canDo: (action) => role === 'admin' || perms.includes(action),
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        email: this.email,
        role: this.role,
        department: this.department,
        avatar: this.avatar,
        student_number: this.student_number,
        batch_number: this.batch_number,
        batch_section: this.batch_section,
        permissions: this.permissions,
      };
    },
  };
}

const UserFactory = {
  create: formatUser,
  getDefaultPermissions: (role) => ROLE_PERMISSIONS[role?.toLowerCase()] || [],
};

module.exports = { UserFactory, formatUser, ROLE_PERMISSIONS };
