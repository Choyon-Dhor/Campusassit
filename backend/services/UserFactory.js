// ============================================================
// services/UserFactory.js — Factory Pattern for User Roles
// ============================================================

class BaseUser {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.department = data.department;
    this.avatar = data.avatar;
    this.created_at = data.created_at;
  }

  getPermissions() {
    return [];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      department: this.department,
      avatar: this.avatar,
      permissions: this.getPermissions(),
    };
  }
}

class StudentUser extends BaseUser {
  constructor(data) {
    super(data);
    this.role = 'student';
  }

  getPermissions() {
    return [
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
    ];
  }

  canDo(action) {
    return this.getPermissions().includes(action);
  }
}

class TeacherUser extends BaseUser {
  constructor(data) {
    super(data);
    this.role = 'teacher';
  }

  getPermissions() {
    return [
      'view_announcements',
      'post_announcement',
      'view_classrooms',
      'upload_resources',
      'download_resources',
      'manage_consultation_hours',
      'manage_appointments',
      'view_students',
    ];
  }

  canDo(action) {
    return this.getPermissions().includes(action);
  }
}

class AdminUser extends BaseUser {
  constructor(data) {
    super(data);
    this.role = 'admin';
  }

  getPermissions() {
    return [
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
    ];
  }

  canDo(action) {
    return true; // Admin can do everything
  }
}

// ============================================================
// UserFactory — creates correct user type from role
// ============================================================
class UserFactory {
  static create(userData) {
    if (!userData || !userData.role) {
      throw new Error('Invalid user data: role is required');
    }

    switch (userData.role.toLowerCase()) {
      case 'student':
        return new StudentUser(userData);
      case 'teacher':
        return new TeacherUser(userData);
      case 'admin':
        return new AdminUser(userData);
      default:
        throw new Error(`Unknown user role: ${userData.role}`);
    }
  }

  static getDefaultPermissions(role) {
    const tempUser = UserFactory.create({ id: 0, name: '', email: '', role });
    return tempUser.getPermissions();
  }
}

module.exports = { UserFactory, StudentUser, TeacherUser, AdminUser };
