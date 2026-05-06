import { pool } from '../config/db';
import { CreatePlantInput, VerifyPlantInput } from '../validators/plant.validator';

export async function getAllPlants(filters?: { status?: string; company_id?: number }) {
  let query = `
    SELECT ep.*, c.name AS company_name, c.registration_no
    FROM   EnergyPlant ep
    JOIN   Company c ON ep.company_id = c.company_id
    WHERE  1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.status) {
    query += ` AND ep.status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters?.company_id) {
    query += ` AND ep.company_id = $${idx++}`;
    params.push(filters.company_id);
  }

  query += ' ORDER BY ep.created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getPlantById(plant_id: number) {
  const result = await pool.query(
    `SELECT ep.*, c.name AS company_name
     FROM   EnergyPlant ep
     JOIN   Company c ON ep.company_id = c.company_id
     WHERE  ep.plant_id = $1`,
    [plant_id]
  );
  return result.rows[0] ?? null;
}

export async function createPlant(company_id: number, input: CreatePlantInput) {
  const result = await pool.query(
    `INSERT INTO EnergyPlant (company_id, name, type, capacity, location)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [company_id, input.name, input.type, input.capacity, input.location ?? null]
  );
  return result.rows[0];
}

// Calls the approve_energy_plant stored procedure
export async function verifyPlant(
  plant_id:     number,
  authority_id: number,
  input:        VerifyPlantInput
) {
  // PROCEDURE manages its own transaction (COMMIT/ROLLBACK internally)
  await pool.query(
    'CALL approve_energy_plant($1, $2, $3, $4)',
    [plant_id, authority_id, input.decision, input.remarks ?? null]
  );
  return getPlantById(plant_id);
}

export async function getPlantVerificationLog(plant_id: number) {
  const result = await pool.query(
    `SELECT pvl.*, ra.name AS authority_name
     FROM   PlantVerificationLog pvl
     JOIN   RegulatoryAuthority ra ON pvl.authority_id = ra.authority_id
     WHERE  pvl.plant_id = $1
     ORDER  BY pvl.action_date DESC`,
    [plant_id]
  );
  return result.rows;
}
