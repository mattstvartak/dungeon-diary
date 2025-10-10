'use server'

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateWithAI(type: 'npc' | 'location' | 'item', prompt: string, fullDetails: boolean = false) {
  try {
    // For non-location types, prompt is required
    if (type !== 'location' && !prompt) {
      throw new Error('Prompt is required')
    }

    const systemPrompts = {
      npc: `You are a D&D world-building assistant. Generate a detailed NPC based on the user's description. Return a JSON object with these exact fields:
{
  "name": "Full name of the NPC",
  "race": "Race (e.g., Human, Elf, Dwarf)",
  "class_or_occupation": "Class or occupation",
  "description": "2-3 sentence general description",
  "personality": "Personality traits, quirks, and mannerisms",
  "appearance": "Physical description including clothing and distinguishing features",
  "location": "Where they can be found",
  "relationship": "Suggested relationship to the party (Ally, Enemy, Neutral, Quest Giver, etc.)",
  "notes": "Additional background, motivations, or secrets"
}`,
      location: fullDetails ? `You are a D&D world-building assistant. Generate a COMPREHENSIVE and DETAILED location based on the user's description. Fill ALL fields with rich, extensive content. Return a JSON object with these exact fields:
{
  "name": "Name of the location",
  "type": "Type of location (e.g., City, Forest, Dungeon, Tavern, Castle)",
  "region": "The larger region it belongs to (e.g., Sword Coast, Northern Mountains)",
  "climate": "Climate type (e.g., Temperate, Arctic, Tropical, Desert)",
  "population": "Population count and demographics (e.g., ~5,000 - mostly humans and dwarves)",
  "size": "Settlement size (Thorp, Hamlet, Village, Small Town, Large Town, Small City, Large City, or Metropolis)",
  "government": "Detailed description of how it's governed, who rules, political structure",
  "economy": "Main industries, trade goods, wealth level, economic activity",
  "defenses": "Walls, guards, military strength, magical wards, defenses in detail",
  "description": "Rich, detailed description of the location - at least 3-4 sentences",
  "atmosphere": "Detailed description of the mood, sights, sounds, smells, what it feels like to be there",
  "history": "Comprehensive history - founding, major events, how it came to be, important past events",
  "inhabitants": "Detailed breakdown of who lives here - races, factions, social classes, creatures",
  "points_of_interest": "Extensive list of notable buildings, landmarks, shops, districts, places to visit - be specific and detailed",
  "notable_npcs": "List of important NPCs found here with brief descriptions of each",
  "dangers": "Threats, hazards, monsters, environmental dangers, crime, conflicts",
  "hooks": "Multiple adventure hooks, rumors, quest ideas, opportunities - at least 3-5 specific hooks",
  "secrets": "Hidden information, mysteries, plot twists, secrets about the location",
  "notes": "Additional lore, interesting facts, cultural details"
}` : `You are a D&D world-building assistant. Generate a detailed location based on the user's description. Return a JSON object with these exact fields:
{
  "name": "Name of the location",
  "type": "Type of location (e.g., City, Forest, Dungeon, Tavern)",
  "description": "Detailed description of the location",
  "inhabitants": "Who or what lives here",
  "points_of_interest": "Notable features, landmarks, or places within this location",
  "notes": "History, secrets, quest hooks, or additional lore"
}`,
      item: `You are a D&D world-building assistant. Generate a detailed magic item or piece of loot based on the user's description. Return a JSON object with these exact fields:
{
  "name": "Name of the item",
  "type": "Type (e.g., Weapon, Armor, Wondrous Item, Potion)",
  "rarity": "Rarity (Common, Uncommon, Rare, Very Rare, Legendary, or Artifact)",
  "description": "Detailed description of the item's appearance",
  "properties": "Magical properties, abilities, bonuses, and how to use it",
  "value": "Approximate value in gold pieces",
  "notes": "History, lore, attunement requirements, or side effects"
}`
    }

    // Generate user prompt - if empty for location, create a random one
    let userPrompt = prompt
    if (type === 'location' && (!prompt || prompt.trim() === '')) {
      userPrompt = 'Generate a completely random and creative D&D location. Surprise me with something unique and interesting!'
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompts[type as keyof typeof systemPrompts]
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: type === 'location' && !prompt ? 1.0 : 0.8, // Higher temperature for random generation
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const generatedData = JSON.parse(content)
    return { success: true, data: generatedData }
  } catch (error) {
    console.error('Error generating with AI:', error)
    return { success: false, error: 'Failed to generate with AI' }
  }
}

export async function generateLocationEntities(locationData: {
  name: string
  type?: string
  inhabitants?: string
  population?: string
  pointsOfInterest?: string
}) {
  try {
    const { name, type, inhabitants, population, pointsOfInterest } = locationData

    const systemPrompt = `You are a D&D world-building assistant. Based on the location details provided, generate Points of Interest (POIs) and NPCs.

IMPORTANT: Generate NPCs with realistic D&D races based on the location's demographics. Follow these guidelines:
- Use the population/inhabitants description to determine racial makeup
- Common D&D races: Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn
- Cities typically have diverse populations
- Specific settlements may be race-dominated (e.g., Dwarven strongholds, Elven forests)
- NPCs should have appropriate classes/occupations for their roles
- Shopkeepers, bartenders, innkeepers should match the local demographics

Return a JSON object with this structure:
{
  "pois": [
    {
      "name": "POI name",
      "type": "Tavern|Shop|Temple|Guild Hall|Residence|Market|etc",
      "description": "Brief description",
      "services": "What's available here (for shops/taverns/services)",
      "npcs": [
        {
          "name": "NPC name appropriate for their race",
          "race": "Race based on location demographics",
          "class_or_occupation": "Appropriate occupation (Shopkeeper, Bartender, Innkeeper, Guard, Priest, etc)",
          "role": "Owner|Shopkeeper|Bartender|Guard|Resident|Patron",
          "description": "Brief description",
          "personality": "Brief personality",
          "appearance": "Brief physical description appropriate for their race"
        }
      ]
    }
  ]
}

GUIDELINES:
- Generate 3-8 POIs based on location size and type
- Each POI should have 1-3 NPCs
- Cities/towns: Taverns, shops, temples, guild halls
- Villages: General store, tavern, maybe a temple
- Dungeons: Guard posts, treasure rooms (with monster NPCs)
- Forests: Clearings, ancient trees, druid circles
- Ensure NPC races match the demographics described in inhabitants/population
- Give NPCs fitting names for their race (e.g., Thorin for Dwarf, Elara for Elf, John for Human)`

    const userPrompt = `Location: ${name}
Type: ${type || 'Unknown'}
Population/Inhabitants: ${inhabitants || population || 'Unknown'}
Points of Interest context: ${pointsOfInterest || 'Generate appropriate POIs for this location type'}

Generate POIs and NPCs for this location.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const generatedData = JSON.parse(content)
    return { success: true, data: generatedData }
  } catch (error) {
    console.error('Error generating location entities:', error)
    return { success: false, error: 'Failed to generate location entities' }
  }
}

export async function generatePOI(prompt: string) {
  try {
    if (!prompt) {
      throw new Error('Prompt is required')
    }

    const systemPrompt = `You are a D&D world-building assistant. Based on the user's description, generate a Point of Interest (POI) with detailed information.

Return a JSON object with this structure:
{
  "name": "POI name",
  "type": "Tavern|Shop|Temple|Guild Hall|Inn|Market|Dungeon|etc",
  "description": "Detailed description of the POI, including atmosphere, notable features, and what makes it unique"
}

GUIDELINES:
- Create a vivid, memorable name appropriate for a D&D setting
- Choose an appropriate type that matches the description
- Write a rich, atmospheric description (2-4 sentences)
- Include sensory details and unique characteristics
- Make it feel like a real place in a fantasy world`

    const userPrompt = `Generate a POI based on this description: ${prompt}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const generatedData = JSON.parse(content)
    return { success: true, data: generatedData }
  } catch (error) {
    console.error('Error generating POI:', error)
    return { success: false, error: 'Failed to generate POI' }
  }
}

export async function generateNPC(prompt: string) {
  try {
    if (!prompt) {
      throw new Error('Prompt is required')
    }

    const systemPrompt = `You are a D&D world-building assistant. Based on the user's description, generate a Non-Player Character (NPC) with detailed information.

Return a JSON object with this structure:
{
  "name": "Character name appropriate for their race",
  "race": "Human|Elf|Dwarf|Halfling|Gnome|Half-Elf|Half-Orc|Tiefling|Dragonborn|etc",
  "npc_type": "Ally|Enemy|Boss|Shopkeeper|Innkeeper|Bartender|Quest Giver|Guard|Merchant|Noble|Commoner|Patron|Contact|Informant|Neutral|Other",
  "class_or_occupation": "Specific occupation or class (e.g., Blacksmith, Wizard, Fighter, Merchant, etc)",
  "description": "Detailed description of the NPC's background, personality, and notable characteristics",
  "personality": "Brief personality traits and mannerisms",
  "appearance": "Physical description appropriate for their race"
}

GUIDELINES:
- Create a memorable name that fits the race and setting
- Choose an appropriate race for a D&D campaign
- Select a fitting NPC type based on their role
- Include specific occupation/class details
- Write a rich character description that brings them to life
- Include personality quirks and distinctive features
- Make appearance descriptions match the chosen race`

    const userPrompt = `Generate an NPC based on this description: ${prompt}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const generatedData = JSON.parse(content)
    return { success: true, data: generatedData }
  } catch (error) {
    console.error('Error generating NPC:', error)
    return { success: false, error: 'Failed to generate NPC' }
  }
}

export async function generateImage(prompt: string, isMap: boolean = false) {
  try {
    console.log('=== Image Generation Started ===')
    console.log('Prompt:', prompt)
    console.log('Is Map:', isMap)

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    let finalPrompt = ''

    if (isMap || prompt.toLowerCase().includes('map')) {
      // Map generation - clean, no borders or text
      finalPrompt = `A top-down fantasy RPG map showing ${prompt}. Hand-drawn medieval cartography style with parchment texture, showing terrain features like forests, mountains, water, and settlements. No text, no borders, no compass rose, no labels. Clean map illustration only.`
    } else {
      // Regular illustration - clean artwork, no text or borders
      finalPrompt = `A detailed fantasy illustration showing ${prompt}. Professional D&D artwork style with rich colors. Show the complete subject, do not crop. No text, no borders, no frames, no labels. Pure visual illustration only.`
    }

    console.log('Final prompt length:', finalPrompt.length)

    // Generate image using gpt-image-1 with WebP output
    console.log('Calling OpenAI images.generate with model: gpt-image-1')
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: finalPrompt,
      size: '1024x1024',
      quality: 'medium',
      output_format: 'webp',
      output_compression: 90,
    } as any) // Use 'as any' because TypeScript definitions may not be updated yet

    console.log('OpenAI Response received')
    console.log('Response has data:', !!response?.data?.[0])

    // gpt-image-1 returns base64 encoded image
    const base64Data = response?.data?.[0]?.b64_json

    if (!base64Data) {
      console.error('No base64 data in response!')
      console.error('Response data[0]:', JSON.stringify(response?.data?.[0], null, 2))
      throw new Error('No image generated')
    }

    console.log('Base64 data received, length:', base64Data.length)

    // Convert base64 to buffer (already in WebP format from OpenAI)
    const webpBuffer = Buffer.from(base64Data, 'base64')
    console.log('WebP buffer created, size:', webpBuffer.length, 'bytes')

    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
    const filePath = `generated-images/${filename}`

    console.log('Uploading to Supabase storage:', filePath)

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw uploadError
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl

    console.log('Public URL generated:', imageUrl)
    console.log('=== Image Generation Successful ===')

    return { success: true, imageUrl }
  } catch (error: any) {
    console.error('=== Image Generation Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Error status:', error?.status)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    console.error('Error stack:', error?.stack)

    return {
      success: false,
      error: `Failed to generate image: ${error?.message || 'Unknown error'}`
    }
  }
}
