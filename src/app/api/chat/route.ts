import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Build system prompt with context from scan history
    let systemPrompt = `You are a helpful AI assistant for BarcodeSense, a food scanning app. You help users understand their scanned products and make healthier choices.

You have access to the user's scan history including:
- Product names, barcodes, ingredients, and nutrition information
- AI insights like healthier alternatives, diet compatibility, eco-impact scores, and recipe suggestions

IMPORTANT FORMATTING RULES:
- Write in clean, professional prose without any markdown formatting
- Do NOT use asterisks, bold text, or special formatting characters
- Do NOT use bullet points with dashes or asterisks
- Use simple numbered lists when needed (1., 2., 3.)
- Write naturally as if speaking to someone in person
- Keep responses SHORT and CONCISE - 2-3 sentences maximum
- Get straight to the point without unnecessary details

When answering questions:
- Be brief and direct
- Reference specific products from their history when relevant
- Provide actionable insights
- Use a friendly, conversational tone
- If asked about products they haven't scanned, politely let them know you can only see their scan history`

    if (context) {
      systemPrompt += `\n\nUser's Scan History:\n${JSON.stringify(context, null, 2)}`
    }

    // Call Mistral API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Mistral API Error:', data)
      return NextResponse.json(
        { error: data.message || 'AI service error' },
        { status: response.status }
      )
    }

    // Clean up any remaining markdown formatting from the response
    if (data.choices?.[0]?.message?.content) {
      let cleanContent = data.choices[0].message.content

      // Remove bold/italic markdown
      cleanContent = cleanContent.replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
      cleanContent = cleanContent.replace(/\*([^*]+)\*/g, '$1')     // *italic*
      cleanContent = cleanContent.replace(/__([^_]+)__/g, '$1')     // __bold__
      cleanContent = cleanContent.replace(/_([^_]+)_/g, '$1')       // _italic_

      // Remove bullet points with dashes or asterisks, keep the text
      cleanContent = cleanContent.replace(/^\s*[-*]\s+/gm, '')

      // Clean up extra whitespace
      cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n')

      data.choices[0].message.content = cleanContent.trim()
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
