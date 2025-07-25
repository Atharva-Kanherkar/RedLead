// src/services/ai.service.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { AIUsageService } from './aitracking.service';

const prisma = new PrismaClient();

// Get API key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

// --- OPTIMIZATION: In-memory cache to store AI responses ---
// In a production, multi-server environment, you might replace this with a shared cache like Redis.
const aiCache = new Map<string, any>();
import { getAppAuthenticatedInstance } from './reddit.service'; // <-- IMPORT THE REDDIT SERVICE

/**
 * --- NEW & IMPROVED ---
 * Generates a list of relevant and *verified* subreddit suggestions.
 * It uses AI to get ideas and the Reddit API to confirm they are real.
 */
export const generateSubredditSuggestions = async (businessDescription: string): Promise<string[]> => {
    console.log('[Subreddit Suggestions] Starting process...');
    const cacheKey = `verified_subreddits_v2:${businessDescription.slice(0, 200)}`;
    if (aiCache.has(cacheKey)) {
        console.log('[CACHE HIT] for verified subreddit suggestions.');
        return aiCache.get(cacheKey);
    }

    // Step 1: Use AI to brainstorm a list of potential subreddits.
    const prompt = `You are a Reddit marketing expert. Based on the following business description, brainstorm a list of 15 to 20 potential subreddits where customers might be found. Include a mix of large and niche communities. Return the list as a simple comma-separated string of just the subreddit names (e.g., "gaming,playtoearn,web3"). Do not include "r/" or any other text. Business Description: "${businessDescription}"`;
    
    const result = await model.generateContent(prompt);
    const candidateSubreddits = result.response.text().split(',').map(s => s.trim()).filter(Boolean);
    console.log(`[Subreddit Suggestions] AI suggested ${candidateSubreddits.length} candidates.`);

    // Step 2: Use the Reddit API to verify which of these subreddits actually exist.
    const snoowrap = await getAppAuthenticatedInstance();
    const verifiedSubreddits: string[] = [];

    const verificationPromises = candidateSubreddits.map(async (name) => {
        try {
            //@ts-expect-error
            await snoowrap.getSubreddit(name).fetch();
            return name; // If fetch succeeds, the subreddit exists.
        } catch (error) {
            return null; // If fetch fails, it doesn't exist or is private/banned.
        }
    });

    const results = await Promise.all(verificationPromises);
    
    // Filter out the null results (non-existent subreddits)
    const finalSubreddits = results.filter((name): name is string => name !== null);

    console.log(`[Subreddit Suggestions] Verified ${finalSubreddits.length} real subreddits.`);
    
    aiCache.set(cacheKey, finalSubreddits);
    return finalSubreddits;
};

// --- All other functions remain the same ---
// ... (generateKeywords, generateDescription, etc.)
/**
 * Generates a list of keywords based on website text.
 */
export const generateKeywords = async (websiteText: string): Promise<string[]> => {
    const cacheKey = `keywords:${websiteText.slice(0, 200)}`;
    if (aiCache.has(cacheKey)) {
        console.log(`[CACHE HIT] for keywords.`);
        return aiCache.get(cacheKey);
    }

    const prompt = `Based on the following website text, Generate keywords that real Reddit users would naturally use in casual conversation, not technical marketing terms. Focus on problems people have and simple language    Return the list as a simple comma-separated string. Do not include any other text or explanation. Website Text: "${websiteText}"`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const keywords = text.split(',').map(k => k.trim());
    
    aiCache.set(cacheKey, keywords); // Store result in cache
    return keywords;
};

/**
 * Generates a company description based on website text.
 */
export const generateDescription = async (websiteText: string): Promise<string> => {
    const cacheKey = `description:${websiteText.slice(0, 200)}`;
    if (aiCache.has(cacheKey)) {
        console.log(`[CACHE HIT] for description.`);
        return aiCache.get(cacheKey);
    }

    const prompt = `You are a marketing expert. Based on the following website text, write a compelling, one-paragraph company description. Website Text: "${websiteText}"`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const description = response.text();

    aiCache.set(cacheKey, description); // Store result in cache
    return description;
};

 
/**
 * Analyzes a subreddit's rules and description to generate a summary of its culture.
 */
