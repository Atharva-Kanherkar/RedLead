// src/types/snoowrap.types.ts

/**
 * Type definitions for snoowrap methods that are missing or incomplete
 *
 * Snoowrap's TypeScript definitions are incomplete, causing type errors.
 * These types match the actual runtime behavior.
 */

export interface RedditUser {
    name: string;
    link_karma: number;
    comment_karma: number;
    created_utc: number;
    id: string;
}

export interface RedditSubmission {
    id: string;
    title: string;
    selftext: string;
    author: {
        name: string;
        link_karma: number;
        comment_karma: number;
    };
    subreddit: {
        display_name: string;
    };
    permalink: string;
    created_utc: number;
    num_comments: number;
    upvote_ratio: number;
    url: string;
    link_id?: string;
}

export interface RedditComment {
    id: string;
    body: string;
    author: {
        name: string;
        link_karma: number;
        comment_karma: number;
    };
    subreddit: {
        display_name: string;
    };
    permalink: string;
    created_utc: number;
    link_id: string;
    name: string;
    score: number;
}

/**
 * Extended snoowrap instance with properly typed methods
 */
export interface SnoowrapExtended {
    getMe(): Promise<RedditUser>;
    getSubmission(id: string): {
        fetch(): Promise<RedditSubmission>;
    };
    getComment(id: string): {
        fetch(): Promise<RedditComment>;
        reply(text: string): Promise<RedditComment>;
    };
}
