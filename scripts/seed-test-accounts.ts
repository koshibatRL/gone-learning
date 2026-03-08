import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local without dotenv dependency
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_ACCOUNTS = [
  {
    email: "admin@test.com",
    password: "password123",
    name: "テスト管理者",
    role: "admin" as const,
  },
  {
    email: "examinee@test.com",
    password: "password123",
    name: "テスト受験者",
    role: "examinee" as const,
  },
];

async function seed() {
  for (const account of TEST_ACCOUNTS) {
    // Create auth user
    const { data, error: authError } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        console.log(`[skip] ${account.email} already exists`);
        // Fetch existing user to upsert into users table
        const { data: listData } = await admin.auth.admin.listUsers();
        const existingUser = listData?.users.find(
          (u) => u.email === account.email
        );
        if (existingUser) {
          await admin.from("users").upsert(
            {
              id: existingUser.id,
              email: account.email,
              name: account.name,
              role: account.role,
            },
            { onConflict: "id" }
          );
          console.log(`[upsert] ${account.email} role=${account.role}`);
        }
        continue;
      }
      console.error(`[error] ${account.email}:`, authError.message);
      continue;
    }

    // Insert into users table
    const { error: dbError } = await admin.from("users").upsert(
      {
        id: data.user.id,
        email: account.email,
        name: account.name,
        role: account.role,
      },
      { onConflict: "id" }
    );

    if (dbError) {
      console.error(`[error] users table for ${account.email}:`, dbError.message);
      continue;
    }

    console.log(`[created] ${account.email} role=${account.role}`);
  }

  console.log("\nTest accounts:");
  console.log("  Admin:    admin@test.com / password123");
  console.log("  Examinee: examinee@test.com / password123");
}

seed().catch(console.error);
