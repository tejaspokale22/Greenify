import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function callGeminiAPI(text: string, imageFile?: File) {
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  let imagePart = null;
  if (imageFile) {
    const base64 = await toBase64(imageFile);
    imagePart = {
      inline_data: {
        mime_type: imageFile.type,
        data: base64.split(',')[1],
      },
    };
  }

  const contents = [
    {
      parts: [
        {
          text: `You are an expert in waste management. Provide concise, practical answers (max 2-3 sentences) focused only on waste classification, recycling, and sustainability. If an image is provided, briefly identify the waste type and provide key disposal/recycling advice.`,
        },
        ...(imagePart ? [imagePart] : []),
        {
          text: text,
        },
      ],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    }
  );

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
} 