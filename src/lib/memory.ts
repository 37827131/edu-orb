/**
 * EDU-ORB Conversation Memory System
 * 
 * Persists chat history, tracks topics discussed, and provides
 * contextual recall for better learning continuity.
 */

export interface MemoryMessage {
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

export interface TopicRecord {
  id: string;
  name: string;
  subject: string;
  board: string;
  classLevel: string;
  firstDiscussed: number;
  lastDiscussed: number;
  messageCount: number;
  keyConcepts: string[];
}

export interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  subject: string;
  board: string;
  classLevel: string;
  messages: MemoryMessage[];
  topicsDiscussed: string[];
  quizScore?: number;
}

export interface ConversationMemory {
  version: number;
  topics: TopicRecord[];
  sessions: SessionRecord[];
  totalMessages: number;
  lastActive: number;
}

const STORAGE_KEY = "edu-orb-memory";
const MAX_SESSIONS = 50; // Keep last 50 sessions
const MAX_MESSAGES_PER_SESSION = 100;
const MAX_TOPICS = 200;

/**
 * Loads conversation memory from localStorage.
 */
export function loadMemory(): ConversationMemory {
  if (typeof window === "undefined") {
    return createEmptyMemory();
  }
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyMemory();
    
    const parsed = JSON.parse(raw) as ConversationMemory;
    if (parsed.version !== 1) return createEmptyMemory();
    
    return parsed;
  } catch {
    return createEmptyMemory();
  }
}

/**
 * Saves conversation memory to localStorage.
 */
export function saveMemory(memory: ConversationMemory): void {
  if (typeof window === "undefined") return;
  
  try {
    // Trim old sessions
    const trimmedSessions = memory.sessions
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, MAX_SESSIONS);
    
    // Trim old topics
    const trimmedTopics = memory.topics
      .sort((a, b) => b.lastDiscussed - a.lastDiscussed)
      .slice(0, MAX_TOPICS);
    
    const trimmed: ConversationMemory = {
      ...memory,
      sessions: trimmedSessions,
      topics: trimmedTopics,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn("[memory] Failed to save:", error);
  }
}

/**
 * Creates empty memory structure.
 */
function createEmptyMemory(): ConversationMemory {
  return {
    version: 1,
    topics: [],
    sessions: [],
    totalMessages: 0,
    lastActive: Date.now(),
  };
}

/**
 * Adds a session to memory.
 */
export function addSession(
  memory: ConversationMemory,
  session: Omit<SessionRecord, "id" | "endTime">
): ConversationMemory {
  const newSession: SessionRecord = {
    ...session,
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    endTime: Date.now(),
  };
  
  return {
    ...memory,
    sessions: [...memory.sessions, newSession],
    totalMessages: memory.totalMessages + session.messages.length,
    lastActive: Date.now(),
  };
}

/**
 * Tracks a topic discussed in conversation.
 */
