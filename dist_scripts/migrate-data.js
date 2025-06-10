import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
// --- Configuration ---
const dbConfig = {
    user: 'app_user',
    host: 'localhost',
    database: 'app_db',
    password: 'app_password',
    port: 5432,
};
const defaultPassword = 'password123'; // Default password for all migrated users
const saltRounds = 10;
// --- Mock Supabase Data (as if extracted) ---
// Replace with actual data extraction logic if connecting to Supabase
const mockSupabaseData = {
    institutions: [
        { id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', name: 'Centro Comunitário Mock 1', email: 'ccm1@example.com', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), address: 'Rua Instituição 1, 100', phone: '1111-1111', responsible_person: 'Resp Um' },
        { id: '2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bee', name: 'Associação Mock 2', email: 'am2@example.com', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), address: 'Rua Instituição 2, 200', phone: '2222-2222', responsible_person: 'Resp Dois' },
    ],
    profiles: [
        { id: 'a1b2c3d4-e5f6-4a9b-8c7d-000000000001', email: 'user1@example.com', full_name: 'User One', role: 'institution', institution_id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'a1b2c3d4-e5f6-4a9b-8c7d-000000000002', email: 'user2@example.com', full_name: 'User Two', role: 'admin', institution_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'a1b2c3d4-e5f6-4a9b-8c7d-000000000003', email: 'user3@example.com', full_name: 'User Three', role: 'institution', institution_id: '2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bee', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    families: [
        { id: 'faaaaaa1-bbfd-4b2d-9b5d-ab8dfbbd4bf0', family_name: 'Familia Silva Mock', main_cpf: '111.111.111-11', members_count: 4, address: 'Rua Mock 1, 123', is_blocked: false, block_reason: null, blocked_until: null, blocked_by_institution_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'faaaaaa2-bbfd-4b2d-9b5d-ab8dfbbd4bf1', family_name: 'Familia Santos Mock', main_cpf: '222.222.222-22', members_count: 3, address: 'Rua Mock 2, 456', is_blocked: true, block_reason: 'Aguardando documentação', blocked_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), blocked_by_institution_id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    // Add mock data for family_members, deliveries, delivery_items as needed
};
async function migrateData() {
    const pool = new Pool(dbConfig);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Starting data migration...');
        // --- Migrate Institutions ---
        console.log('Migrating institutions...');
        for (const inst of mockSupabaseData.institutions) {
            await client.query('INSERT INTO institutions (id, name, email, is_active, created_at, updated_at, address, phone, responsible_person) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING', [inst.id, inst.name, inst.email, inst.is_active, inst.created_at, inst.updated_at, inst.address || null, inst.phone || null, inst.responsible_person || null]);
        }
        console.log(`Processed ${mockSupabaseData.institutions.length} institutions.`);
        // --- Migrate Profiles (with password hashing) ---
        console.log('Migrating profiles and hashing passwords...');
        for (const profile of mockSupabaseData.profiles) {
            const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
            await client.query('INSERT INTO profiles (id, email, full_name, role, institution_id, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING', [profile.id, profile.email, profile.full_name, profile.role, profile.institution_id, hashedPassword, profile.created_at, profile.updated_at]);
        }
        console.log(`Processed ${mockSupabaseData.profiles.length} profiles.`);
        // --- Migrate Families ---
        console.log('Migrating families...');
        for (const family of mockSupabaseData.families) {
            await client.query('INSERT INTO families (id, family_name, main_cpf, members_count, address, is_blocked, block_reason, blocked_until, blocked_by_institution_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING', [family.id, family.family_name, family.main_cpf, family.members_count, family.address, family.is_blocked, family.block_reason, family.blocked_until, family.blocked_by_institution_id, family.created_at, family.updated_at]);
        }
        console.log(`Processed ${mockSupabaseData.families.length} families.`);
        // --- TODO: Migrate family_members ---
        // --- TODO: Migrate deliveries ---
        // --- TODO: Migrate delivery_items ---
        await client.query('COMMIT');
        console.log('Data migration completed successfully!');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during data migration:', error);
        throw error; // Rethrow to allow process.exit(1) in the caller
    }
    finally {
        client.release();
        await pool.end();
        console.log('Database connection closed.');
    }
}
migrateData().catch(err => {
    // console.error('Migration script failed:', err); // Already logged in migrateData
    process.exit(1);
});
