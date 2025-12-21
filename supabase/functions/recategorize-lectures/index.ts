
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.87.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Available categories for Islamic lectures
const CATEGORIES = [
  'Aqeedah',
  'Fiqh',
  'Hadith Studies',
  'Quran Studies',
  'Seerah',
  'Islamic History',
  'Spirituality & Heart',
  'Personal Development',
  'Family & Relationships',
  'Contemporary Issues',
  'Dawah',
  'Akhirah',
  'Knowledge & Learning',
  'Khutbah & Sermons',
  'Ummah & Unity',
  'Women in Islam',
  'Comparative Religion',
  'Ruqyah & Protection',
  'Personal Stories',
  'Islamic Teachings'
];

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  scholar_name: string | null;
  category: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request parameters
    const { batchSize = 10, startIndex = 0 } = await req.json().catch(() => ({}));

    // Fetch lectures that need recategorization
    const { data: lectures, error: fetchError } = await supabase
      .from('lectures')
      .select('id, title, description, scholar_name, category')
      .order('created_at', { ascending: true })
      .range(startIndex, startIndex + batchSize - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch lectures: ${fetchError.message}`);
    }

    if (!lectures || lectures.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No more lectures to process',
          processed: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${lectures.length} lectures starting from index ${startIndex}`);

    // Process lectures in batches
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const lecture of lectures) {
      try {
        const category = await categorizeLecture(lecture, openaiApiKey);
        
        // Update the lecture with the new category
        const { error: updateError } = await supabase
          .from('lectures')
          .update({ category })
          .eq('id', lecture.id);

        if (updateError) {
          console.error(`Failed to update lecture ${lecture.id}:`, updateError);
          errorCount++;
          results.push({
            id: lecture.id,
            title: lecture.title,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`Updated lecture "${lecture.title}" to category: ${category}`);
          successCount++;
          results.push({
            id: lecture.id,
            title: lecture.title,
            oldCategory: lecture.category,
            newCategory: category,
            success: true
          });
        }
      } catch (error) {
        console.error(`Error processing lecture ${lecture.id}:`, error);
        errorCount++;
        results.push({
          id: lecture.id,
          title: lecture.title,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: lectures.length,
        successCount,
        errorCount,
        nextStartIndex: startIndex + batchSize,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recategorize-lectures:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function categorizeLecture(lecture: Lecture, openaiApiKey: string): Promise<string> {
  const prompt = `You are an Islamic scholar assistant helping to categorize Islamic lectures. 

Analyze the following lecture and assign it to ONE of these categories:
${CATEGORIES.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

Lecture Title: ${lecture.title}
${lecture.description ? `Description: ${lecture.description}` : ''}
${lecture.scholar_name ? `Scholar: ${lecture.scholar_name}` : ''}

Guidelines:
- "Quran Studies" is ONLY for lectures specifically about Quranic exegesis, tafsir, or detailed Quranic analysis
- "Fajr Reflections" or sermons discussing Quranic verses but focusing on life lessons should be categorized by their main topic (e.g., Personal Development, Spirituality & Heart, Family & Relationships)
- "Khutbah & Sermons" is for Friday sermons and general religious sermons
- "Spirituality & Heart" is for lectures about purifying the heart, taqwa, ihsan, and spiritual growth
- "Personal Development" is for self-improvement, character building, and practical life guidance
- "Contemporary Issues" is for modern-day challenges, social issues, and current events from an Islamic perspective
- "Aqeedah" is for Islamic creed and belief system
- "Fiqh" is for Islamic jurisprudence and rulings
- "Seerah" is for the biography of Prophet Muhammad (peace be upon him)
- "Islamic History" is for historical events and figures in Islam
- "Family & Relationships" is for marriage, parenting, and family dynamics
- "Dawah" is for calling to Islam and interfaith dialogue
- "Akhirah" is for the afterlife, death, and the Day of Judgment

Respond with ONLY the category name, nothing else.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Islamic scholar assistant. Respond only with the category name.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const category = data.choices[0].message.content.trim();

    // Validate that the category is in our list
    if (!CATEGORIES.includes(category)) {
      console.warn(`AI returned invalid category "${category}" for lecture "${lecture.title}". Using fallback.`);
      // Fallback logic based on title keywords
      return fallbackCategorization(lecture);
    }

    return category;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Use fallback categorization if AI fails
    return fallbackCategorization(lecture);
  }
}

function fallbackCategorization(lecture: Lecture): string {
  const title = lecture.title.toLowerCase();
  const description = (lecture.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  // Keyword-based categorization
  if (combined.includes('tafsir') || combined.includes('quranic exegesis')) {
    return 'Quran Studies';
  }
  if (combined.includes('aqeedah') || combined.includes('creed') || combined.includes('belief')) {
    return 'Aqeedah';
  }
  if (combined.includes('fiqh') || combined.includes('ruling') || combined.includes('halal') || combined.includes('haram')) {
    return 'Fiqh';
  }
  if (combined.includes('hadith')) {
    return 'Hadith Studies';
  }
  if (combined.includes('seerah') || combined.includes('prophet muhammad') || combined.includes('prophet\'s life')) {
    return 'Seerah';
  }
  if (combined.includes('marriage') || combined.includes('family') || combined.includes('parenting') || combined.includes('relationship')) {
    return 'Family & Relationships';
  }
  if (combined.includes('heart') || combined.includes('taqwa') || combined.includes('ihsan') || combined.includes('spiritual')) {
    return 'Spirituality & Heart';
  }
  if (combined.includes('death') || combined.includes('afterlife') || combined.includes('jannah') || combined.includes('jahannam') || combined.includes('day of judgment')) {
    return 'Akhirah';
  }
  if (combined.includes('dawah') || combined.includes('calling to islam')) {
    return 'Dawah';
  }
  if (combined.includes('khutbah') || combined.includes('friday sermon') || combined.includes('jummah')) {
    return 'Khutbah & Sermons';
  }
  if (combined.includes('history') || combined.includes('companion') || combined.includes('sahaba')) {
    return 'Islamic History';
  }
  if (combined.includes('women') || combined.includes('sister')) {
    return 'Women in Islam';
  }
  if (combined.includes('modern') || combined.includes('contemporary') || combined.includes('today')) {
    return 'Contemporary Issues';
  }
  if (combined.includes('self') || combined.includes('improve') || combined.includes('success') || combined.includes('motivation')) {
    return 'Personal Development';
  }

  // Default to Islamic Teachings if no specific category matches
  return 'Islamic Teachings';
}
