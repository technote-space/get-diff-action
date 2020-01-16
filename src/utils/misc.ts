import { Context } from '@actions/github/lib/context';
import { WebhookPayload } from '@actions/github/lib/interfaces';

export const getPayload = (context: Context): WebhookPayload => context.payload;
