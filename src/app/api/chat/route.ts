import { NextResponse } from 'next/server';

// This is a placeholder for the actual Gemini API integration
// You'll need to add your Gemini API key and implement the actual API calls

const WASTE_MANAGEMENT_RESPONSES = {
  recycling: [
    "Recycling helps reduce landfill waste and conserve natural resources.",
    "Common recyclable items include paper, cardboard, glass, metal, and most plastics.",
    "Always clean and dry recyclables before placing them in the recycling bin.",
    "Check your local recycling guidelines for specific accepted materials."
  ],
  composting: [
    "Composting is a natural process that turns organic waste into nutrient-rich soil.",
    "You can compost fruit and vegetable scraps, coffee grounds, eggshells, and yard waste.",
    "Avoid composting meat, dairy, and oily foods as they can attract pests.",
    "A balanced compost pile needs a mix of greens (nitrogen) and browns (carbon)."
  ],
  hazardous: [
    "Hazardous waste includes batteries, electronics, chemicals, and certain household products.",
    "Never dispose of hazardous waste in regular trash or down the drain.",
    "Many communities have special collection days or drop-off centers for hazardous waste.",
    "Always check the label for proper disposal instructions on hazardous materials."
  ],
  general: [
    "Proper waste management helps protect our environment and public health.",
    "The waste hierarchy prioritizes: reduce, reuse, recycle, and then dispose.",
    "Consider the environmental impact of your purchases to reduce waste generation.",
    "Many items can be repaired or repurposed instead of being thrown away."
  ]
};

export async function POST(req: Request) {
  try {
    const { message, imageUrl } = await req.json();

    // Simple keyword-based response system
    let responseContent = '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('recycl')) {
      responseContent = WASTE_MANAGEMENT_RESPONSES.recycling[
        Math.floor(Math.random() * WASTE_MANAGEMENT_RESPONSES.recycling.length)
      ];
    } else if (lowerMessage.includes('compost')) {
      responseContent = WASTE_MANAGEMENT_RESPONSES.composting[
        Math.floor(Math.random() * WASTE_MANAGEMENT_RESPONSES.composting.length)
      ];
    } else if (lowerMessage.includes('hazard') || lowerMessage.includes('chemical')) {
      responseContent = WASTE_MANAGEMENT_RESPONSES.hazardous[
        Math.floor(Math.random() * WASTE_MANAGEMENT_RESPONSES.hazardous.length)
      ];
    } else {
      responseContent = WASTE_MANAGEMENT_RESPONSES.general[
        Math.floor(Math.random() * WASTE_MANAGEMENT_RESPONSES.general.length)
      ];
    }

    // If there's an image, add image-specific response
    if (imageUrl) {
      responseContent += " I can see the image you've shared. For proper waste management, please ensure items are clean, dry, and properly sorted before disposal.";
    }

    const response = {
      role: 'assistant',
      content: responseContent,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 