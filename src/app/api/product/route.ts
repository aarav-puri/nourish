import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json(
      { error: 'Barcode parameter is required' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    // If product found, format it with Mistral AI
    if (data.status === 1 && data.product) {
      try {
        const formatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'}/api/format-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product: data.product }),
        })

        if (formatResponse.ok) {
          const { formatted } = await formatResponse.json()
          // Merge formatted data into product
          data.product.ai_formatted = formatted
        }
      } catch (formatError) {
        console.error('Failed to format product:', formatError)
        // Continue without formatting if it fails
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Open Food Facts API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
