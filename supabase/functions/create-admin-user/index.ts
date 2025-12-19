// Supabase Edge Function para criar/atualizar usuário admin
// Esta função deve ser chamada apenas por usuários autenticados com role 'admin'
// Ela usa a Service Role Key do Supabase que está disponível apenas no servidor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Service role key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { email, password, full_name } = body;

    if (!email) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: email",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar se usuário já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let authUser;
    let isNewUser = false;

    if (existingUser) {
      // Usuário já existe - atualizar
      const updateData: any = {
        email_confirm: true,
      };

      if (password) {
        updateData.password = password;
      }

      if (full_name) {
        updateData.user_metadata = {
          ...existingUser.user_metadata,
          full_name: full_name,
        };
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        updateData
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to update user: ${updateError.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      authUser = { user: updatedUser.user };
    } else {
      // Criar novo usuário
      isNewUser = true;

      // Gerar senha aleatória se não fornecida
      const finalPassword = password || generateRandomPassword();

      const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "Administrador",
        },
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!createdUser.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      authUser = { user: createdUser.user };
      
      // Armazenar senha gerada para retornar na resposta
      (authUser as any).generatedPassword = !password ? finalPassword : undefined;
    }

    // Criar ou atualizar perfil admin
    const { error: createProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authUser.user.id,
        email: email,
        full_name: full_name || authUser.user.user_metadata?.full_name || "Administrador",
        role: "admin",
        institution_id: null, // Admins não têm institution_id
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    if (createProfileError) {
      // Se for novo usuário e falhar ao criar perfil, fazer rollback
      if (isNewUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
      return new Response(
        JSON.stringify({ error: `Failed to create/update profile: ${createProfileError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        email: authUser.user.email,
        is_new_user: isNewUser,
        password: (authUser as any).generatedPassword, // Retornar senha apenas se foi gerada
        message: isNewUser ? "Usuário admin criado com sucesso" : "Usuário admin atualizado com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Gera uma senha aleatória segura
 */
function generateRandomPassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Garantir pelo menos um caractere de cada tipo
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Maiúscula
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Minúscula
  password += "0123456789"[Math.floor(Math.random() * 10)]; // Número
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Especial
  
  // Preencher o resto aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

