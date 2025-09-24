const { validationResult } = require('express-validator');
const formsService = require('../services/formsService');

function validateSchoolYear(sy) {
  return typeof sy === 'string' && /^\d{4}-\d{4}$/.test(sy.trim());
}

function ensureDatesValid(start_date, end_date) {
  if (!start_date || !end_date) return true;
  const s = new Date(start_date);
  const e = new Date(end_date);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
  return s.getTime() <= e.getTime();
}

module.exports = {
  // GET /api/v1/forms?active=true
  async listForms(req, res) {
    try {
      const active = String(req.query.active || '').toLowerCase() === 'true';
      const rows = await formsService.listForms({ active });
      return res.status(200).json({ status: 'ok', data: rows });
    } catch (err) {
      console.error('listForms error', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // GET /api/v1/forms/:id
  async getForm(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid form id' });
      }
      const form = await formsService.getFormById(id);
      if (!form) return res.status(404).json({ status: 'error', message: 'Form not found' });
      return res.status(200).json({ status: 'ok', data: form });
    } catch (err) {
      console.error('getForm error', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // POST /api/v1/forms
  async createForm(req, res) {
    try {
      const { title, school_year, semester, start_date, end_date } = req.body || {};
      const is_active = req.body?.is_active == null ? true : Boolean(req.body.is_active);

      if (!title || String(title).trim() === '') {
        return res.status(400).json({ status: 'error', message: 'title is required' });
      }
      if (!validateSchoolYear(school_year)) {
        return res.status(400).json({ status: 'error', message: 'school_year must match YYYY-YYYY' });
      }
      if (!ensureDatesValid(start_date, end_date)) {
        return res.status(400).json({ status: 'error', message: 'start_date must be <= end_date and both valid dates' });
      }

      const created_by = req.user?.user_id || null; // manual-review: if null, review later

      const created = await formsService.createForm({
        title: String(title).trim(),
        school_year: String(school_year).trim(),
        semester: semester != null ? String(semester).trim() : null,
        start_date,
        end_date,
        created_by,
        is_active,
      });
      return res.status(201).json({ status: 'ok', data: created });
    } catch (err) {
      console.error('createForm error', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // PATCH /api/v1/forms/:id
  async updateForm(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid form id' });
      }
      const updates = {};
      if (typeof req.body?.title === 'string') {
        if (req.body.title.trim() === '') return res.status(400).json({ status: 'error', message: 'title cannot be empty' });
        updates.title = req.body.title.trim();
      }
      if (typeof req.body?.school_year === 'string') {
        if (!validateSchoolYear(req.body.school_year)) return res.status(400).json({ status: 'error', message: 'school_year must match YYYY-YYYY' });
        updates.school_year = req.body.school_year.trim();
      }
      if (req.body?.semester != null) updates.semester = String(req.body.semester).trim();
      if (req.body?.start_date != null) updates.start_date = req.body.start_date;
      if (req.body?.end_date != null) updates.end_date = req.body.end_date;
      if (req.body?.is_active != null) updates.is_active = Boolean(req.body.is_active);

      if ((updates.start_date != null || updates.end_date != null)) {
        const s = updates.start_date ?? (await formsService.getFormById(id))?.start_date;
        const e = updates.end_date ?? (await formsService.getFormById(id))?.end_date;
        if (!ensureDatesValid(s, e)) return res.status(400).json({ status: 'error', message: 'start_date must be <= end_date and both valid dates' });
      }

      const updated = await formsService.updateForm(id, updates);
      if (!updated) return res.status(404).json({ status: 'error', message: 'Form not found' });
      return res.status(200).json({ status: 'ok', data: updated });
    } catch (err) {
      console.error('updateForm error', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // DELETE /api/v1/forms/:id (soft delete)
  async deleteForm(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid form id' });
      }
      const updated = await formsService.softDeleteForm(id);
      if (!updated) return res.status(404).json({ status: 'error', message: 'Form not found' });
      return res.status(200).json({ status: 'ok', data: updated });
    } catch (err) {
      console.error('deleteForm error', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};
