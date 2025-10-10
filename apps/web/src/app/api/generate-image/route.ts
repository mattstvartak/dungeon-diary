import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, isMap } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    let finalPrompt = ''

    if (isMap || prompt.toLowerCase().includes('map')) {
      // Special handling for maps with VERY specific style requirements for consistency
      finalPrompt = `A fantasy RPG map ${prompt}.

MANDATORY STYLE SPECIFICATIONS (follow EXACTLY for consistency):
1. VIEW: Strictly top-down, flat orthogonal view (absolutely NO perspective, NO isometric, NO 3D angles)
2. BACKGROUND: Aged parchment paper texture with cream/beige color (#F5E6D3), subtle brown stains and weathering
3. BORDER: Ornate decorative border with Celtic/medieval knotwork pattern in dark brown/black ink
4. CARTOGRAPHY STYLE: Hand-drawn medieval fantasy map aesthetic, similar to official D&D campaign setting maps from the 1980s-2000s
5. LINE WORK: Black ink outlines for all features, consistent line weight (2-3pt), hand-drawn appearance
6. TERRAIN COLORS:
   - Water/Seas: Light blue (#B8D4E8) with darker blue borders
   - Forests: Dark green (#4A7C59) tree symbols clustered together
   - Mountains: Brown/gray peaks (#8B7355) with shading
   - Grasslands: Light green/tan (#C8D7A8)
   - Roads: Thin dotted brown lines
7. LABELS: All text in serif font (similar to Caslon or Garamond), black ink, clearly legible at 14-16pt
8. LEGEND BOX: Rectangle in bottom-right corner with parchment background, ornate border, listing 5-8 numbered locations
9. COMPASS ROSE: Decorative 8-point rose in top-right corner, black ink with gold/red accents
10. SCALE BAR: Bottom-left corner, showing distance (e.g., "0 - 50 - 100 miles")
11. ICONS: Use consistent symbols:
    - Cities: Castle/tower icon
    - Towns: Building cluster icon
    - Villages: Small house icon
    - Dungeons: Cave/entrance icon
    - Points of interest: X or star marker
12. NO MODERN ELEMENTS: No satellite imagery, no modern fonts, no gradients, no photo-realistic rendering

Create a cohesive, authentic medieval fantasy map that looks like it was drawn by a professional cartographer for a D&D campaign setting book.`
    } else {
      // Regular illustration
      finalPrompt = `Illustration in the style of classic D&D campaign books and manuals: ${prompt}. Detailed fantasy artwork with rich colors, professional tabletop RPG illustration quality, reminiscent of Dungeons & Dragons official artwork.`
    }

    // Generate image using gpt-image-1
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: finalPrompt,
      n: 1,
      size: '1024x1024',
    })

    const imageUrl = response?.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image generated')
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
