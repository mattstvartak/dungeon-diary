import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, poiId, locationId, campaignId } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate NPC details based on user prompt
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

    return NextResponse.json(generatedData)
  } catch (error) {
    console.error('Error generating NPC:', error)
    return NextResponse.json(
      { error: 'Failed to generate NPC' },
      { status: 500 }
    )
  }
}
