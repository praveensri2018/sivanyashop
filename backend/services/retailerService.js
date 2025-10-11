// PLACE: backend/services/retailerService.js
const retailerRepo = require('../repositories/retailerRepo');
const bcrypt = require('bcrypt');

async function getAllRetailers() {
  return retailerRepo.fetchRetailers();
}

async function getRetailerById(id) {
  return retailerRepo.fetchRetailerById(id);
}

async function createRetailer({ name, email, password, isActive = true }) {
  // check existing
  const exists = await retailerRepo.findUserByEmail(email);
  if (exists) throw { status: 400, message: 'Email already exists' };

  const hash = await bcrypt.hash(password, 10);
  const user = await retailerRepo.createUser({ name, email, passwordHash: hash, role: 'RETAILER', isActive: isActive ? 1 : 0 });
  return user;
}

async function updateRetailer(id, { name, email, password, isActive }) {
  if (email) {
    const other = await retailerRepo.findUserByEmail(email);
    if (other && other.Id !== id) throw { status: 400, message: 'Email already used' };
  }
  let passwordHash;
  if (password) passwordHash = await bcrypt.hash(password, 10);
  return retailerRepo.updateUser(id, { name, email, passwordHash, isActive });
}

async function deleteRetailer(id) {
  // soft delete
  return retailerRepo.softDeleteUser(id);
}

module.exports = { getAllRetailers, getRetailerById, createRetailer, updateRetailer, deleteRetailer };
