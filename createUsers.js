import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createUsers() {
  try {
    // Admin
    const { data: adminData, error: adminError } =
      await supabaseAdmin.auth.admin.createUser({
        email: "admin@test.com",
        password: "Senha123!",
        email_confirm: true,
        user_metadata: { role: "admin" }
      })
    if (adminError) throw adminError
    console.log("Admin criado:", adminData.user.id)

    // Atendente
    const { data: attendantData, error: attendantError } =
      await supabaseAdmin.auth.admin.createUser({
        email: "attendant@test.com",
        password: "Senha123!",
        email_confirm: true,
        user_metadata: { role: "attendant" }
      })
    if (attendantError) throw attendantError
    console.log("Atendente criado:", attendantData.user.id)

    // Cliente
    const { data: customerData, error: customerError } =
      await supabaseAdmin.auth.admin.createUser({
        email: "cliente@test.com",
        password: "Senha123!",
        email_confirm: true,
        user_metadata: { role: "customer" }
      })
    if (customerError) throw customerError
    console.log("Cliente criado:", customerData.user.id)
  } catch (err) {
    console.error("Erro ao criar usuários:", err)
  }
}

// Executar
createUsers()
