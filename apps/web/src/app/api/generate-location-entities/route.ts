import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { locationData } = await request.json()

    if (!locationData) {
      return NextResponse.json(
        { error: 'Location data is required' },
        { status: 400 }
      )
    }

    const { name, type, inhabitants, population, pointsOfInterest } = locationData

    // Generate POIs and NPCs based on location details
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

    return NextResponse.json(generatedData)
  } catch (error) {
    console.error('Error generating location entities:', error)
    return NextResponse.json(
      { error: 'Failed to generate location entities' },
      { status: 500 }
    )
  }
}