export const generateCultureNotes = async (description: string, rules: string[]): Promise<string> => {
    const cacheKey = `culture:${description.slice(0, 100)}:${rules.join(',')}`;
    if (aiCache.has(cacheKey)) {
        console.log(`[CACHE HIT] for culture notes.`);
        return aiCache.get(cacheKey);
    }
    
    const rulesText = rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n');
    const prompt = `You are a Reddit community analyst. Based on the following subreddit description and rules, provide a brief, one-paragraph summary of the community's culture and posting etiquette. Focus on the general vibe (e.g., "highly technical," "meme-friendly," "strictly moderated") and what a new user should know before posting.

Subreddit Description:
"${description}"

Subreddit Rules:
"${rulesText}"

Cultural Summary:`;

    const result = await model.generateContent(prompt);
    const cultureNotes = result.response.text().trim();

    aiCache.set(cacheKey, cultureNotes); // Store result in cache
    return cultureNotes;
};

/**
 * Generates multiple, context-aware reply options for a given lead.
 * This is user-initiated, so caching is less critical but can prevent accidental duplicate requests.
 */
export const generateAIReplies = async (
    leadTitle: string,
    leadBody: string | null,
    companyDescription: string,
    subredditCultureNotes: string,
    subredditRules: string[]
): Promise<string[]> => {
    const rulesText = subredditRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n');
    const prompt = `
You are a world-class Reddit marketing expert who specializes in subtle, helpful, and non-spammy engagement. Your primary goal is to be helpful to the user first, and promotional second.

**Your Task:**
Generate 3 distinct, high-quality response options to the following Reddit post.

**Context:**
1.  **The Lead's Post:**
    * Title: "${leadTitle}"
    * Body: "${leadBody}"

2.  **My Product/Company:**
    * Description: "${companyDescription}"

3.  **Subreddit Intelligence (CRITICAL):**
    * Culture & Vibe: "${subredditCultureNotes}"
    * Rules to Follow:
${rulesText}

**Instructions for Replies:**
-   Acknowledge the user's post directly.
-   Subtly connect their need to a feature of "My Product/Company".
-   Adhere strictly to the subreddit's culture and rules. If the culture is technical, be technical. If it's casual, be casual.
-   Do NOT use corporate jargon or sound like a press release.
-   Each reply option should have a slightly different tone (e.g., one purely helpful, one more direct, one asking a question).
-   Return the response as a JSON array of strings. Example: ["Response 1", "Response 2", "Response 3"]
`;
    // Since this is a highly dynamic prompt, we won't cache it to ensure fresh replies.
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse AI response as JSON:", responseText);
        return ["Sorry, I couldn't generate a valid response. Please try again."];
    }
};

/**
 * Refines a given text based on a specific instruction.
 */
export const refineAIReply = async (originalText: string, instruction: string): Promise<string> => {
    const prompt = `
You are a text editing assistant. Your task is to rewrite the following text based on the user's instruction.
Do not add any commentary or explanation. Only return the refined text.

**Original Text:**
"${originalText}"

**User's Instruction:**
"${instruction}"

**Refined Text:**`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
};

/**
 * Discovers potential competitor products or companies mentioned in a text.
 */
