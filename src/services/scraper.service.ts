import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer';

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
        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        return parseHtmlWithCheerio(html);
    } catch (error) {
        console.error(`Simple scrape failed for ${url}:`, error);
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
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const html = await page.content();
        return parseHtmlWithCheerio(html);
    } catch (error) {
        console.error(`Advanced scrape failed for ${url}:`, error);
        throw new Error(`Could not process the website ${url}.`);
    } finally {
        if (browser) await browser.close();
    }
};