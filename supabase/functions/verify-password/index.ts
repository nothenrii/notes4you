// @ts-ignore: Deno types
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VerifyPasswordRequest {
  noteId: string;
  password: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple bcrypt verification using Web Crypto API compatible approach
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Try different bcrypt libraries until we find one that works
    try {
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      return await bcrypt.compareSync(password, hash);
    } catch (workerError) {
      console.log('v0.4.1 failed, trying v0.2.4:', workerError.message);
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.2.4/mod.ts");
      return await bcrypt.compare(password, hash);
    }
  } catch (error) {
    console.error('All bcrypt attempts failed:', error);
    // Fallback: if bcrypt fails, we can't verify - return false for security
    return false;
  }
}

Deno.serve(async (req: Request) => {
  console.log('Edge function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Handle different request body formats
    let noteId: string;
    let password: string;

    // Try to get body directly first (for Supabase client)
    try {
      const body = await req.json();
      console.log('Direct JSON body:', body);
      noteId = body.noteId;
      password = body.password;
    } catch (directJsonError) {
      console.log('Direct JSON failed, trying text approach:', directJsonError);

      // Fallback to text approach (for curl/direct HTTP calls)
      try {
        const requestText = await req.text();
        console.log('Raw request body:', requestText);
        console.log('Request body length:', requestText.length);

        if (!requestText || requestText.trim() === '') {
          throw new Error('Empty request body');
        }

        const body = JSON.parse(requestText);
        noteId = body.noteId;
        password = body.password;
      } catch (textError) {
        console.error('Both JSON and text parsing failed:', textError);
        return new Response(
          JSON.stringify({ error: 'Could not parse request body' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log('Request data:', { noteId, passwordLength: password?.length });

    if (!noteId || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing noteId or password' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with service role key for server-side access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch the note with password hash (only accessible server-side)
    console.log('Fetching note:', noteId);
    const { data: note, error } = await supabase
      .from('notes_for_zan')
      .select('password_hash')
      .eq('id', noteId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error: ' + error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!note) {
      console.log('Note not found');
      return new Response(
        JSON.stringify({ error: 'Note not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!note.password_hash) {
      console.log('Note is not password protected');
      return new Response(
        JSON.stringify({ error: 'Note is not password protected' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify password using bcrypt
    console.log('Verifying password');
    const isValid = await verifyPassword(password, note.password_hash);
    console.log('Password verification result:', isValid);

    return new Response(
      JSON.stringify({
        isValid,
        message: isValid ? 'Password verified' : 'Invalid password'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});