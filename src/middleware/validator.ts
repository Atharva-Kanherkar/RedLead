// src/middleware/validator.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

/**
 * Generic validation middleware factory
 * Validates request body, query params, or route params against a Joi schema
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown keys from the validated data
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            console.warn(`[VALIDATION ERROR] ${req.method} ${req.path}:`, errors);

            res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
            return;
        }

        // Replace the original data with the validated and sanitized data
        req[property] = value;
        next();
    };
};

// ========================================
// COMMON VALIDATION SCHEMAS
// ========================================

/**
 * Schema for website URL validation (onboarding)
 */
export const websiteAnalysisSchema = Joi.object({
    websiteUrl: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .required()
        .messages({
            'string.uri': 'Please provide a valid URL starting with http:// or https://',
            'any.required': 'Website URL is required'
        })
});

/**
 * Schema for completing onboarding
 */
export const completeOnboardingSchema = Joi.object({
    websiteUrl: Joi.string().uri().required(),
    generatedKeywords: Joi.array().items(Joi.string().min(1).max(100)).min(1).required(),
    generatedDescription: Joi.string().min(10).max(1000).required(),
    competitors: Joi.array().items(Joi.string().max(200)).optional().default([])
});

/**
 * Schema for MongoDB-style IDs (cuid format used by Prisma)
 */
const cuidRegex = /^c[a-z0-9]{24,}$/;
export const idParamSchema = Joi.object({
    id: Joi.string().pattern(cuidRegex).required().messages({
        'string.pattern.base': 'Invalid ID format'
    })
});

export const campaignIdParamSchema = Joi.object({
    campaignId: Joi.string().pattern(cuidRegex).required().messages({
        'string.pattern.base': 'Invalid campaign ID format'
    })
});

export const leadIdParamSchema = Joi.object({
    leadId: Joi.string().pattern(cuidRegex).required().messages({
        'string.pattern.base': 'Invalid lead ID format'
    })
});

/**
 * Schema for updating lead status
 */
export const updateLeadStatusSchema = Joi.object({
    status: Joi.string()
        .valid('new', 'saved', 'replied', 'ignored', 'archived')
        .required()
        .messages({
            'any.only': 'Status must be one of: new, saved, replied, ignored, archived'
        })
});

/**
 * Schema for generating AI reply
 */
export const generateReplySchema = Joi.object({
    leadId: Joi.string().pattern(cuidRegex).required(),
    context: Joi.string().max(500).optional().allow(''),
    funMode: Joi.boolean().optional().default(false)
});

/**
 * Schema for refining AI reply
 */
export const refineReplySchema = Joi.object({
    originalReply: Joi.string().min(10).max(2000).required(),
    instruction: Joi.string().min(3).max(500).required()
});

/**
 * Schema for webhook creation
 */
export const createWebhookSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
    type: Joi.string().valid('slack', 'discord', 'custom').required(),
    events: Joi.array().items(Joi.string().valid('new_lead', 'lead_replied', 'high_score_lead')).min(1).required(),
    filters: Joi.object().optional(),
    rateLimitMinutes: Joi.number().integer().min(0).max(1440).optional()
});

/**
 * Schema for updating webhook
 */
export const updateWebhookSchema = Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
    isActive: Joi.boolean().optional(),
    events: Joi.array().items(Joi.string().valid('new_lead', 'lead_replied', 'high_score_lead')).min(1).optional(),
    filters: Joi.object().optional(),
    rateLimitMinutes: Joi.number().integer().min(0).max(1440).optional()
}).min(1); // At least one field must be provided

/**
 * Schema for insight status update
 */
export const updateInsightStatusSchema = Joi.object({
    status: Joi.string().valid('NEW', 'VIEWED', 'ACTIONED', 'IGNORED').required()
});

/**
 * Schema for email settings
 */
export const emailSettingsSchema = Joi.object({
    email: Joi.string().email().required(),
    enabled: Joi.boolean().required()
});

/**
 * Schema for preparing reply tracking
 */
export const prepareReplyTrackingSchema = Joi.object({
    leadId: Joi.string().pattern(cuidRegex).required(),
    content: Joi.string().min(1).max(10000).required()
});
