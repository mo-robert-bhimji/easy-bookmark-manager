// ========================================
// 🤖 AI CLASSIFIER - FIXED
// ========================================

export class AIClassifier {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-v4-flash';
        
        this.categoryKeywords = {
            'Social Media + Entertainment': [
                'social media', 'instagram', 'twitter', 'facebook', 'tiktok', 'snapchat',
                'social network', 'influencer', 'like', 'share', 'post', 'follow', 'trending',
                'hashtag', 'reel', 'stories', 'youtube', 'tumblr', 'pinterest', 'reddit',
                'discord', 'twitch', 'viral', 'content creator', 'influencer marketing',
                'social platform', 'online community', 'fan', 'engagement',
                'movie', 'music', 'game', 'entertainment', 'streaming', 'netflix',
                'podcast', 'comedy', 'drama', 'festival', 'concert', 'singer', 'band',
                'album', 'song', 'playlist', 'spotify', 'apple music', 'trailer', 'oscar',
                'television', 'tv show', 'series', 'binge', 'hollywood', 'bollywood',
                'actor', 'actress', 'director', 'cinema', 'theater', 'anime', 'manga',
                'gaming', 'video game', 'esports', 'fun', 'entertain'
            ],
            'Finance': [
                'finance', 'investing', 'stock', 'money', 'budget', 'saving', 'retirement',
                'crypto', 'banking', 'tax', 'financial', 'wealth', 'market', 'trading',
                'dividend', 'etf', 'mutual fund', 'index fund', 'portfolio', 'risk',
                'insurance', 'loan', 'mortgage', 'credit', 'debt', 'cash flow', 'net worth',
                'financial planning', 'wealth management', 'financial freedom', 'passive income',
                'interest', 'annual percentage', 'rate', 'investment', 'capital', 'fund'
            ],
            'Shopping': [
                'shop', 'buy', 'product', 'amazon', 'ebay', 'deal', 'discount', 'coupon',
                'sale', 'retail', 'cart', 'checkout', 'price', 'compare', 'reviews',
                'marketplace', 'walmart', 'target', 'best buy', 'etsy', 'shopify',
                'store', 'online store', 'ecommerce', 'shipping', 'free shipping',
                'return policy', 'customer service', 'fashion', 'electronics',
                'clothing', 'accessories', 'gadget', 'order', 'delivery', 'purchase'
            ],
            'Education': [
                'learn', 'study', 'course', 'tutorial', 'education', 'university', 'college',
                'research', 'student', 'classroom', 'lecture', 'knowledge', 'online learning',
                'coursera', 'udemy', 'edx', 'khan academy', 'educational', 'teacher',
                'school', 'academy', 'scholarship', 'degree', 'certificate', 'training',
                'elearning', 'distance learning', 'curriculum', 'lesson plan', 'tutor',
                'homework', 'assignment', 'exam', 'quiz', 'learning management system',
                'textbook', 'academic', 'science', 'math', 'history', 'language learning'
            ],
            'Technology': [
                'tech', 'coding', 'programming', 'software', 'developer', 'ai', 'machine learning',
                'data', 'cloud', 'api', 'framework', 'javascript', 'python', 'react', 'node',
                'docker', 'kubernetes', 'git', 'github', 'devops', 'linux', 'terminal', 'bash',
                'sql', 'database', 'backend', 'frontend', 'fullstack', 'web development', 'mobile app',
                'ios', 'android', 'swift', 'kotlin', 'java', 'c#', 'ruby', 'php', 'laravel',
                'django', 'flask', 'rails', 'vue', 'angular', 'typescript', 'html', 'css',
                'responsive', 'ux', 'ui', 'design system', 'wireframe', 'prototype',
                'algorithm', 'debugging', 'open source', 'stack overflow', 'tech news'
            ],
            'Health & Fitness': [
                'health', 'fitness', 'wellness', 'nutrition', 'exercise', 'mental health',
                'medical', 'doctor', 'therapy', 'diet', 'yoga', 'meditation', 'weight loss',
                'workout', 'gym', 'running', 'cardio', 'strength', 'healthy eating', 'recipes',
                'healthcare', 'patient', 'hospital', 'clinic', 'symptom', 'treatment', 'diagnosis',
                'disease', 'prevention', 'immunity', 'vitamins', 'supplements', 'sleep',
                'anxiety', 'depression', 'mindfulness', 'self care', 'mental wellness',
                'training', 'muscle', 'protein', 'bodybuilding', 'pilates', 'zumba',
                'health tips', 'healthy lifestyle', 'wellbeing', 'nutritionist', 'personal trainer'
            ],
            'Career': [
                'career', 'job', 'work', 'professional', 'promotion', 
                'salary', 'interview', 'resume', 'linkedin', 'networking', 'leadership', 
                'management', 'skill', 'development', 'mentor', 'career path', 'hiring',
                'recruiter', 'employee', 'employer', 'compensation', 'benefits', 'career change',
                'career advice', 'job search', 'cover letter', 'cv', 'job board', 'opportunity',
                'remote work', 'flexible', 'career growth', 'professional development', 'training',
                'certification', 'coach', 'mentoring', 'soft skills', 'work life balance',
                'employment', 'occupation', 'profession', 'career coach'
            ],
            'Productivity': [
                'productivity', 'task', 'goal', 'focus', 'time management', 'workflow',
                'organize', 'efficiency', 'habit', 'routine', 'project management', 'todo',
                'calendar', 'planning', 'schedule', 'deadline', 'prioritize', 'notion',
                'trello', 'asana', 'evernote', 'keep', 'notepad', 'brainstorm', 'mind map',
                'optimization', 'work smarter', 'hack', 'life hack', 'motivation', 'discipline',
                'productivity tools', 'tracking', 'performance', 'methodology', 'agile', 'scrum'
            ],
            'Religious': [
                'dua', 'aamal', 'quran', 'islamic', 'prayer', 'supplication', 'allah', 
                'prophet', 'surah', 'masjid', 'mosque', 'imam', 'ramadan', 'hajj', 'umrah', 
                'sunnah', 'hadith', 'taqwa', 'ibadah', 'dhikr', 'tawbah', 'salah', 'zakah',
                'sawm', 'hijab', 'halal', 'haram', 'muslim', 'islam',
                'bible', 'jesus', 'christian', 'church', 'pastor', 'sermon', 'worship',
                'gospel', 'faith', 'god', 'lord', 'holy', 'spirit', 'grace',
                'religion', 'spiritual', 'meditation', 'zen', 'buddhist', 'hindu', 'jewish',
                'torah', 'scripture', 'devotional', 'ministry', 'religion'
            ],
            'News': [
                'news', 'breaking', 'headline', 'politics', 'world', 'local', 'current events',
                'journalism', 'media', 'press', 'cnn', 'bbc', 'nytimes', 'washington post',
                'report', 'analysis', 'opinion', 'editorial', 'investigation', 'interview',
                'broadcast', 'newspaper', 'magazine', 'newsletter', 'trending', 'update',
                'coverage', 'story', 'exclusive', 'sources', 'breaking news', 'latest'
            ],
            'Travel': [
                'travel', 'trip', 'vacation', 'hotel', 'flight', 'booking', 'tourist',
                'adventure', 'destination', 'passport', 'backpacking', 'resort', 'airbnb',
                'flight tickets', 'cheap flights', 'baggage', 'check in', 'travel guide',
                'tour', 'hiking', 'beach', 'mountain', 'road trip', 'travel blog', 'itinerary',
                'wanderlust', 'explore', 'travel tips', 'luggage', 'travel insurance'
            ],
            'Cooking/Food': [
                'recipe', 'cooking', 'food', 'meal', 'dinner', 'lunch', 'breakfast',
                'dessert', 'baking', 'chef', 'kitchen', 'ingredient', 'spice', 'seasoning',
                'cook', 'grill', 'roast', 'bake', 'fry', 'steam', 'blend', 'mix',
                'soup', 'salad', 'pasta', 'rice', 'chicken', 'beef', 'pork', 'fish',
                'vegetarian', 'vegan', 'gluten free', 'healthy recipe', 'meal prep',
                'smoothie', 'juice', 'snack', 'appetizer', 'main course', 'side dish',
                'restaurant', 'food blog', 'foodie', 'food network', 'cooking show'
            ],
            'Sports': [
                'sports', 'football', 'soccer', 'basketball', 'baseball', 'hockey',
                'tennis', 'golf', 'swimming', 'track', 'cycling', 'running', 'marathon',
                'olympics', 'world cup', 'super bowl', 'nfl', 'nba', 'mlb', 'nhl', 'mls',
                'team', 'player', 'coach', 'game', 'match', 'tournament', 'championship',
                'league', 'stadium', 'athlete', 'training', 'sports news', 'score',
                'highlights', 'sports betting', 'fantasy football', 'sports analysis'
            ],
            'DIY/Crafts': [
                'diy', 'craft', 'handmade', 'homemade', 'creative', 'decor', 'paint',
                'woodworking', 'sewing', 'knitting', 'crochet', 'embroidery', 'quilting',
                'paper craft', 'origami', 'scrapbooking', 'jewelry making', 'beading',
                'pottery', 'clay', 'sculpture', 'drawing', 'sketch', 'watercolor',
                'paint', 'brush', 'canvas', 'art', 'artist', 'craft supply', 'tutorial',
                'step by step', 'do it yourself', 'home decor', 'upcycle', 'recycle'
            ],
            'Parenting/Family': [
                'parenting', 'parent', 'mother', 'father', 'mom', 'dad', 'family',
                'children', 'kids', 'baby', 'toddler', 'teen', 'child', 'infant',
                'pregnancy', 'newborn', 'breastfeeding', 'baby gear', 'stroller',
                'diaper', 'family activities', 'play', 'learning', 'education', 'school',
                'family time', 'bonding', 'parenting tips', 'mom blog', 'dad blog',
                'grandparent', 'relatives', 'family travel', 'family health', 'childcare'
            ]
        };
        
