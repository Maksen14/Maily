// lib/llm.ts

export async function getSuggestedReplies(emailBody: string, userContext?: string): Promise<string[]> {
  try {
    // Create a prompt that includes user context if provided
    let promptContent = `Here's an email I received:

"${emailBody}"

`;

    // Add the user context if provided
    if (userContext && userContext.trim()) {
      promptContent += `My personal context: ${userContext.trim()}

`;
    }

    promptContent += `Please suggest 3 short, friendly replies.
Make each reply concise and direct, no more than 2-3 sentences.
DO NOT include any numbering (1., 2., etc.) or quotation marks in your replies.
${userContext ? 'Incorporate my personal context in the replies.' : ''}
Each reply should be on its own line, separated by line breaks.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-3-haiku-20240307",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: promptContent,
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Extract the content from Claude's response
    const content = data?.content?.[0]?.text || "";
    
    // Clean up the suggestions - split by newlines, remove empty lines
    // Remove any numbering (1., 2., etc.) and quotation marks 
    const suggestions = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove numbering like "1. " or "1) " etc.
        let cleaned = line.replace(/^\d+[\.\)]\s*/, '');
        // Remove quotation marks
        cleaned = cleaned.replace(/^["']|["']$/g, '');
        return cleaned;
      })
      .filter(line => line.length > 0)
      .slice(0, 3); // Ensure we only return max 3 suggestions
      
    return suggestions;
  } catch (error) {
    console.error("Error getting suggestions from AI:", error);
    return ["Sorry, I couldn't generate suggestions at this time."];
  }
}
  