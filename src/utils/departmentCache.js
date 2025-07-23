import { supabase } from '../supabaseClient';

class DepartmentCache {
  constructor() {
    this.cache = new Map();
    this.fetchPromises = new Map();
  }

  async getDepartment(departmentId) {
    // Return from cache if available
    if (this.cache.has(departmentId)) {
      return this.cache.get(departmentId);
    }

    // If there's already a fetch in progress for this ID, wait for it
    if (this.fetchPromises.has(departmentId)) {
      return this.fetchPromises.get(departmentId);
    }

    // Start a new fetch
    const fetchPromise = this._fetchDepartment(departmentId);
    this.fetchPromises.set(departmentId, fetchPromise);

    try {
      const department = await fetchPromise;
      this.cache.set(departmentId, department);
      return department;
    } finally {
      this.fetchPromises.delete(departmentId);
    }
  }

  async getDepartments(departmentIds) {
    const uniqueIds = [...new Set(departmentIds)];
    const uncachedIds = uniqueIds.filter(id => !this.cache.has(id));

    if (uncachedIds.length > 0) {
      const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .in('department_id', uncachedIds);

      departments?.forEach(dept => {
        this.cache.set(dept.department_id, dept);
      });
    }

    return uniqueIds.map(id => this.cache.get(id));
  }

  async _fetchDepartment(departmentId) {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('department_id', departmentId)
      .single();

    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export a singleton instance
export const departmentCache = new DepartmentCache(); 