export const discoverCompetitorsInText = async (text: string, ownProductDescription: string): Promise<string[]> => {
    const cacheKey = `competitors:${text.slice(0, 200)}:${ownProductDescription.slice(0,100)}`;
    if (aiCache.has(cacheKey)) {
        console.log(`[CACHE HIT] for competitor discovery.`);
        return aiCache.get(cacheKey);
    }

    const prompt = `
You are a market intelligence analyst. Your task is to identify potential competitor products or companies mentioned in the provided text.

**My Product:**
"${ownProductDescription}"

**Text to Analyze:**
"${text}"

Based on my product description, analyze the text and extract the names of any other products or companies mentioned that seem to be in a similar market.
Return the list as a simple JSON array of strings. Example: ["Competitor A", "Product B"]. If no competitors are found, return an empty array [].
`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json\n?|\n?```/g, '');
    try {
        const competitors = JSON.parse(responseText);
        const competitorList = Array.isArray(competitors) ? competitors : [];
        aiCache.set(cacheKey, competitorList); // Store result in cache
        return competitorList;
    } catch {
        return []; // Return empty array if parsing fails
    }
};
// Replace the existing generateReplyOptions function (around line 140-170):
export const generateReplyOptions = async (leadId: string): Promise<string[]> => {
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
            campaign: { 
                include: { user: true }
            }
        }
    });

    if (!lead) {
        throw new Error('Lead not found.');
    }

    const user = lead.campaign.user;
    const aiUsage = AIUsageService.getInstance();

    // Check if user has AI reply quota
    const canUseAI = await aiUsage.trackAIUsage(user.id, 'manual_discovery', user.plan);
    if (!canUseAI) {
        throw new Error('AI reply quota exceeded. Upgrade your plan or wait for next month.');
    }

    // Generate replies only if quota allows
    const subredditProfile = await prisma.subredditProfile.findUnique({
        where: { name: lead.subreddit }
    });

    const companyDescription = lead.campaign.generatedDescription;
    const cultureNotes = subredditProfile?.cultureNotes ?? "Be respectful and helpful.";
    const rules = subredditProfile?.rules ?? ["No spam."];

    const replies = await generateAIReplies(
        lead.title,
        lead.body,
        companyDescription || "No company description available.",
        cultureNotes,
        rules
    );

    return replies;
};

/**
 * --- NEW: Fun Mode Reply Generator ---
 * Generates witty, off-topic replies that pivot back to the product.
 */
export const generateFunReplies = async (
    leadTitle: string,
    leadBody: string | null,
    companyDescription: string
): Promise<string[]> => {
    const prompt = `
    You are a hilarious and slightly unhinged AI marketing assistant running in "Fun Mode".
    Your task is to respond to a Reddit post that is COMPLETELY UNRELATED to the product you're promoting, but you must still promote the product.

    Here's the formula:
    1.  Acknowledge how hilariously unrelated the user's post is to your product.
    2.  Give some funny, slightly absurd, but well-meaning advice about their actual problem.
    3.  Seamlessly and absurdly pivot to promoting the product.

    **The Lead's Unrelated Post:**
    * **Title:** "${leadTitle}"
    * **Body:** "${leadBody}"

    **My Product to Promote:**
    * **Description:** "${companyDescription}"

    Generate 3 distinct, funny, and creative replies following this formula. Return the response as a JSON array of strings.
    Example Format: ["Reply 1", "Reply 2", "Reply 3"]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse AI response as JSON:", responseText);
        // Fallback with a fun, generic reply
        return [
            `I have absolutely no idea what's going on in your post about "${leadTitle}", but I can tell you that RedLead is the best way to get Reddit leads. You should check it out!`
        ];
    }
};


// Also update the analyzeLeadIntent function to track usage:
export const analyzeLeadIntent = async (title: string, body: string | null, userId: string, userPlan: string): Promise<string> => {
    const aiUsage = AIUsageService.getInstance();
    const canUseAI = await aiUsage.trackAIUsage(userId, 'intent', userPlan);
    
    if (!canUseAI) {
        // Fallback to basic intent analysis
        return determineBasicIntent(title, body);
    }
    
    const prompt = `Analyze the following Reddit post for user intent. Classify it as 'pain_point', 'solution_seeking', 'brand_comparison', or 'general_discussion'. Return only the single classification. Post Title: "${title}". Post Body: "${body}"`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
};

// Add this helper function for basic intent analysis:
function determineBasicIntent(title: string, body: string | null): string {
    const text = `${title} ${body || ''}`.toLowerCase();
    
    if (text.includes('help') || text.includes('recommend') || text.includes('suggest') || text.includes('looking for')) {
        return 'solution_seeking';
    }
    if (text.includes('vs') || text.includes('better than') || text.includes('alternative') || text.includes('compare')) {
        return 'brand_comparison';
    }
    if (text.includes('problem') || text.includes('issue') || text.includes('struggling') || text.includes('broken')) {
        return 'pain_point';
    }
    
    return 'general_discussion';
}

// Update analyzeSentiment to track usage:
export const analyzeSentiment = async (title: string, body: string | null, userId: string, userPlan: string): Promise<string> => {
    const aiUsage = AIUsageService.getInstance();
    const canUseAI = await aiUsage.trackAIUsage(userId, 'competitor', userPlan);
    
    if (!canUseAI) {
        // Fallback to basic sentiment analysis
        return determineBasicSentiment(title, body);
    }
    
    const prompt = `Analyze the sentiment of the following Reddit post. Is the user expressing a 'positive', 'negative', or 'neutral' opinion? Return only the single classification. Post Title: "${title}". Post Body: "${body}"`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().toLowerCase();
};

// Add basic sentiment analysis helper:
function determineBasicSentiment(title: string, body: string | null): string {
    const text = `${title} ${body || ''}`.toLowerCase();
    
    const positiveWords = ['love', 'great', 'awesome', 'excellent', 'amazing', 'perfect', 'good', 'best', 'fantastic'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'sucks', 'broken', 'useless', 'disappointed'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
}