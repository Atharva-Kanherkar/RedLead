import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer';
import { log } from '../lib/logger';

// Configure axios with retry logic
axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        // Retry on network errors or 5xx errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status ?? 0) >= 500;
    },
    onRetry: (retryCount, error) => {
        log.warn('Scraper retrying request', {
            attempt: retryCount,
            error: error.message,
            url: error.config?.url
        });
    }
});

// Helper function to avoid repeating the parsing logic
const parseHtmlWithCheerio = (html: string): string => {
    const $ = cheerio.load(html);
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').text();
    const h2 = $('h2').text();
    
    let paragraphs = '';
    $('p').each((_i, elem) => {
        paragraphs += $(elem).text() + ' ';
    });

    const combinedText = `${title} ${description} ${h1} ${h2} ${paragraphs}`;
    return combinedText.replace(/\s+/g, ' ').trim();
};

/**
 * METHOD 1: FAST & SIMPLE SCRAPER (axios)
 * Fetches static HTML. Very fast, but fails on JavaScript-heavy sites.
 */
export const scrapeWebsiteTextSimple = async (url: string): Promise<string> => {
    try {
        log.debug('Starting simple scrape', { url });
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000 // 15 second timeout
        });
        const result = parseHtmlWithCheerio(html);
        log.debug('Simple scrape successful', { url, contentLength: result.length });
        return result;
    } catch (error) {
        log.error('Simple scrape failed', error instanceof Error ? error : new Error(String(error)), { url });
        throw new Error(`Could not fetch content from ${url}.`);
    }
};

/**
 * METHOD 2: ADVANCED & SLOW SCRAPER (Puppeteer)
 * Renders the page in a headless browser. Handles SPAs but is resource-intensive.
 */
export const scrapeWebsiteTextAdvanced = async (url: string): Promise<string> => {
    let browser: Browser | null = null;
    try {
        log.info('Starting advanced scrape with Puppeteer', { url });

        const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        };

        // Use system Chrome in production
        if (process.env.NODE_ENV === 'production') {
            launchOptions.executablePath = '/usr/bin/google-chrome';
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Set timeout and wait for page load
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const html = await page.content();
        const result = parseHtmlWithCheerio(html);

        log.info('Advanced scrape successful', { url, contentLength: result.length });
        return result;
    } catch (error) {
        log.error('Advanced scrape failed', error instanceof Error ? error : new Error(String(error)), { url });
        throw new Error(`Could not process the website ${url}.`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};