        // ----- Allowed categories list -----
        this.allowedCategories = [
            'To Review',
            'Career',
            'Education',
            'Finance',
            'Health & Fitness',
            'News',
            'Productivity',
            'Religious',
            'Shopping',
            'Social Media + Entertainment',
            'Technology',
            'Travel',
            'Cooking/Food',
            'Sports',
            'DIY/Crafts',
            'Parenting/Family'
        ];
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
        // Default category
        let category = 'To Review';
        let tags = [];
        
        const combinedText = [
            bookmark.title || '',
            bookmark.description || '',
            bookmark.url || ''
        ].join(' ').toLowerCase();
        
        // Keyword matching first
        let bestCategory = 'To Review';
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
                let aiCategory = await this.classifyWithAI(combinedText, categories);
                // Clean the AI response and validate it
                aiCategory = this.cleanCategoryName(aiCategory);
                
                if (aiCategory && aiCategory !== 'To Review') {
                    category = aiCategory;
                } else {
                    category = 'To Review';
                }
            } catch (e) {
                category = 'To Review';
            }
        }
        
        // Final validation - ensure category is in the allowed list
        if (!this.allowedCategories.includes(category)) {
            category = 'To Review';
        }
        
        // Extract tags
        const words = combinedText.split(/\s+/);
        const stopWords = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
        
        const uniqueWords = words
            .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
            .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
            .slice(0, 10);
        
        tags = uniqueWords.slice(0, 2);
        
        if (category !== 'To Review') {
            tags = [category, ...tags.slice(0, 1)];
        }
        
        return {
            category: category,
            tags: tags
        };
    }
    
    // ----- Helper: Clean category name -----
    cleanCategoryName(name) {
        if (!name) return 'To Review';
        let cleaned = name.trim();
        // Remove quotes
        cleaned = cleaned.replace(/^["']+|["']+$/g, '');
        // Remove extra spaces
        cleaned = cleaned.replace(/\s+/g, ' ');
        // Only allow letters, spaces, &, +, /, -
        cleaned = cleaned.replace(/[^a-zA-Z0-9\s&\+\/\-]/g, '');
        // If it's a single word or common word, check if it matches a real category
        return cleaned;
    }
    
    async classifyWithAI(text, categories) {
        try {
            const prompt = `Classify this text into one of these categories: ${categories.join(', ')}.
If none fit, return "To Review".
Only return the category name, nothing else.

Text: ${text.slice(0, 300)}`;

            const response = await this.callDeepSeek(prompt);
            return response.trim();
        } catch (error) {
            console.error('Error in AI classification:', error);
            return 'To Review';
        }
    }
    
    async getCategories(bookmarks) {
        if (!bookmarks || bookmarks.length === 0) return ['To Review'];
        
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
            
            const commonCategories = [
                'To Review',
                'Career',
                'Education',
                'Finance',
                'Health & Fitness',
                'News',
                'Productivity',
                'Religious',
                'Shopping',
                'Social Media + Entertainment',
                'Technology',
                'Travel',
                'Cooking/Food',
                'Sports',
                'DIY/Crafts',
                'Parenting/Family'
            ];
            const allCategories = [...new Set([...categories, ...commonCategories])];
            
            return allCategories;
        } catch (error) {
            console.error('Error getting categories:', error);
            return [
                'To Review',
                'Career',
                'Education',
                'Finance',
                'Health & Fitness',
                'News',
                'Productivity',
                'Religious',
                'Shopping',
                'Social Media + Entertainment',
                'Technology',
                'Travel',
                'Cooking/Food',
                'Sports',
                'DIY/Crafts',
                'Parenting/Family'
            ];
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