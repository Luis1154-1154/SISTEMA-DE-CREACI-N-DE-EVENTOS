const Usuario = require('../models/Usuarios');
const bcrypt = require('bcryptjs');

exports.getAllUsuarios = (req, res) => {
  Usuario.getAllUsuarios((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.getUsuarioById = (req, res) => {
  const { id } = req.params;
  Usuario.getUsuarioById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json(results[0]);
  });
};

exports.updateClinicalObservations = (req, res) => {
  const { id } = req.params;
  const { clinicalObservations, clinical_observations: legacyClinicalObservations } = req.body || {};
  const payload = String(clinicalObservations || legacyClinicalObservations || '').trim();

  Usuario.updateClinicalObservations(id, payload, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Observaciones actualizadas' });
  });
};

exports.addUsuario = (req, res) => {
  const {
    name,
    phone,
    password,
    role,
    birthdate,
    sex,
    identification,
    occupation,
    allergies,
    blood_type,
    chronic_conditions,
    clinical_observations,
  } = req.body;
  if (!name || !phone) return res.status(400).json({ message: 'Nombre y teléfono son obligatorios' });
  Usuario.getUsuarioByPhoneOrName(phone, name, null, (checkErr, duplicates) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (duplicates && duplicates.length) {
      const duplicate = duplicates[0];
      if (duplicate.phone === phone) return res.status(400).json({ message: 'Ya existe un usuario con ese teléfono' });
      if (duplicate.name === name) return res.status(400).json({ message: 'Ya existe un usuario con ese nombre' });
      return res.status(400).json({ message: 'Ya existe un usuario duplicado' });
    }

    const hashed = password ? bcrypt.hashSync(password, 10) : null;
    Usuario.addUsuario(
      {
        name,
        phone,
        password: hashed,
        role,
        birthdate,
        sex,
        identification,
        occupation,
        allergies,
        blood_type,
        chronic_conditions,
        clinical_observations,
      },
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Usuario creado', id: result.insertId });
      },
    );
  });
};

exports.updateUsuario = (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    birthdate,
    sex,
    identification,
    occupation,
    allergies,
    blood_type,
    chronic_conditions,
    clinical_observations,
  } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ message: 'Nombre y teléfono son obligatorios' });
  }

  Usuario.getUsuarioByPhoneOrName(phone, name, id, (checkErr, duplicates) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (duplicates && duplicates.length) {
      const duplicate = duplicates[0];
      if (duplicate.phone === phone) return res.status(400).json({ message: 'Ya existe un usuario con ese teléfono' });
      if (duplicate.name === name) return res.status(400).json({ message: 'Ya existe un usuario con ese nombre' });
      return res.status(400).json({ message: 'Ya existe un usuario duplicado' });
    }

    Usuario.updateUsuario(
      id,
      {
        name,
        phone,
        birthdate,
        sex,
        identification,
        occupation,
        allergies,
        blood_type,
        chronic_conditions,
        clinical_observations,
      },
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Usuario actualizado' });
      },
    );
  });
};

exports.deleteUsuario = (req, res) => {
  const { id } = req.params;
  Usuario.deleteUsuario(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Usuario eliminado' });
  });
};
