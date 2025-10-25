# BarcodeSense - Smart Food Scanner

An AI-powered food barcode scanner that helps you make healthier, more informed food choices. Upload barcode images to get instant product information plus unique AI-driven insights you won't find anywhere else.

## Features

- **Upload Barcode Images** - Upload photos of barcodes for instant scanning
- **Product Information** - Comprehensive data from Open Food Facts database
- **Nutritional Facts** - Detailed nutrition breakdown per 100g
- **AI Health Alternatives** - Get personalized healthier product recommendations
- **Mood-Based Suggestions** - Discover foods that match your mood and energy levels
- **Diet Compatibility** - Check if products match Vegan, Keto, Halal, Kosher, and more
- **Eco Impact Score** - Understand the environmental footprint of your food choices
- **Modern Dark UI** - Beautiful, responsive interface that works on all devices
- **Fast & Easy** - Get results in seconds with drag-and-drop support

## How to Use

1. Open `barcodesense.vercel.app` in a web browser
2. Click "Upload Barcode Image" to get started
3. Upload a photo of a barcode (or drag and drop)
4. View product information and nutritional facts
5. Explore AI-powered insights:
   - Find healthier alternatives
   - Get mood-based food recommendations
   - Check diet compatibility
   - See environmental impact scores

**Alternative:** Enter a barcode number manually if you know it

## Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection for API access
- **OpenRouter API key with credits** - Required for AI-powered features. Get one at [openrouter.ai](https://openrouter.ai)

## Local Development

1. Clone or download this repository
2. Create a `.env` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your-api-key-here
   APP_URL=your-app-url-here
   ```
3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
4. Visit `http://localhost:3000`

## Configuration

Set up your environment variables in `.env`:

- `OPENROUTER_API_KEY` - Your OpenRouter API key with credits for AI features (get one at [openrouter.ai](https://openrouter.ai))
- `APP_URL` - Your application URL (optional, defaults to vercel.app URL)
