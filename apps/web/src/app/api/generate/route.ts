import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { type, prompt, fullDetails } = await request.json()

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    // For non-location types, prompt is required
    if (type !== 'location' && !prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
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

    return NextResponse.json(generatedData)
  } catch (error) {
    console.error('Error generating with AI:', error)
    return NextResponse.json(
      { error: 'Failed to generate with AI' },
      { status: 500 }
    )
  }
}
