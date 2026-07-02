// ========================================
// 🤖 AI CLASSIFIER
// Handles DeepSeek API calls for classification
// ========================================

export class AIClassifier {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-v4-flash';
        
        this.categoryKeywords = {
            'Religious': ['dua', 'aamal', 'quran', 'islamic', 'prayer', 'supplication', 'allah', 'prophet', 'surah', 'masjid', 'mosque', 'imam', 'ramadan', 'hajj', 'umrah', 'sunnah', 'hadith', 'taqwa', 'ibadah', 'dhikr', 'tawbah'],
            'Career': ['career', 'job', 'work', 'professional', 'indispensable', 'promotion', 'salary', 'interview', 'resume', 'linkedin', 'networking', 'leadership', 'management', 'skill', 'development', 'mentor', 'career path'],
            'Technology': ['tech', 'coding', 'programming', 'software', 'developer', 'ai', 'machine learning', 'data', 'cloud', 'api', 'framework', 'javascript', 'python', 'react', 'node', 'docker', 'kubernetes'],
            'Health': ['health', 'fitness', 'wellness', 'nutrition', 'exercise', 'mental health', 'medical', 'doctor', 'therapy', 'diet', 'yoga', 'meditation'],
            'Finance': ['finance', 'investing', 'stock', 'money', 'budget', 'saving', 'retirement', 'crypto', 'banking', 'tax', 'financial', 'wealth', 'market'],
            'Education': ['learn', 'study', 'course', 'tutorial', 'education', 'university', 'college', 'research', 'student', 'classroom', 'lecture', 'knowledge'],
            'Entertainment': ['movie', 'music', 'game', 'entertainment', 'streaming', 'netflix', 'youtube', 'podcast', 'comedy', 'drama', 'festival'],
            'News': ['news', 'breaking', 'headline', 'politics', 'world', 'local', 'current events', 'journalism', 'media', 'press'],
            'Shopping': ['shop', 'buy', 'product', 'amazon', 'ebay', 'deal', 'discount', 'coupon', 'sale', 'retail', 'cart', 'checkout'],
            'Travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'booking', 'tourist', 'adventure', 'destination', 'passport', 'backpacking'],
            'Social Media': ['social media', 'instagram', 'twitter', 'facebook', 'tiktok', 'snapchat', 'social network', 'influencer', 'like', 'share', 'post'],
            'Productivity': ['productivity', 'task', 'goal', 'focus', 'time management', 'workflow', 'organize', 'efficiency', 'habit', 'routine']
        };
    }
    
    async fetchPageMetadata(url) {
        try {
            const response = await fetch(url, {
                mode: 'no-cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) return null;
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const title = doc.querySelector('meta[property="og:title"]')?.content || 
                         doc.querySelector('title')?.textContent || '';
            const description = doc.querySelector('meta[name="description"]')?.content ||
                              doc.querySelector('meta[property="og:description"]')?.content || '';
            const keywords = doc.querySelector('meta[name="keywords"]')?.content || '';
            const h1 = doc.querySelector('h1')?.textContent || '';
            
            return {
                title: title.trim(),
                description: description.trim(),
                keywords: keywords.trim(),
                h1: h1.trim()
            };
        } catch (error) {
            console.error('Error fetching page metadata:', error);
            return null;
        }
    }
    
    async classifyBookmarks(bookmarks, categories) {
        if (!bookmarks || bookmarks.length === 0) return [];
        
        const results = [];
        const batchSize = Math.min(bookmarks.length, 10);
        const promises = [];
        
        for (let i = 0; i < Math.min(bookmarks.length, batchSize); i++) {
            promises.push(this.classifySingleBookmark(bookmarks[i], categories));
        }
        
        const classified = await Promise.all(promises);
        return classified;
    }
    
    async classifySingleBookmark(bookmark, categories) {
        let category = 'Uncategorized';
        let tags = [];
        
        const combinedText = [
            bookmark.title || '',
            bookmark.description || '',
            bookmark.url || ''
        ].join(' ').toLowerCase();
        
        // Keyword matching first
        let bestCategory = 'Uncategorized';
        let highestScore = 0;
        
        for (const [cat, keywords] of Object.entries(this.categoryKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
                if (combinedText.includes(keyword.toLowerCase())) {
                    score++;
                }
            }
            if (score > highestScore) {
                highestScore = score;
                bestCategory = cat;
            }
        }
        
        if (highestScore >= 2) {
            category = bestCategory;
        } else {
            try {
                const aiCategory = await this.classifyWithAI(combinedText, categories);
                if (aiCategory && aiCategory !== 'Uncategorized') {
                    category = aiCategory;
                }
            } catch (e) {
                // Fallback to keyword matching
            }
        }
        
        // Extract tags
        const words = combinedText.split(/\s+/);
        const stopWords = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
        
        const uniqueWords = words
            .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
            .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
            .slice(0, 10);
        
        tags = uniqueWords.slice(0, 2);
        
        if (category !== 'Uncategorized') {
            tags = [category, ...tags.slice(0, 1)];
        }
        
        return {
            category: category,
            tags: tags
        };
    }
    
    async classifyWithAI(text, categories) {
        try {
            const prompt = `Classify this text into one of these categories: ${categories.join(', ')}.
If none fit, return "Uncategorized".
Only return the category name, nothing else.

Text: ${text.slice(0, 300)}`;

            const response = await this.callDeepSeek(prompt);
            return response.trim();
        } catch (error) {
            console.error('Error in AI classification:', error);
            return 'Uncategorized';
        }
    }
    
    async getCategories(bookmarks) {
        if (!bookmarks || bookmarks.length === 0) return ['Uncategorized'];
        
        const sample = bookmarks.slice(0, 30);
        const titles = sample.map(b => b.title).join('\n');
        
        const prompt = `Based on these bookmark titles, suggest 8-12 broad categories that would organize them well.
Only return the category names, one per line, without numbers, hashtags, or extra text.
Titles:
${titles}`;
        
        try {
            const response = await this.callDeepSeek(prompt);
            const categories = response
                .split('\n')
                .map(line => line.replace(/^[\d\-\.]+\s*/, '').trim())
                .filter(line => line.length > 0 && !line.includes('#'))
                .slice(0, 12);
            
            const commonCategories = ['Uncategorized', 'Technology', 'Career', 'Health', 'Finance', 'Education'];
            const allCategories = [...new Set([...categories, ...commonCategories])];
            
            return allCategories;
        } catch (error) {
            console.error('Error getting categories:', error);
            return ['Uncategorized', 'Technology', 'Career', 'Health', 'Finance', 'Education'];
        }
    }
    
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['this','that','with','from','have','your','will','about','what','when','then','than','more','some','these','them','would','could','should','their','they','were','were','them','then','than','into','upon'].includes(word));
        
        const unique = [...new Set(words)];
        return unique.slice(0, 3);
    }
    
    async callDeepSeek(prompt) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful bookmark organizer. Return only the requested data without extra text or hashtags. Be fast and accurate.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 200
                })
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('DeepSeek API call failed:', error);
            throw error;
        }
    }
}