export function trackTopic(
  memory: ConversationMemory,
  topic: string,
  subject: string,
  board: string,
  classLevel: string,
  concepts: string[] = []
): ConversationMemory {
  const existing = memory.topics.find(
    (t) => t.name.toLowerCase() === topic.toLowerCase() && t.subject === subject
  );
  
  if (existing) {
    return {
      ...memory,
      topics: memory.topics.map((t) =>
        t.id === existing.id
          ? {
              ...t,
              lastDiscussed: Date.now(),
              messageCount: t.messageCount + 1,
              keyConcepts: [...new Set([...t.keyConcepts, ...concepts])].slice(0, 20),
            }
          : t
      ),
    };
  }
  
  const newTopic: TopicRecord = {
    id: `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: topic,
    subject,
    board,
    classLevel,
    firstDiscussed: Date.now(),
    lastDiscussed: Date.now(),
    messageCount: 1,
    keyConcepts: concepts.slice(0, 20),
  };
  
  return {
    ...memory,
    topics: [...memory.topics, newTopic],
  };
}

/**
 * Gets recent topics for a subject.
 */
export function getRecentTopics(
  memory: ConversationMemory,
  subject?: string,
  limit = 10
): TopicRecord[] {
  let topics = memory.topics;
  
  if (subject) {
    topics = topics.filter((t) => t.subject.toLowerCase() === subject.toLowerCase());
  }
  
  return topics
    .sort((a, b) => b.lastDiscussed - a.lastDiscussed)
    .slice(0, limit);
}

/**
 * Gets topic history for context.
 */
export function getTopicContext(
  memory: ConversationMemory,
  topic: string,
  subject: string
): TopicRecord | null {
  return (
    memory.topics.find(
      (t) =>
        t.name.toLowerCase() === topic.toLowerCase() &&
        t.subject.toLowerCase() === subject.toLowerCase()
    ) || null
  );
}

/**
 * Gets recent session messages for continuity.
 */
export function getRecentContext(
  memory: ConversationMemory,
  subject?: string,
  limit = 3
): MemoryMessage[] {
  let sessions = memory.sessions
    .filter((s) => s.messages.length > 0)
    .sort((a, b) => b.endTime - a.endTime);
  
  if (subject) {
    sessions = sessions.filter((s) => s.subject === subject);
  }
  
  const recentMessages: MemoryMessage[] = [];
  for (const session of sessions.slice(0, limit)) {
    recentMessages.push(...session.messages.slice(-10));
  }
  
  return recentMessages.slice(-20);
}

/**
 * Gets learning statistics.
 */
export function getStats(memory: ConversationMemory) {
  const totalTopics = memory.topics.length;
  const totalSessions = memory.sessions.length;
  const totalMessages = memory.totalMessages;
  
  const subjectCounts: Record<string, number> = {};
  for (const topic of memory.topics) {
    subjectCounts[topic.subject] = (subjectCounts[topic.subject] || 0) + 1;
  }
  
  const recentSessions = memory.sessions
    .sort((a, b) => b.endTime - a.endTime)
    .slice(0, 7);
  
  const avgQuizScore = recentSessions
    .filter((s) => s.quizScore !== undefined)
    .reduce((acc, s, _, arr) => acc + (s.quizScore || 0) / arr.length, 0);
  
  return {
    totalTopics,
    totalSessions,
    totalMessages,
    subjectCounts,
    avgQuizScore: Math.round(avgQuizScore),
    lastActive: memory.lastActive,
  };
}

/**
 * Builds context prompt for AI from memory.
 */
export function buildMemoryContext(memory: ConversationMemory, subject: string): string {
  const recentTopics = getRecentTopics(memory, subject, 5);
  const recentContext = getRecentContext(memory, subject, 2);
  
  if (recentTopics.length === 0 && recentContext.length === 0) {
    return "";
  }
  
  let context = "\n\n[STUDENT CONTEXT - Previous Learning]\n";
  
  if (recentTopics.length > 0) {
    context += "Recently covered topics:\n";
    for (const topic of recentTopics) {
      const daysSince = Math.floor((Date.now() - topic.lastDiscussed) / 86400000);
      context += `- ${topic.name} (${topic.keyConcepts.slice(0, 3).join(", ")}) - ${daysSince === 0 ? "today" : `${daysSince}d ago`}\n`;
    }
  }
  
  if (recentContext.length > 0) {
    context += "\nRecent conversation:\n";
    for (const msg of recentContext.slice(-6)) {
      context += `${msg.role}: ${msg.text.slice(0, 100)}...\n`;
    }
  }
  
  context += "\nRemember these topics and build upon them in your response.\n";
  
  return context;
}

/**
 * Extracts topics from a message (simple keyword extraction).
 */
export function extractTopics(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "both", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "because", "but", "and", "or",
    "if", "while", "about", "up", "it", "its", "this", "that", "these",
    "those", "i", "me", "my", "we", "our", "you", "your", "he", "him",
    "his", "she", "her", "they", "them", "their", "what", "which", "who",
    "whom", "explain", "tell", "show", "give", "help", "need", "want",
    "learn", "understand", "know", "think", "make", "use", "used",
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
  
  // Count word frequency and get top keywords
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}
