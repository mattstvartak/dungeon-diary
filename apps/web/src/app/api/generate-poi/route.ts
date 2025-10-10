import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, locationId, campaignId } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate POI details based on user prompt
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

    return NextResponse.json(generatedData)
  } catch (error) {
    console.error('Error generating POI:', error)
    return NextResponse.json(
      { error: 'Failed to generate POI' },
      { status: 500 }
    )
  }
}
